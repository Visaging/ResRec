import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { appState } from '../../services/api';
import { computeSha256Sync, toCoolCommitment } from '../../lib/cryptoSimulation';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface TamperSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTamperChanged?: () => void;
}

export const TamperSimulatorModal: React.FC<TamperSimulatorModalProps> = ({
  isOpen,
  onClose,
  onTamperChanged,
}) => {
  const [tamperValue, setTamperValue] = useState<string>('38.2');
  const [isTampered, setIsTampered] = useState<boolean>(() => appState.getIsTampered());

  const originalCsvContent = `timestamp,sample_id,cycle_number,temperature_c,resistance_mohm,dissipation_mw,operator\n2026-09-13T10:00:00Z,CELL-A42-1,1,24.8,12.4,142.0,Dr. Elena Vance\n2026-09-13T10:15:00Z,CELL-A42-1,2,25.4,12.5,145.2,Dr. Elena Vance\n2026-09-13T10:30:00Z,CELL-A42-1,3,26.1,12.5,148.0,Dr. Elena Vance\n2026-09-13T10:45:00Z,CELL-A42-1,4,27.0,12.7,153.8,Dr. Elena Vance`;
  const originalHash = computeSha256Sync(originalCsvContent);
  const originalCommitment = toCoolCommitment(originalHash);

  const tamperedCsvContent = `timestamp,sample_id,cycle_number,temperature_c,resistance_mohm,dissipation_mw,operator\n2026-09-13T10:00:00Z,CELL-A42-1,1,${tamperValue},12.4,142.0,Dr. Elena Vance\n2026-09-13T10:15:00Z,CELL-A42-1,2,25.4,12.5,145.2,Dr. Elena Vance\n2026-09-13T10:30:00Z,CELL-A42-1,3,26.1,12.5,148.0,Dr. Elena Vance\n2026-09-13T10:45:00Z,CELL-A42-1,4,27.0,12.7,153.8,Dr. Elena Vance`;
  const calculatedTamperedHash = computeSha256Sync(tamperedCsvContent);
  const calculatedTamperedCommitment = toCoolCommitment(calculatedTamperedHash);

  useEffect(() => {
    return appState.subscribe(() => {
      setIsTampered(appState.getIsTampered());
    });
  }, []);

  const handleApplyTamper = () => {
    appState.setTampered(
      true,
      parseFloat(tamperValue) || 38.2,
      calculatedTamperedCommitment,
      'REC-7F82-110C'
    );
    setIsTampered(true);
    if (onTamperChanged) onTamperChanged();
    onClose();
  };

  const handleRestore = () => {
    appState.resetTamper();
    setIsTampered(false);
    if (onTamperChanged) onTamperChanged();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Dataset Tamper Demonstration"
      subtitle="Test cryptographic commitment verification by introducing unrecorded dataset alterations"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-amber-700 dark:text-amber-300 leading-relaxed">
          <strong>How this works:</strong> CooL cryptographic receipts seal SHA-256 multihashes
          of raw datasets at issuance. Modifying even a single character in the dataset will alter its
          derived multihash, triggering an automatic commitment mismatch upon verification.
        </div>

        {/* Dataset row simulation */}
        <div className="bg-surface-elevated p-3 rounded border border-subtle space-y-2">
          <div className="font-semibold text-primary-custom flex items-center justify-between">
            <span>Target Dataset: thermal-cycling-042.csv</span>
            <span className="font-mono text-[11px] text-muted-custom">Record: REC-7F82-110C</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="text-muted-custom">Row 1: 2026-09-13T10:00:00Z, CELL-A42-1, Cycle #1</div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-muted-custom font-sans uppercase mb-1">
                  Original Measured Value
                </label>
                <input
                  type="text"
                  disabled
                  value="24.8 °C"
                  className="w-full bg-surface text-muted-custom rounded px-2 py-1.5 font-mono text-xs border border-subtle"
                />
              </div>

              <div>
                <label className="block text-[10px] text-rose-500 font-sans uppercase mb-1 font-semibold">
                  Altered Value (Simulated Tamper)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tamperValue}
                    onChange={(e) => setTamperValue(e.target.value)}
                    className="w-full bg-surface text-rose-500 font-bold rounded px-2 py-1.5 font-mono text-xs border border-rose-500/40 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="38.2"
                  />
                  <span className="text-muted-custom font-mono">°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Commitment Comparison */}
        <div className="space-y-2">
          <div className="font-semibold text-primary-custom text-xs">Real-time Multihash Calculation</div>
          <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
            <div className="p-2.5 bg-emerald-500/10 rounded border border-emerald-500/30">
              <span className="text-emerald-600 dark:text-emerald-400 font-sans block text-[11px] font-semibold">
                Expected Commitment (Sealed in Evidence Receipt):
              </span>
              <MonospaceHash value={originalCommitment} truncate={false} className="w-full justify-between mt-1 text-primary-custom" />
            </div>

            <div className="p-2.5 bg-rose-500/10 rounded border border-rose-500/30">
              <span className="text-rose-500 font-sans block text-[11px] font-semibold">
                Recomputed Commitment from Altered Dataset:
              </span>
              <MonospaceHash
                value={calculatedTamperedCommitment}
                truncate={false}
                className="w-full justify-between mt-1 text-rose-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <div>
            {isTampered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Restore Original (Clean) State
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleApplyTamper}
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            >
              Apply Tampered Dataset
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
