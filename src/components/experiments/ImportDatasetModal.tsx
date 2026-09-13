import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { importDataset } from '../../services/datasets';
import { appState } from '../../services/api';
import type { Experiment } from '../../types';

interface ImportDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  experimentId?: string;
  defaultExperimentId?: string;
  onDatasetImported?: (datasetId: string) => void;
}

export const ImportDatasetModal: React.FC<ImportDatasetModalProps> = ({
  isOpen,
  onClose,
  experimentId,
  defaultExperimentId,
  onDatasetImported,
}) => {
  const experiments: Experiment[] = appState.getExperiments();
  const initialId = experimentId || defaultExperimentId || experiments[0]?.id || 'EXP-2026-0042';
  const [selectedExperimentId, setSelectedExperimentId] = useState(initialId);
  const [fileName, setFileName] = useState('thermal-cycling-042-run2.csv');
  const [version, setVersion] = useState('v1');
  const [description, setDescription] = useState(
    'Acquired sensor dataset with voltage, current, and RTD surface temperature channels.'
  );
  const [csvContent, setCsvContent] = useState(
    `trial_id,timestamp_iso,cell_voltage_v,current_a,surface_temp_c,internal_resistance_mohm
01,2026-09-13T10:21:04Z,3.82,-9.6,72.4,14.2
02,2026-09-13T10:22:18Z,3.79,-9.6,73.1,14.3
03,2026-09-13T10:23:41Z,3.76,-9.6,71.8,14.1
04,2026-09-13T10:25:02Z,3.74,-9.6,74.2,14.6
05,2026-09-13T10:26:30Z,3.71,-9.6,75.0,14.8`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperimentId || !fileName.trim() || !csvContent.trim()) {
      setError('Please provide experiment, file name, and dataset content.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const ds = await importDataset({
        experimentId: selectedExperimentId,
        fileName,
        version,
        description,
        content: csvContent,
      });
      if (onDatasetImported) onDatasetImported(ds.id);
      onClose();
    } catch {
      setError('Failed to import and commit dataset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import & Seal Research Dataset"
      subtitle="Computes SHA-256 CooL multihash commitment and appends dataset.finalized evidence receipt"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-danger-surface border border-danger-border text-danger-text rounded font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Target Experiment <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedExperimentId}
              onChange={(e) => setSelectedExperimentId(e.target.value)}
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary font-mono"
            >
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.id} - {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Dataset File Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">Version Tag</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">Load from File</label>
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="w-full text-xs text-muted-custom file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-inset file:text-primary-custom hover:file:bg-surface-elevated cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-primary-custom mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Raw CSV Data Payload (ASCII / UTF-8)
          </label>
          <textarea
            rows={6}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-[11px] focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary leading-tight"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Computing Multihash & Sealing...' : 'Seal Dataset & Issue Receipt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
