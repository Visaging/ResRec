import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MonospaceHash } from '../common/MonospaceHash';
import { Button } from '../common/Button';
import type { Dataset } from '../../types';
import { formatDate } from '../../lib/utils';
import { CheckCircle2, Download, XCircle, Edit3, Save, RotateCcw, ShieldAlert } from 'lucide-react';
import { appState } from '../../services/api';

interface DatasetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  onViewEvidence: (evidenceId: string) => void;
  isTampered?: boolean;
}

export const DatasetDetailModal: React.FC<DatasetDetailModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onViewEvidence,
  isTampered = false,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'versions'>('preview');
  const [isEditing, setIsEditing] = useState(false);
  const [editableRows, setEditableRows] = useState<Record<string, string>[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!dataset) return null;

  const handleStartEdit = () => {
    setEditableRows(JSON.parse(JSON.stringify(dataset.previewRows || [])));
    setIsEditing(true);
  };

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const updated = [...editableRows];
    updated[rowIndex] = { ...updated[rowIndex], [header]: value };
    setEditableRows(updated);
  };

  const handleSaveInPlaceTamper = () => {
    appState.tamperDatasetDirectly(dataset.id, editableRows, 'Manual In-Place CSV Tamper');
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetClean = () => {
    appState.resetTamper();
    setEditableRows(JSON.parse(JSON.stringify(dataset.previewRows || [])));
    setIsEditing(false);
  };

  const handleDownload = () => {
    if (!dataset.headers || dataset.headers.length === 0) return;
    const currentData = isEditing ? editableRows : (dataset.previewRows || []);
    const rows = currentData.map((r) =>
      dataset.headers.map((h) => `"${r[h] ?? ''}"`).join(',')
    );
    const csv = [dataset.headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataset.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dataset: ${dataset.fileName}`}
      subtitle={`Version ${dataset.version} • ${dataset.recordCount} records • ${dataset.sizeFormatted}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Summary Box */}
        <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-muted-custom block mb-0.5">Dataset Identifier</span>
              <span className="font-mono font-bold text-primary-custom">{dataset.id}</span>
            </div>
            <div>
              <span className="text-muted-custom block mb-0.5">Integrity Verification Status</span>
              {isTampered ? (
                <span className="inline-flex items-center gap-1 font-mono text-rose-500 font-bold">
                  <XCircle className="w-3.5 h-3.5" /> COMMITMENT MISMATCH
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-subtle pt-2 space-y-1.5 font-mono text-[11px]">
            <div>
              <span className="text-muted-custom block font-sans text-xs">SHA-256 Digest:</span>
              <MonospaceHash
                value={
                  isTampered
                    ? '2b91ac05e2f3b4d5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9'
                    : dataset.sha256
                }
                truncate={false}
                className="w-full justify-between"
              />
            </div>
            <div>
              <span className="text-muted-custom block font-sans text-xs">CooL Cryptographic Commitment:</span>
              <MonospaceHash
                value={
                  isTampered
                    ? 'mh:sha256:2b91ac05e2f3b4d5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9'
                    : dataset.coolCommitment
                }
                truncate={false}
                className="w-full justify-between"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-subtle text-[11px]">
            <span className="text-muted-custom">Sealed In Evidence:</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewEvidence(dataset.evidenceId);
              }}
              className="font-mono text-accent-primary hover:underline font-bold cursor-pointer"
            >
              {dataset.evidenceId}
            </button>
          </div>
        </div>

        {/* Tab switcher: Preview vs Version History */}
        <div className="flex items-center justify-between border-b border-subtle text-xs">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-1.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-accent-primary text-accent-primary font-bold'
                  : 'border-transparent text-muted-custom hover:text-primary-custom'
              }`}
            >
              Data Preview (Sample Rows)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('versions')}
              className={`py-1.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'versions'
                  ? 'border-accent-primary text-accent-primary font-bold'
                  : 'border-transparent text-muted-custom hover:text-primary-custom'
              }`}
            >
              Version History ({(dataset.previousVersions?.length || 0) + 1})
            </button>
          </div>

          {activeTab === 'preview' && (
            <div className="flex items-center gap-1.5 pb-1">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  icon={<Edit3 className="w-3 h-3 text-amber-500" />}
                >
                  Edit Cells (Simulate In-Place Tamper)
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetClean}
                    icon={<RotateCcw className="w-3 h-3" />}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSaveInPlaceTamper}
                    icon={<Save className="w-3 h-3" />}
                  >
                    Save Tamper (Without Receipt)
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Editing Warning Banner */}
        {isEditing && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Unsealed In-Place Edit Mode:</strong> Editing values below simulates modifying the stored physical dataset without generating a signed CooL evidence receipt. Saving will break the cryptographic hash commitment against receipt <code className="font-mono bg-surface px-1 py-0.5 rounded font-bold border border-subtle">{dataset.evidenceId}</code>.
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-2.5 bg-danger-surface border border-danger-border rounded text-danger-text flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Dataset Modified In-Place:</strong> New SHA-256 multihash computed. Because no new receipt was sealed, running verification in <strong>Verification Center</strong> will now flag a cryptographic commitment mismatch.
            </div>
          </div>
        )}

        {/* Tab 1: Preview Table */}
        {activeTab === 'preview' && (
          <div className="border border-subtle rounded overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs text-primary-custom">
              <thead className="bg-surface-elevated text-muted-custom font-mono text-[11px] border-b border-subtle sticky top-0 bg-opacity-95">
                <tr>
                  {dataset.headers.map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle font-mono text-[11px]">
                {(isEditing ? editableRows : dataset.previewRows || []).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-surface-elevated">
                    {dataset.headers.map((h) => (
                      <td key={h} className="px-2.5 py-1.5 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={row[h] ?? ''}
                            onChange={(e) => handleCellChange(rowIdx, h, e.target.value)}
                            className="w-full bg-surface border border-amber-500/40 rounded px-1.5 py-0.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-surface text-primary-custom"
                          />
                        ) : (
                          String(row[h] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Version History */}
        {activeTab === 'versions' && (
          <div className="space-y-3">
            {/* Current version */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-emerald-700 dark:text-emerald-300">Current: {dataset.version} (Active Evidence)</span>
                <span className="text-muted-custom font-mono text-[11px]">
                  {formatDate(dataset.updatedAt)}
                </span>
              </div>
              <p className="text-muted-custom text-[11px]">{dataset.description}</p>
              <div className="font-mono text-[10px] text-muted-custom truncate pt-1">
                Commitment: {dataset.coolCommitment}
              </div>
            </div>

            {/* Previous versions */}
            {(dataset.previousVersions || []).map((v) => (
              <div key={v.version} className="p-3 bg-surface-elevated border border-subtle rounded text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-primary-custom">Version: {v.version}</span>
                  <span className="text-muted-custom font-mono text-[11px]">
                    {formatDate(v.timestamp)}
                  </span>
                </div>
                <p className="text-muted-custom text-[11px]">{v.reason}</p>
                <div className="font-mono text-[10px] text-muted-custom truncate pt-1">
                  Commitment: {v.coolCommitment}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download CSV
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};
