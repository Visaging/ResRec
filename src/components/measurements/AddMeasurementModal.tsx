import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { createMeasurement } from '../../services/measurements';
import type { Experiment } from '../../types';

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: Experiment;
  onMeasurementAdded?: () => void;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  isOpen,
  onClose,
  experiment,
  onMeasurementAdded,
}) => {
  const [value, setValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');
  const [instrument, setInstrument] = useState(
    experiment.instrument?.split('&')[0]?.trim() || 'TH-04 (Pt RTD)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value);
    if (isNaN(valNum)) {
      setError('Please enter a valid numeric measurement.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createMeasurement({
        experimentId: experiment.id,
        value: valNum,
        secondaryValue: secondaryValue ? parseFloat(secondaryValue) : undefined,
        unit: experiment.primaryUnit || '°C',
        parameter: experiment.primaryParameter || 'Temperature',
        instrument,
      });

      if (onMeasurementAdded) onMeasurementAdded();
      setValue('');
      setSecondaryValue('');
      onClose();
    } catch {
      setError('Failed to record measurement and generate evidence receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Real-time Experimental Measurement"
      subtitle={`Append new measurement to ${experiment.id} with instantaneous signed evidence receipt`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-danger-surface border border-danger-border text-danger-text rounded font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Measured {experiment.primaryParameter || 'Value'} ({experiment.primaryUnit || '°C'}){' '}
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 74.2"
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="font-mono text-muted-custom font-medium">
              {experiment.primaryUnit || '°C'}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Secondary Reading (e.g. Resistance mΩ)
          </label>
          <input
            type="number"
            step="any"
            value={secondaryValue}
            onChange={(e) => setSecondaryValue(e.target.value)}
            placeholder="e.g. 14.8"
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Sensor Channel / Instrument S/N
          </label>
          <input
            type="text"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording & Sealing...' : 'Record Trial & Seal Receipt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
