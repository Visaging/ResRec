import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { recordCorrection } from '../../services/measurements';
import type { Measurement } from '../../types';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurement: Measurement | null;
  onCorrectionRecorded?: (evidenceId: string) => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  measurement,
  onCorrectionRecorded,
}) => {
  const [correctedValue, setCorrectedValue] = useState<string>(() => measurement?.value.toString() || '');
  const [reason, setReason] = useState('Instrument calibration offset identified during post-run review');
  const [supportingNote, setSupportingNote] = useState(
    'Thermocouple channel exhibited a systematic +0.5 °C offset prior to ice-point recalibration.'
  );
  const [recordedBy, setRecordedBy] = useState('Dr. Elena Vance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!measurement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(correctedValue);
    if (isNaN(valNum)) {
      setError('Please enter a valid numeric corrected measurement.');
      return;
    }
    if (!reason.trim()) {
      setError('A scientific reason for correction is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await recordCorrection({
        experimentId: measurement.experimentId,
        measurementId: measurement.id,
        correctedValue: valNum,
        reason,
        supportingNote,
        recordedBy,
      });

      if (onCorrectionRecorded) {
        onCorrectionRecorded(result.evidenceId);
      }
      onClose();
    } catch {
      setError('Failed to record correction. Integrity check rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Scientific Measurement Correction"
      subtitle={`Append non-destructive correction to Trial ${measurement.trialNumber} (${measurement.id})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-danger-surface border border-danger-border text-danger-text rounded font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Immutable Original Context */}
        <div className="bg-surface-elevated p-3 rounded border border-subtle space-y-1.5">
          <div className="font-semibold text-primary-custom flex items-center justify-between">
            <span>Immutable Original Measurement</span>
            <span className="font-mono text-muted-custom">ID: {measurement.id}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
            <div>
              <span className="text-muted-custom block font-sans text-[10px]">Original Value:</span>
              <strong className="text-primary-custom">{measurement.value} {measurement.unit}</strong>
            </div>
            <div>
              <span className="text-muted-custom block font-sans text-[10px]">Trial Number:</span>
              <span className="text-primary-custom">#{measurement.trialNumber}</span>
            </div>
            <div>
              <span className="text-muted-custom block font-sans text-[10px]">Instrument:</span>
              <span className="text-primary-custom">{measurement.instrument}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-custom pt-1 border-t border-subtle">
            Note: The original recorded value ({measurement.value} {measurement.unit}) is permanently retained in the CooL Merkle tree.
          </div>
        </div>

        {/* Section 2: Correction Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Corrected Value ({measurement.unit}) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                required
                value={correctedValue}
                onChange={(e) => setCorrectedValue(e.target.value)}
                placeholder="e.g. 28.2"
                className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="font-mono text-muted-custom font-medium">{measurement.unit}</span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Scientific Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-default bg-surface py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="Instrument calibration offset identified during post-run review">
                Instrument calibration offset identified during post-run review
              </option>
              <option value="Thermocouple cold-junction reference drift compensation">
                Thermocouple cold-junction reference drift compensation
              </option>
              <option value="ADC conversion coefficient recalculation">
                ADC conversion coefficient recalculation
              </option>
              <option value="Sensor line impedance correction post-test audit">
                Sensor line impedance correction post-test audit
              </option>
              <option value="Operator transposition transcription error corrected">
                Operator transposition transcription error corrected
              </option>
              <option value="Other technical justification">
                Other technical justification (specify in notes)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Supporting Technical Note & Methodology Reference
            </label>
            <textarea
              rows={2}
              value={supportingNote}
              onChange={(e) => setSupportingNote(e.target.value)}
              placeholder="Provide specific details, instrument S/N recalibration certificate, or protocol references..."
              className="w-full rounded border border-default bg-surface py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Authorized Scientist / Reviewer DID
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full rounded border border-default bg-surface py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>

        {/* Section 3: Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <div className="text-[11px] text-muted-custom font-mono">
            New Evidence Receipt sequence will be generated
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing & Appending...' : 'Sign & Append Correction'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
