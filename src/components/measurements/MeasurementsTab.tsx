import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit3, History, CheckCircle2, AlertTriangle, Search, X } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { MeasurementChart } from './MeasurementChart';
import { AddMeasurementModal } from './AddMeasurementModal';
import { CorrectionModal } from './CorrectionModal';
import { CorrectionHistoryDrawer } from './CorrectionHistoryDrawer';
import { appState } from '../../services/api';
import type { Experiment, Measurement } from '../../types';
import { formatDate } from '../../lib/utils';

interface MeasurementsTabProps {
  experiment: Experiment;
  onNavigateTab?: (tabId: string) => void;
  onViewEvidence: (evidenceId: string) => void;
  onOpenAddMeasurement?: () => void;
  onOpenCorrection?: (measurement: Measurement) => void;
}

export const MeasurementsTab: React.FC<MeasurementsTabProps> = ({
  experiment,
  onViewEvidence,
  onOpenAddMeasurement,
  onOpenCorrection,
}) => {
  const [measurements, setMeasurements] = useState<Measurement[]>(
    appState.getMeasurements(experiment.id)
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<Measurement | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Measurement | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [exportedSuccess, setExportedSuccess] = useState(false);

  useEffect(() => {
    return appState.subscribe(() => {
      setMeasurements(appState.getMeasurements(experiment.id));
    });
  }, [experiment.id]);

  const handleExportCsv = () => {
    const headers = ['trial', 'timestamp_iso', 'value', 'unit', 'instrument', 'status', 'evidence_id'];
    const rows = measurements.map((m) =>
      [m.trialNumber, m.timestamp, m.value, m.unit, `"${m.instrument}"`, m.status, m.evidenceId].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${experiment.id}_measurements.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 2500);
  };

  const filteredMeasurements = measurements.filter(
    (m) =>
      m.trialNumber.toString().includes(searchFilter) ||
      m.instrument.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.evidenceId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleAddClick = () => {
    if (onOpenAddMeasurement) {
      onOpenAddMeasurement();
    } else {
      setIsAddOpen(true);
    }
  };

  const handleCorrectionClick = (m: Measurement) => {
    if (onOpenCorrection) {
      onOpenCorrection(m);
    } else {
      setCorrectionTarget(m);
    }
  };

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Top Chart Section */}
      <MeasurementChart
        measurements={measurements}
        parameter={experiment.primaryParameter || 'Temperature'}
        unit={experiment.primaryUnit || '°C'}
      />

      {/* Main Measurements Table Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <span>Experimental Measurement Ledger</span>
            <span className="text-xs font-mono font-normal text-muted-custom bg-surface-inset px-2 py-0.5 rounded border border-subtle">
              {measurements.length} trials recorded
            </span>
          </div>
        }
        subtitle="Individual acquisition records cryptographically anchored with CooL signed receipts"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              {exportedSuccess ? 'Downloaded CSV' : 'Export Data'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddClick}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Trial
            </Button>
          </div>
        }
        noPadding
      >
        {/* Filter bar */}
        <div className="p-3 border-b border-subtle bg-surface-elevated flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted-custom absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter by trial #, instrument, or evidence hash..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs rounded border border-default bg-surface text-primary-custom placeholder:text-muted-custom focus:outline-none focus:border-accent-primary"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1.5 text-muted-custom hover:text-primary-custom"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-muted-custom font-mono">
            Showing {filteredMeasurements.length} of {measurements.length}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle font-mono text-[11px]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Trial #</th>
                <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                <th className="px-4 py-2.5 font-semibold">
                  {experiment.primaryParameter || 'Value'} ({experiment.primaryUnit || '°C'})
                </th>
                <th className="px-4 py-2.5 font-semibold">Secondary Channel</th>
                <th className="px-4 py-2.5 font-semibold">Instrument & Cal</th>
                <th className="px-4 py-2.5 font-semibold">Audit State</th>
                <th className="px-4 py-2.5 font-semibold">CooL Evidence Receipt</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredMeasurements.map((m) => {
                const isCorrected = m.status === 'corrected';

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-surface-elevated transition-colors ${
                      isCorrected ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary-custom">
                      <span className="bg-surface-inset px-1.5 py-0.5 rounded border border-subtle">
                        #{m.trialNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-muted-custom whitespace-nowrap">
                      {formatDate(m.timestamp)}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary-custom">
                      {m.value} <span className="text-muted-custom font-normal">{m.unit}</span>
                      {isCorrected && (
                        <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-sans font-normal" title="Value updated with linked cryptographic audit justification">
                          (revised)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-muted-custom">
                      {m.secondaryValue !== undefined ? `${m.secondaryValue} mΩ` : '—'}
                    </td>

                    <td className="px-4 py-3 text-muted-custom max-w-xs truncate">
                      <span className="font-medium text-primary-custom">{m.instrument}</span>
                    </td>

                    <td className="px-4 py-3">
                      {isCorrected ? (
                        <button
                          type="button"
                          onClick={() => setHistoryTarget(m)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] bg-warning-surface text-warning-text border border-warning-border px-2 py-0.5 rounded hover:opacity-90 font-semibold cursor-pointer"
                          title="View revision trail"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>REVISED (AUDITED)</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-success-surface border border-success-border px-2 py-0.5 rounded font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>ACQUIRED RAW</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <button
                        type="button"
                        onClick={() => onViewEvidence(m.evidenceId)}
                        className="text-accent-primary hover:underline flex items-center gap-1"
                      >
                        <MonospaceHash value={m.evidenceId} showCopy={false} />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCorrected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryTarget(m)}
                            icon={<History className="w-3 h-3 text-muted-custom" />}
                            title="Audit Log"
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCorrectionClick(m)}
                          icon={<Edit3 className="w-3 h-3" />}
                        >
                          Revise
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Internal Modals if triggered directly */}
      <AddMeasurementModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        experiment={experiment}
      />

      <CorrectionModal
        isOpen={!!correctionTarget}
        onClose={() => setCorrectionTarget(null)}
        measurement={correctionTarget}
      />

      <CorrectionHistoryDrawer
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        measurement={historyTarget}
        onViewEvidence={onViewEvidence}
      />
    </div>
  );
};
