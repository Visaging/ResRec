import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, Database, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { appState } from '../../services/api';

interface GlobalCommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (recordId: string) => void;
}

export const GlobalCommandSearch: React.FC<GlobalCommandSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onViewEvidence,
}) => {
  const [query, setQuery] = useState('');
  const experiments = appState.getExperiments();
  const datasets = appState.getDatasets();
  const evidenceRecords = appState.getEvidenceRecords();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingExperiments = experiments.filter(
    (e) =>
      e.id.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.principalInvestigator.toLowerCase().includes(q)
  );

  const matchingDatasets = datasets.filter(
    (d) =>
      d.id.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      d.sha256.toLowerCase().includes(q)
  );

  const matchingEvidence = evidenceRecords.filter(
    (ev) =>
      ev.id.toLowerCase().includes(q) ||
      ev.eventType.toLowerCase().includes(q) ||
      ev.outputCommitment.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-xs animate-subtle-fade">
      <div
        className="w-full max-w-2xl bg-surface border border-default rounded shadow-elevated overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-subtle bg-surface-elevated">
          <Search className="w-4 h-4 text-muted-custom shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search experiments, datasets, CooL receipts, multihashes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-primary-custom placeholder:text-muted-custom focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-custom hover:text-primary-custom p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-muted-custom bg-surface px-1.5 py-0.5 rounded border border-subtle ml-2">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Section: Experiments */}
          {matchingExperiments.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-custom flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3 text-accent-primary" />
                <span>Experiments ({matchingExperiments.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchingExperiments.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => {
                      onNavigate('experiment-detail', { id: exp.id });
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-surface-elevated flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-primary-custom flex items-center gap-2">
                        <span className="font-mono text-xs">{exp.id}</span>
                        <span>•</span>
                        <span className="truncate">{exp.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-custom">
                        PI: {exp.principalInvestigator} • {exp.institution}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Datasets */}
          {matchingDatasets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-custom flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Datasets ({matchingDatasets.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchingDatasets.map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => {
                      onNavigate('experiment-detail', { id: ds.experimentId, tab: 'datasets' });
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-surface-elevated flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-primary-custom flex items-center gap-2 font-mono">
                        <span>{ds.fileName}</span>
                        <span className="text-[10px] text-muted-custom font-normal">({ds.version})</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-custom truncate">
                        SHA-256: {ds.sha256}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Evidence Records */}
          {matchingEvidence.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-custom flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>CooL Evidence Records ({matchingEvidence.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchingEvidence.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      onViewEvidence(ev.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-surface-elevated flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-primary-custom flex items-center gap-2 font-mono">
                        <span className="text-accent-primary">{ev.id}</span>
                        <span className="text-muted-custom font-normal">• {ev.eventType}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-custom truncate">
                        Commitment: {ev.outputCommitment}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingExperiments.length === 0 &&
            matchingDatasets.length === 0 &&
            matchingEvidence.length === 0 && (
              <div className="py-8 text-center text-muted-custom">
                No research records match "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-surface-inset border-t border-subtle flex items-center justify-between text-[11px] text-muted-custom">
          <span>Navigate with arrow keys • Press Enter to select</span>
          <span className="font-mono">ResRec Evidence Node v3.2</span>
        </div>
      </div>
    </div>
  );
};
