import React from 'react';
import { History, X } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { Measurement } from '../../types';
import { formatDate } from '../../lib/utils';

interface CorrectionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  measurement: Measurement | null;
  onViewEvidence: (evidenceId: string) => void;
}

export const CorrectionHistoryDrawer: React.FC<CorrectionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  measurement,
  onViewEvidence,
}) => {
  if (!isOpen || !measurement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-default shadow-elevated flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-subtle bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-primary-custom">
                Measurement Traceability History
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-custom hover:text-primary-custom p-1 rounded hover:bg-surface-inset transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 flex-1 overflow-y-auto text-xs">
            <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-1">
              <span className="text-muted-custom block text-[11px]">Measurement Target</span>
              <div className="font-mono text-primary-custom font-bold">
                {measurement.id} • Trial #{measurement.trialNumber}
              </div>
              <div className="text-muted-custom text-[11px]">
                Experiment: {measurement.experimentId} • Sensor: {measurement.instrument}
              </div>
            </div>

            {/* Lineage Steps */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-subtle">
              {/* Step 1: Genesis / Original */}
              <div className="relative">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-subtle bg-surface" />
                <div className="p-3 bg-surface rounded border border-default space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-custom">1. Original Physical Acquisition</span>
                    <Badge variant="secondary">ORIGINAL</Badge>
                  </div>
                  <div className="font-mono text-sm font-bold text-primary-custom">
                    {measurement.value} {measurement.unit}
                  </div>
                  <div className="text-[11px] text-muted-custom font-mono">
                    Recorded: {formatDate(measurement.timestamp)}
                  </div>
                  <div className="pt-2 border-t border-subtle flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-custom">
                      Receipt: {measurement.evidenceId}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewEvidence(measurement.evidenceId)}
                      className="text-accent-primary hover:underline font-mono text-[11px] font-semibold cursor-pointer"
                    >
                      Audit Genesis Receipt →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Correction if present */}
              {measurement.correction ? (
                <div className="relative">
                  <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-amber-600 bg-amber-600" />
                  <div className="p-3 bg-warning-surface rounded border border-warning-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warning-text">2. Superceding Correction</span>
                      <Badge variant="warning">CORRECTED</Badge>
                    </div>
                    <div className="font-mono text-sm font-bold text-warning-text">
                      {measurement.correction.correctedValue} {measurement.unit}
                    </div>
                    <div className="text-[11px] text-primary-custom">
                      <span className="font-semibold">Reason: </span>
                      {measurement.correction.reason}
                    </div>
                    {measurement.correction.supportingNote && (
                      <div className="text-[11px] text-muted-custom italic bg-surface/60 p-2 rounded border border-subtle">
                        "{measurement.correction.supportingNote}"
                      </div>
                    )}
                    <div className="text-[10px] text-muted-custom font-mono flex items-center justify-between pt-1">
                      <span>By: {measurement.correction.recordedBy}</span>
                      <span>{formatDate(measurement.correction.recordedAt)}</span>
                    </div>
                    <div className="pt-2 border-t border-warning-border flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-custom">
                        Evidence: {measurement.correction.evidenceId}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewEvidence(measurement.correction!.evidenceId)}
                        className="text-accent-primary hover:underline font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        Audit Correction Proof →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-custom italic pl-1">
                  No revisions appended to this raw measurement record.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
