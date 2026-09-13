import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { Experiment } from '../../types';
import { formatDate } from '../../lib/utils';

interface ExperimentOverviewTabProps {
  experiment: Experiment;
  isTampered?: boolean;
  onNavigateTab: (tabId: string) => void;
  onViewEvidence?: (evidenceId: string) => void;
}

export const ExperimentOverviewTab: React.FC<ExperimentOverviewTabProps> = ({
  experiment,
  isTampered = false,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Grid: Objective & Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Objective & Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Research Objective" subtitle="Formal institutional statement of inquiry">
            <p className="text-xs sm:text-sm text-primary-custom leading-relaxed">
              {experiment.researchObjective || experiment.description}
            </p>
          </Card>

          <Card title="Experimental Setup & Parameters" subtitle="Instrument calibration & environmental constraints">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-surface-elevated rounded border border-subtle">
                <span className="text-muted-custom font-medium block mb-1">Instrument & Data Acquisition</span>
                <span className="font-semibold text-primary-custom">{experiment.instrument}</span>
              </div>
              <div className="p-3 bg-surface-elevated rounded border border-subtle">
                <span className="text-muted-custom font-medium block mb-1">Sample Specimen</span>
                <span className="font-semibold text-primary-custom">{experiment.sample}</span>
              </div>
              <div className="p-3 bg-surface-elevated rounded border border-subtle">
                <span className="text-muted-custom font-medium block mb-1">Standard Protocol (SOP)</span>
                <span className="font-mono text-primary-custom font-medium">{experiment.protocol}</span>
              </div>
              <div className="p-3 bg-surface-elevated rounded border border-subtle">
                <span className="text-muted-custom font-medium block mb-1">Calibration Reference</span>
                <span className="text-primary-custom font-medium">{experiment.calibrationStatus}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-subtle text-xs text-muted-custom">
              <span className="font-medium text-primary-custom">Environment & Sensor Fixture: </span>
              {experiment.experimentalSetup}
            </div>
          </Card>
        </div>

        {/* Right: Restrained Integrity Status Panel */}
        <div>
          <Card
            title="Cryptographic Integrity Summary"
            subtitle="Verified against CooL Merkle consensus"
          >
            <div className="space-y-4 text-xs">
              {isTampered && experiment.id === 'EXP-2026-0042' ? (
                <div className="p-3 bg-danger-surface border border-danger-border rounded space-y-1.5">
                  <div className="flex items-center gap-1.5 text-danger-text font-bold">
                    <XCircle className="w-4 h-4 text-danger-primary" />
                    <span>INTEGRITY MISMATCH DETECTED</span>
                  </div>
                  <p className="text-danger-text text-[11px] leading-relaxed">
                    The active dataset differs from the signed cryptographic evidence receipt.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onNavigateTab('verification')}
                  >
                    Examine Mismatch Details
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-success-surface border border-success-border rounded space-y-2">
                  <div className="flex items-center gap-1.5 text-success-text font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>EVIDENCE INTEGRITY SEALED</span>
                  </div>
                  <div className="space-y-1 text-muted-custom font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Receipts Verified:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">6 / 6 (100%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dataset Commitment:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">MATCHED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Witness Consensus:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">4 / 4 Nodes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hardware Attestation:</span>
                      <span className="font-semibold text-muted-custom italic">NOT PROVIDED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Protocol Specs */}
              <div className="space-y-2 pt-2 border-t border-subtle text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-custom">Record Created:</span>
                  <span className="font-mono text-primary-custom">{formatDate(experiment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-custom">Last Verified:</span>
                  <span className="font-mono text-primary-custom">{formatDate(experiment.integrity.lastVerifiedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-custom">Ledger Protocol:</span>
                  <span className="font-mono text-primary-custom">CooL-POS-256</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onNavigateTab('evidence')}
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                Inspect Ledger Evidence
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
