import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { DatasetDetailModal } from './DatasetDetailModal';
import { appState } from '../../services/api';
import type { Dataset } from '../../types';

interface DatasetsPageProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onOpenImportDataset?: () => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  onNavigate,
  onOpenImportDataset,
  onViewEvidence,
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>(appState.getDatasets());
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTampered, setIsTampered] = useState<boolean>(appState.getIsTamperSimulated());

  useEffect(() => {
    return appState.subscribe(() => {
      setDatasets(appState.getDatasets());
      setIsTampered(appState.getIsTamperSimulated());
    });
  }, []);

  const filteredDatasets = datasets.filter(
    (d) =>
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.experimentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sha256.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Dataset Repository & Commitments
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Global institutional registry of research datasets with immutable CooL multihash commitments.
          </p>
        </div>
        {onOpenImportDataset && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenImportDataset}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Import & Commit Dataset
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search dataset file name, experiment ID, or SHA-256 hash..."
      />

      {/* Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Dataset File</th>
                <th className="px-4 py-3 font-semibold">Experiment</th>
                <th className="px-4 py-3 font-semibold">Version</th>
                <th className="px-4 py-3 font-semibold">Records</th>
                <th className="px-4 py-3 font-semibold">CooL Multihash Commitment</th>
                <th className="px-4 py-3 font-semibold">Integrity Status</th>
                <th className="px-4 py-3 font-semibold">Evidence ID</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredDatasets.map((ds) => {
                const isDsTampered = isTampered && ds.experimentId === 'EXP-2026-0042';
                return (
                  <tr
                    key={ds.id}
                    className="hover:bg-surface-elevated transition-colors cursor-pointer group"
                    onClick={() => setSelectedDataset(ds)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary-custom flex items-center gap-1.5 group-hover:text-accent-primary transition-colors">
                        <Database className="w-3.5 h-3.5 text-muted-custom" />
                        <span>{ds.fileName}</span>
                      </div>
                      <div className="text-[11px] text-muted-custom font-mono">{ds.id}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('experiment-detail', { id: ds.experimentId });
                        }}
                        className="text-accent-primary hover:underline font-semibold"
                      >
                        {ds.experimentId}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className="bg-surface-inset px-1.5 py-0.5 rounded border border-subtle font-semibold text-primary-custom">
                        {ds.version}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-muted-custom">
                      <div>{ds.recordCount} rows</div>
                      <div className="text-muted-custom">{ds.sizeFormatted}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <MonospaceHash
                        value={
                          isDsTampered
                            ? 'mh:sha256:2b91ac05e2f3b4d5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9'
                            : ds.coolCommitment
                        }
                        startLen={8}
                        endLen={8}
                      />
                    </td>

                    <td className="px-4 py-3">
                      {isDsTampered ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-700 dark:text-rose-400 font-bold bg-danger-surface px-2 py-0.5 rounded border border-danger-border">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>MISMATCH</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-success-surface px-2 py-0.5 rounded border border-success-border">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>SEALED</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {ds.evidenceId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ds.evidenceId) onViewEvidence(ds.evidenceId);
                          }}
                          className="text-accent-primary hover:underline flex items-center gap-1"
                        >
                          <MonospaceHash value={ds.evidenceId} showCopy={false} />
                        </button>
                      ) : (
                        <span className="text-muted-custom text-[11px] italic">Pending</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(ds);
                        }}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dataset Detail & In-Place Editor Modal */}
      {selectedDataset && (
        <DatasetDetailModal
          isOpen={!!selectedDataset}
          onClose={() => setSelectedDataset(null)}
          dataset={selectedDataset}
          onViewEvidence={onViewEvidence}
        />
      )}
    </div>
  );
};
