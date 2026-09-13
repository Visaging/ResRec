import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Database,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  FileCheck2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { appState } from '../../services/api';
import type { Experiment, EvidenceRecord, DashboardMetrics } from '../../types';
import { formatDate } from '../../lib/utils';

interface DashboardProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onOpenNewExperiment: () => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewExperiment,
  onViewEvidence,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(appState.getDashboardMetrics());
  const [experiments, setExperiments] = useState<Experiment[]>(appState.getExperiments());
  const [evidence, setEvidence] = useState<EvidenceRecord[]>(appState.getEvidenceRecords());
  const [isTampered, setIsTampered] = useState<boolean>(appState.getIsTamperSimulated());

  useEffect(() => {
    return appState.subscribe(() => {
      setMetrics(appState.getDashboardMetrics());
      setExperiments(appState.getExperiments());
      setEvidence(appState.getEvidenceRecords());
      setIsTampered(appState.getIsTamperSimulated());
    });
  }, []);

  const totalDatasets = experiments.reduce((acc, exp) => acc + (exp.datasetCount || 0), 0);
  const totalRecords = experiments.reduce((acc, exp) => acc + (exp.recordCount || 0), 0);
  const integrityScore = isTampered ? 83.4 : 100.0;

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-primary-custom">
              Institutional Research Ledger
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-inset text-muted-custom font-semibold border border-subtle">
              CooL v4.2.0
            </span>
            <button
              type="button"
              onClick={() => onNavigate('verification-center')}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shadow-xs"
              title="Ledger state is synchronized. Click to open Cryptographic Verification Center."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
              <span>Synchronized</span>
            </button>
          </div>
          <p className="text-xs text-muted-custom mt-1 leading-normal">
            Continuous cryptographic verification of raw scientific acquisitions, non-destructive revisions, and publication lineage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('submissions')}
            icon={<FileCheck2 className="w-3.5 h-3.5" />}
          >
            Review Submissions
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewExperiment}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Experiment Protocol
          </Button>
        </div>
      </div>

      {/* Critical Alert if tampering detected */}
      {isTampered && (
        <div className="p-4 bg-danger-surface border border-danger-border rounded text-xs space-y-2 animate-subtle-fade">
          <div className="flex items-center justify-between text-danger-text font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger-primary shrink-0" />
              <span>CRYPTOGRAPHIC COMMITMENT MISMATCH DETECTED</span>
            </div>
            <Badge variant="destructive">UNVERIFIED STATE</Badge>
          </div>
          <p className="text-danger-text leading-relaxed font-medium text-[11px] sm:text-xs">
            The target dataset <code className="font-mono bg-danger-surface px-1 py-0.5 rounded border border-danger-border">thermal-cycling-042.csv</code> deviates from its immutable CooL receipt seal. Uncommitted modifications have been isolated from publication bundles.
          </p>
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('verification-center')}
              className="text-danger-text font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Examine Mismatch in Verification Center →</span>
            </button>
            <button
              type="button"
              onClick={() => appState.resetTamper()}
              className="text-muted-custom hover:text-primary-custom font-semibold cursor-pointer underline text-[11px]"
            >
              Restore Clean State
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Tiles (Institutional Asymmetric Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Experiments */}
        <div
          onClick={() => onNavigate('experiments')}
          className="bg-surface p-4 rounded border border-default shadow-card hover:border-strong transition-all cursor-pointer space-y-2 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-muted-custom text-xs">
            <span className="font-semibold text-[10px] uppercase tracking-wider font-mono">Registered Ledgers</span>
            <div className="p-1.5 rounded bg-surface-elevated text-accent-primary border border-subtle">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-primary-custom font-mono">
            {metrics.activeExperiments}
          </div>
          <div className="text-[11px] text-muted-custom flex items-center justify-between border-t border-subtle pt-2">
            <span>{totalRecords.toLocaleString()} data points</span>
            <span className="text-accent-primary font-semibold flex items-center text-[11px]">
              Registry <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 2: Datasets */}
        <div
          onClick={() => onNavigate('datasets')}
          className="bg-surface p-4 rounded border border-default shadow-card hover:border-strong transition-all cursor-pointer space-y-2 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-muted-custom text-xs">
            <span className="font-semibold text-[10px] uppercase tracking-wider font-mono">Raw Datasets</span>
            <div className="p-1.5 rounded bg-surface-elevated text-blue-600 dark:text-blue-400 border border-subtle">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-primary-custom font-mono">
            {totalDatasets || metrics.datasets}
          </div>
          <div className="text-[11px] text-muted-custom flex items-center justify-between border-t border-subtle pt-2">
            <span>SHA-256 Multihashes</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center text-[11px]">
              Inspect <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 3: Evidence Receipts */}
        <div
          onClick={() => onNavigate('evidence')}
          className="bg-surface p-4 rounded border border-default shadow-card hover:border-strong transition-all cursor-pointer space-y-2 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-muted-custom text-xs">
            <span className="font-semibold text-[10px] uppercase tracking-wider font-mono">CooL Evidence Seals</span>
            <div className="p-1.5 rounded bg-surface-elevated text-emerald-600 dark:text-emerald-400 border border-subtle">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-primary-custom font-mono">
            {metrics.evidenceRecords}
          </div>
          <div className="text-[11px] text-muted-custom flex items-center justify-between border-t border-subtle pt-2">
            <span>Signed & transparent</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center text-[11px]">
              Ledger <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 4: Cryptographic Integrity */}
        <div
          onClick={() => onNavigate('verification-center')}
          className="bg-surface p-4 rounded border border-default shadow-card hover:border-strong transition-all cursor-pointer space-y-2 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-muted-custom text-xs">
            <span className="font-semibold text-[10px] uppercase tracking-wider font-mono">Integrity Index</span>
            <div
              className={`p-1.5 rounded border border-subtle ${
                metrics.verificationIssues > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {metrics.verificationIssues > 0 ? (
                <XCircle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight font-mono ${
              metrics.verificationIssues > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {integrityScore.toFixed(1)}%
          </div>
          <div className="text-[11px] text-muted-custom flex items-center justify-between border-t border-subtle pt-2">
            <span>{metrics.verificationIssues > 0 ? `${metrics.verificationIssues} Mismatch Flagged` : 'Zero Faults'}</span>
            <span className="text-primary-custom font-semibold flex items-center text-[11px]">
              Verify <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Experiments & Live Evidence Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Experiments & Manuscript Pipeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Research Ledgers */}
          <Card
            title="Active Research Ledgers"
            subtitle="Experimental protocols, real-time measurements, and non-destructive revision chains"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('experiments')}
              >
                View Registry
              </Button>
            }
            noPadding
          >
            <div className="divide-y divide-subtle">
              {experiments.slice(0, 4).map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onNavigate('experiment-detail', { id: exp.id })}
                  className="p-4 hover:bg-surface-elevated transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-primary-custom bg-surface-inset px-1.5 py-0.5 rounded border border-subtle">
                        {exp.id}
                      </span>
                      <h4 className="font-semibold text-primary-custom group-hover:text-accent-primary transition-colors truncate">
                        {exp.title}
                      </h4>
                      <Badge variant={exp.status}>{exp.status.toUpperCase()}</Badge>
                      {exp.correctionsCount > 0 && (
                        <Badge variant="warning">
                          {exp.correctionsCount} REVISION
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-custom text-[11px] flex flex-wrap items-center gap-x-2.5">
                      <span>PI: <strong className="text-primary-custom">{exp.principalInvestigator}</strong></span>
                      <span>•</span>
                      <span>{exp.institution}</span>
                      <span>•</span>
                      <span className="font-mono">{exp.recordCount} points</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div className="hidden sm:block">
                      <div className="font-mono text-[10px] text-muted-custom">
                        {formatDate(exp.updatedAt).split(',')[0]}
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Sealed
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-custom group-hover:text-primary-custom group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Research Manuscript Submission & Evidence Package */}
          <Card
            title="Active Manuscript Lineage Package"
            subtitle="Quantitative manuscript claims cryptographically linked to sealed CooL receipts"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('submissions')}
                icon={<Sparkles className="w-3.5 h-3.5 text-accent-primary" />}
              >
                Inspect Lineage Proofs
              </Button>
            }
          >
            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-subtle pb-2.5 gap-2">
                <div>
                  <h4 className="font-bold text-primary-custom text-xs sm:text-sm">
                    Suppression of Thermal Runaway in High-Nickel NMC Cathodes via Fluorinated Ether Electrolytes
                  </h4>
                  <div className="text-muted-custom text-[11px] mt-0.5">
                    Target: <strong className="text-primary-custom">Nature Materials</strong> • Lead: Dr. Elena Vance • Grant #DE-AR0001428
                  </div>
                </div>
                <Badge variant="verified">100% EVIDENCE SEALED</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-surface-elevated rounded border border-subtle space-y-1.5">
                  <div className="text-muted-custom font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                    <span>Claim 1 (Thermal Decomposition Threshold):</span>
                  </div>
                  <div className="text-primary-custom font-medium">
                    Backed by <code className="font-mono bg-surface-inset px-1 py-0.5 rounded border border-subtle">thermal-cycling-042.csv</code> + CooL Receipt #REC-7F82
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-custom pt-1">
                    <span>Multihash Verified</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Stage 4 Complete</span>
                  </div>
                </div>

                <div className="p-2.5 bg-surface-elevated rounded border border-subtle space-y-1.5">
                  <div className="text-muted-custom font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                    <span>Claim 2 (Coulombic Capacity Retention):</span>
                  </div>
                  <div className="text-primary-custom font-medium">
                    Backed by <code className="font-mono bg-surface-inset px-1 py-0.5 rounded border border-subtle">cycling-500.csv</code> + CooL Receipt #REC-88A2
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-custom pt-1">
                    <span>Multihash Verified</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Stage 4 Complete</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-inset rounded border border-subtle flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent-primary shrink-0" />
                  <span>CooL Audit Bundle ready for journal peer reviewers and independent validation nodes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('submissions')}
                  className="text-accent-primary hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Export Bundle</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Evidence Stream & Cryptographic Lineage Status (1 Col) */}
        <div className="space-y-6">
          {/* Node Health & Architecture Card */}
          <Card
            title="Institutional Node Architecture"
            subtitle="Decentralized scientific timestamping"
          >
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-custom">Proof Verification Engine</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">v4.2 Active</span>
                </div>
                <div className="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-custom">Merkle DAG Consensus</span>
                  <span className="font-mono text-primary-custom font-semibold">Depth: 14 Nodes</span>
                </div>
                <div className="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden">
                  <div className="bg-accent-primary h-full rounded-full w-full" />
                </div>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between text-[10px] font-mono text-muted-custom">
                <span>Validator Protocol: CooL-POS-256</span>
                <span className="text-primary-custom font-semibold">Sync Block #94,812</span>
              </div>
            </div>
          </Card>

          {/* Live Evidence Receipts Stream */}
          <Card
            title="Signed Evidence Stream"
            subtitle="Immutable sequence of CooL receipts"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('evidence')}
              >
                All
              </Button>
            }
            noPadding
          >
            <div className="divide-y divide-subtle">
              {evidence.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onViewEvidence(rec.id)}
                  className="p-3 hover:bg-surface-elevated transition-colors cursor-pointer space-y-1.5 text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <MonospaceHash value={rec.id} startLen={4} endLen={4} />
                      <span className="text-muted-custom font-mono">#{rec.sequence}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[9px]">
                      {rec.eventType}
                    </Badge>
                  </div>

                  <div className="text-primary-custom text-[11px] line-clamp-1 group-hover:text-accent-primary transition-colors">
                    {rec.payloadSummary}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-custom font-mono pt-1 border-t border-subtle">
                    <span className="text-primary-custom font-medium">{rec.experimentId}</span>
                    <span className="flex items-center gap-1 text-muted-custom">
                      <Clock className="w-3 h-3" />
                      {formatDate(rec.issuedAt).split(',')[1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
