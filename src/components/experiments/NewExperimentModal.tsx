import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { createExperiment, type CreateExperimentDto } from '../../services/experiments';

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExperimentCreated?: (experimentId: string) => void;
  onCreated?: (experimentId: string) => void;
}

export const NewExperimentModal: React.FC<NewExperimentModalProps> = ({
  isOpen,
  onClose,
  onExperimentCreated,
  onCreated,
}) => {
  const [formData, setFormData] = useState<CreateExperimentDto>({
    title: '',
    principalInvestigator: 'Dr. Elena Vance',
    researchGroup: 'Electrochemical Kinetics Laboratory',
    institution: 'National Institute of Materials & Energy Research',
    instrument: '',
    sample: '',
    calibrationStatus: 'Valid (NIST Traceable Reference)',
    protocol: '',
    researchObjective: '',
    experimentalSetup: '',
    primaryUnit: '°C',
    primaryParameter: 'Temperature',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.principalInvestigator.trim()) {
      setError('Title and Principal Investigator are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const exp = await createExperiment(formData);
      if (onCreated) onCreated(exp.id);
      if (onExperimentCreated) onExperimentCreated(exp.id);
      onClose();
    } catch {
      setError('Failed to create experiment protocol.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Research Experiment"
      subtitle="Initializes an immutable experiment record sealed with a genesis cryptographic receipt"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-danger-surface border border-danger-border text-danger-text rounded font-medium">
            {error}
          </div>
        )}

        {/* Experiment Title */}
        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Experiment Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Lithium-Ion Battery Thermal Cycling"
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        {/* PI & Lab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Principal Investigator <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.principalInvestigator}
              onChange={(e) =>
                setFormData({ ...formData, principalInvestigator: e.target.value })
              }
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Research Group / Lab
            </label>
            <input
              type="text"
              value={formData.researchGroup}
              onChange={(e) => setFormData({ ...formData, researchGroup: e.target.value })}
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>

        {/* Instrument & Sample */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Instrument Model & S/N
            </label>
            <input
              type="text"
              value={formData.instrument}
              onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
              placeholder="e.g. Arbin LBT-21084 & Keithley 2400"
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">Sample / Material</label>
            <input
              type="text"
              value={formData.sample}
              onChange={(e) => setFormData({ ...formData, sample: e.target.value })}
              placeholder="e.g. NMC-811 / Cylindrical 21700"
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>

        {/* Primary Parameter & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-primary-custom mb-1">
              Primary Measured Parameter
            </label>
            <input
              type="text"
              value={formData.primaryParameter}
              onChange={(e) =>
                setFormData({ ...formData, primaryParameter: e.target.value })
              }
              placeholder="e.g. Temperature"
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-primary-custom mb-1">Physical Unit</label>
            <input
              type="text"
              value={formData.primaryUnit}
              onChange={(e) => setFormData({ ...formData, primaryUnit: e.target.value })}
              placeholder="e.g. °C, MPa, %, V"
              className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>

        {/* Objective */}
        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Research Objective
          </label>
          <textarea
            rows={2}
            value={formData.researchObjective}
            onChange={(e) =>
              setFormData({ ...formData, researchObjective: e.target.value })
            }
            placeholder="Describe the scientific hypothesis and scope of this protocol..."
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        {/* Protocol SOP */}
        <div>
          <label className="block font-medium text-primary-custom mb-1">
            Standard Operating Procedure (SOP) Reference
          </label>
          <input
            type="text"
            value={formData.protocol}
            onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
            placeholder="e.g. SOP-BATT-042 rev 3: C/2 CC-CV Cycling"
            className="w-full rounded border border-default bg-surface-elevated py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering & Sealing Genesis...' : 'Register Experiment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
