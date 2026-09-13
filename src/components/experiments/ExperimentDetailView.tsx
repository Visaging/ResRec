import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Activity,
  Database,
  ShieldCheck,
  GitBranch,
  BarChart3,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Building,
  Tag,
  Upload,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Tabs, type TabItem } from '../common/Tabs';
import { ExperimentOverviewTab } from './ExperimentOverviewTab';
import { MeasurementsTab } from '../measurements/MeasurementsTab';
import { DatasetsTab } from '../datasets/DatasetsTab';
import { EvidenceTab } from '../evidence/EvidenceTab';
import { ProvenanceTab } from '../provenance/ProvenanceTab';
import { AnalysisTab } from '../analysis/AnalysisTab';
import { DirectExperimentVerifier } from '../verification/DirectExperimentVerifier';
import { AddMeasurementModal } from '../measurements/AddMeasurementModal';
import { CorrectionModal } from '../measurements/CorrectionModal';
import { ImportDatasetModal } from './ImportDatasetModal';
import { appState } from '../../services/api';
import type { Experiment, Measurement } from '../../types';
import { formatDate } from '../../lib/utils';

interface ExperimentDetailViewProps {
  experimentId: string;
  initialTab?: string;
  initialEvidenceId?: string | null;
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const ExperimentDetailView: React.FC<ExperimentDetailViewProps> = ({
  experimentId,
  initialTab = 'overview',
  initialEvidenceId = null,
  onNavigate,
  onViewEvidence,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [experiment, setExperiment] = useState<Experiment | undefined>(
    appState.getExperiment(experimentId)
  );

  // Modals state
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isImportDatasetOpen, setIsImportDatasetOpen] = useState(false);
  const [measurementToCorrect, setMeasurementToCorrect] = useState<Measurement | null>(null);

  useEffect(() => {
    return appState.subscribe(() => {
      setExperiment(appState.getExperiment(experimentId));
    });
  }, [experimentId]);

  if (!experiment) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-semibold text-primary-custom">Experiment Not Found</h2>
        <p className="text-xs text-muted-custom">
          The requested experiment record ({experimentId}) does not exist in the active ledger.
        </p>
        <Button variant="outline" size="sm" onClick={() => onNavigate('experiments')}>
          Back to Experiments Registry
        </Button>
      </div>
    );
  }

  const handleOpenCorrection = (measurement: Measurement) => {
    setMeasurementToCorrect(measurement);
    setIsCorrectionModalOpen(true);
  };

  const liveMeasurements = appState.getMeasurements(experiment.id);
  const liveDatasets = appState.getDatasets(experiment.id);
  const liveEvidence = appState.getEvidenceRecords(experiment.id);
  const liveProvenance = appState.getProvenanceNodes(experiment.id);

  const totalMeasurements = liveMeasurements.length || experiment.recordCount || 0;
  const totalDatasets = liveDatasets.length || experiment.datasetCount || 0;
  const totalEvidenceRecords = liveEvidence.length;
  const totalProvenanceNodes = liveProvenance.length;
  const totalCorrections = experiment.stats?.totalCorrections ?? experiment.correctionsCount ?? 0;

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
    },
    {
      id: 'measurements',
      label: 'Measurements',
      count: totalMeasurements,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'datasets',
      label: 'Datasets',
      count: totalDatasets,
      icon: <Database className="w-3.5 h-3.5" />,
    },
    {
      id: 'evidence',
      label: 'Evidence Registry',
      count: totalEvidenceRecords,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'provenance',
      label: 'Scientific Lineage',
      count: totalProvenanceNodes,
      icon: <GitBranch className="w-3.5 h-3.5" />,
    },
    {
      id: 'analysis',
      label: 'Derived Analysis',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'verification',
      label: 'Audit & Verification',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-5 animate-subtle-fade">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('experiments')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-custom hover:text-primary-custom transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Experiments Registry</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDatasetOpen(true)}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Import Dataset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddMeasurementOpen(true)}
            icon={<Activity className="w-3.5 h-3.5" />}
          >
            Record Measurement
          </Button>
        </div>
      </div>

      {/* Experiment Header Banner */}
      <div className="bg-surface p-5 rounded border border-default shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary-custom bg-surface-inset px-2 py-0.5 rounded border border-subtle">
                {experiment.id}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-primary-custom">
                {experiment.title}
              </h1>
              <Badge variant={experiment.status}>
                {experiment.status.toUpperCase()}
              </Badge>
              {totalCorrections > 0 && (
                <Badge variant="warning">
                  {totalCorrections} CORRECTION RECORDED
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-custom max-w-4xl leading-relaxed">
              {experiment.description || experiment.researchObjective}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-surface-elevated sm:bg-transparent p-2.5 sm:p-0 rounded border sm:border-0 border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-custom">Principal Investigator</div>
            <div className="text-xs font-semibold text-primary-custom">
              {experiment.pi || experiment.principalInvestigator}
            </div>
            <div className="text-[11px] text-muted-custom">{experiment.institution}</div>
          </div>
        </div>

        {/* Tags & Meta Row */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-subtle text-xs text-muted-custom">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-custom" />
            <span>Started: {formatDate(experiment.createdAt).split(',')[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-muted-custom" />
            <span>Lab: {experiment.metadata?.laboratory || experiment.researchGroup}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-muted-custom" />
            <span>Protocol: {experiment.protocol}</span>
          </div>
          {experiment.tags && (
            <div className="flex items-center gap-1.5 ml-auto">
              {experiment.tags.map((t: string) => (
                <span
                  key={t}
                  className="bg-surface-inset text-muted-custom px-1.5 py-0.5 rounded text-[10px] font-mono border border-subtle"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <ExperimentOverviewTab
            experiment={experiment}
            onNavigateTab={setActiveTab}
            onViewEvidence={onViewEvidence}
          />
        )}
        {activeTab === 'measurements' && (
          <MeasurementsTab
            experiment={experiment}
            onOpenAddMeasurement={() => setIsAddMeasurementOpen(true)}
            onOpenCorrection={handleOpenCorrection}
            onViewEvidence={onViewEvidence}
          />
        )}
        {activeTab === 'datasets' && (
          <DatasetsTab
            experiment={experiment}
            onOpenImportDataset={() => setIsImportDatasetOpen(true)}
            onViewEvidence={onViewEvidence}
          />
        )}
        {activeTab === 'evidence' && (
          <EvidenceTab
            experiment={experiment}
            initialSelectedEvidenceId={initialEvidenceId}
          />
        )}
        {activeTab === 'provenance' && (
          <ProvenanceTab experiment={experiment} onViewEvidence={onViewEvidence} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab experiment={experiment} onViewEvidence={onViewEvidence} />
        )}
        {activeTab === 'verification' && (
          <DirectExperimentVerifier
            experiment={experiment}
            onNavigateToVerificationCenter={() => onNavigate('verification-center')}
          />
        )}
      </div>

      {/* Modals */}
      <AddMeasurementModal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        experiment={experiment}
      />

      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setMeasurementToCorrect(null);
        }}
        measurement={measurementToCorrect}
      />

      <ImportDatasetModal
        isOpen={isImportDatasetOpen}
        onClose={() => setIsImportDatasetOpen(false)}
        experimentId={experiment.id}
      />
    </div>
  );
};
