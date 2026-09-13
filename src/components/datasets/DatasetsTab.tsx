import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { DatasetDetailModal } from './DatasetDetailModal';
import { appState } from '../../services/api';
import type { Experiment, Dataset } from '../../types';

interface DatasetsTabProps {
  experiment: Experiment;
  onOpenImportDataset: () => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const DatasetsTab: React.FC<DatasetsTabProps> = ({
  experiment,
  onOpenImportDataset,
  onViewEvidence,
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>(appState.getDatasets(experiment.id));
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isTampered, setIsTampered] = useState<boolean>(appState.getIsTamperSimulated());

  useEffect(() => {
    return appState.subscribe(() => {
      setDatasets(appState.getDatasets(experiment.id));
      setIsTampered(appState.getIsTamperSimulated());
    });
  }, [experiment.id]);

  return (
    <div className="space-y-6 animate-subtle-fade">
      <Card
        title="Experimental Datasets & Cryptographic Commitments"
        subtitle="Immutable raw and processed scientific datasets committed to the CooL evidence ledger"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenImportDataset}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Import / Finalize Dataset
          </Button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Dataset File</th>
                <th className="px-4 py-3 font-semibold">Version</th>
                <th className="px-4 py-3 font-semibold">Records & Size</th>
                <th className="px-4 py-3 font-semibold">CooL Multihash Commitment</th>
                <th className="px-4 py-3 font-semibold">Integrity Status</th>
                <th className="px-4 py-3 font-semibold">Evidence Receipt</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {datasets.map((ds) => {
                const isDsTampered = isTampered && experiment.id === 'EXP-2026-0042';
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
