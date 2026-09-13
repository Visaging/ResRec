import React, { useState } from 'react';
import { ProvenanceTab } from './ProvenanceTab';
import { appState } from '../../services/api';

interface ProvenancePageProps {
  onNavigate?: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const ProvenancePage: React.FC<ProvenancePageProps> = ({ onViewEvidence }) => {
  const experiments = appState.getExperiments();
  const [selectedExpId, setSelectedExpId] = useState(experiments[0]?.id || 'EXP-2026-0042');

  const currentExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  return (
    <div className="space-y-5 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Scientific Provenance & Lineage
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Trace published research claims and figures back to underlying raw sensor acquisitions.
          </p>
        </div>

        {/* Experiment Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-custom font-medium">Experiment:</span>
          <select
            value={selectedExpId}
            onChange={(e) => setSelectedExpId(e.target.value)}
            className="rounded border border-default bg-surface py-1.5 px-3 text-xs font-mono font-semibold text-primary-custom focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            {experiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.id} — {exp.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Provenance Tab Content */}
      {currentExp && (
        <ProvenanceTab experiment={currentExp} onViewEvidence={onViewEvidence} />
      )}
    </div>
  );
};
