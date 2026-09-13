import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { ExperimentList } from './components/experiments/ExperimentList';
import { ExperimentDetailView } from './components/experiments/ExperimentDetailView';
import { DatasetsPage } from './components/datasets/DatasetsPage';
import { EvidencePage } from './components/evidence/EvidencePage';
import { ProvenancePage } from './components/provenance/ProvenancePage';
import { VerificationCenter } from './components/verification/VerificationCenter';
import { SubmissionView } from './components/submissions/SubmissionView';
import { ReviewerModeView } from './components/submissions/ReviewerModeView';
import { AuditLogPage } from './components/audit/AuditLogPage';
import { SettingsPage } from './components/settings/SettingsPage';

// Modals
import { NewExperimentModal } from './components/experiments/NewExperimentModal';
import { EvidenceReceiptInspector } from './components/evidence/EvidenceReceiptInspector';

import { appState } from './services/api';
import type { EvidenceRecord } from './types';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});

  // Global Modals
  const [isNewExperimentOpen, setIsNewExperimentOpen] = useState(false);
  const [inspectedEvidenceRecord, setInspectedEvidenceRecord] = useState<EvidenceRecord | null>(null);

  const handleNavigate = (route: string, params?: Record<string, string>) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewEvidence = (evidenceId: string) => {
    const record = appState.getEvidenceRecord(evidenceId);
    if (record) {
      setInspectedEvidenceRecord(record);
    } else {
      // Navigate to evidence page with param
      handleNavigate('evidence', { recordId: evidenceId });
    }
  };

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenNewExperiment={() => setIsNewExperimentOpen(true)}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'experiments':
        return (
          <ExperimentList
            onNavigate={handleNavigate}
            onOpenNewExperiment={() => setIsNewExperimentOpen(true)}
          />
        );

      case 'experiment-detail':
        return (
          <ExperimentDetailView
            experimentId={routeParams.id || 'EXP-2026-0042'}
            initialTab={routeParams.tab || 'overview'}
            initialEvidenceId={routeParams.evidenceId || null}
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'datasets':
        return (
          <DatasetsPage
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'evidence':
        return (
          <EvidencePage
            onNavigate={handleNavigate}
            initialSelectedEvidenceId={routeParams.recordId || null}
          />
        );

      case 'provenance':
        return (
          <ProvenancePage
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'verification':
      case 'verification-center':
        return (
          <VerificationCenter
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'submissions':
        return (
          <SubmissionView
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'reviewer-mode':
        return (
          <ReviewerModeView
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'audit-log':
        return (
          <AuditLogPage
            onNavigate={handleNavigate}
            onViewEvidence={handleViewEvidence}
          />
        );

      case 'settings':
        return <SettingsPage />;

      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenNewExperiment={() => setIsNewExperimentOpen(true)}
            onViewEvidence={handleViewEvidence}
          />
        );
    }
  };

  return (
    <AppShell
      currentRoute={currentRoute}
      routeParams={routeParams}
      onNavigate={handleNavigate}
      onViewEvidence={handleViewEvidence}
      onOpenNewExperiment={() => setIsNewExperimentOpen(true)}
    >
      {renderCurrentView()}

      {/* Global Modals */}
      <NewExperimentModal
        isOpen={isNewExperimentOpen}
        onClose={() => setIsNewExperimentOpen(false)}
        onCreated={(expId) => handleNavigate('experiment-detail', { id: expId })}
      />

      <EvidenceReceiptInspector
        isOpen={!!inspectedEvidenceRecord}
        onClose={() => setInspectedEvidenceRecord(null)}
        record={inspectedEvidenceRecord}
      />
    </AppShell>
  );
}

export default App;
