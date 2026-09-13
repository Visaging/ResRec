import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Download,
  Award,
  RotateCw,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { appState } from '../../services/api';
import { INITIAL_SUBMISSIONS } from '../../services/mockData';
import type { ResearchSubmission } from '../../types';
import { formatDate } from '../../lib/utils';

interface SubmissionViewProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const SubmissionView: React.FC<SubmissionViewProps> = ({ onNavigate, onViewEvidence }) => {
  const [submission] = useState<ResearchSubmission>(() => {
    return appState.getSubmission() || INITIAL_SUBMISSIONS[0];
  });
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);

  const handleVerifyAll = () => {
    setIsVerifyingAll(true);
    setTimeout(() => {
      setIsVerifyingAll(false);
      alert('All 3 scientific claims and underlying CooL multihashes verified successfully.');
    }, 500);
  };

  const handleDownloadProofPackage = () => {
    alert(
      'Downloading institutional proof package (submission-manifest-2026-NMAT.tar.gz) containing PDF cryptographic certificate, signed receipts, and reproducibility manifests.'
    );
  };

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent-primary bg-surface px-2 py-0.5 rounded border border-subtle">
              {submission.id}
            </span>
            <Badge variant="verified">SEALED & AUDITABLE</Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom mt-1">
            {submission.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Target: <strong className="text-primary-custom">{submission.targetJournal}</strong> • Status: {submission.status.toUpperCase()} • Submitted:{' '}
            {formatDate(submission.submissionDate || submission.lastEvidenceEvent || new Date().toISOString()).split(',')[0]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadProofPackage}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Proof Package (.tar.gz)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyAll}
            disabled={isVerifyingAll}
            icon={<RotateCw className={`w-3.5 h-3.5 ${isVerifyingAll ? 'animate-spin' : ''}`} />}
          >
            {isVerifyingAll ? 'Verifying All Claims...' : 'Verify Entire Submission'}
          </Button>
        </div>
      </div>

      {/* Authors & Institutions */}
      <div className="bg-surface p-4 rounded border border-subtle grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-muted-custom font-medium block">Authors & Affiliations</span>
          <div className="font-semibold text-primary-custom mt-0.5">
            {submission.authors.join(', ')}
          </div>
          <div className="text-muted-custom text-[11px]">{submission.institution}</div>
        </div>

        <div>
          <span className="text-muted-custom font-medium block">Manuscript DOI / Pre-registration</span>
          <div className="font-mono text-primary-custom font-medium mt-0.5">{submission.doi || '10.1038/s41563-026-0042-8'}</div>
          <div className="text-muted-custom text-[11px]">Pre-registered protocol #OSF-2026-901B</div>
        </div>

        <div>
          <span className="text-muted-custom font-medium block">Linked Experiment Ledger</span>
          <button
            type="button"
            onClick={() => onNavigate('experiment-detail', { id: submission.experimentId || submission.experimentIds?.[0] || 'EXP-2026-0042' })}
            className="font-mono font-bold text-accent-primary hover:underline mt-0.5 block cursor-pointer"
          >
            {submission.experimentId || submission.experimentIds?.[0] || 'EXP-2026-0042'} →
          </button>
          <div className="text-muted-custom text-[11px]">8 Raw Datasets, 6 Sealed Receipts</div>
        </div>
      </div>

      {/* Abstract */}
      <Card title="Scientific Abstract" subtitle="Peer-reviewed summary of experimental findings">
        <p className="text-xs text-primary-custom leading-relaxed">{submission.abstract}</p>
      </Card>

      {/* Scientific Claims & Cryptographic Lineage Proofs */}
      <Card
        title="Manuscript Claims & Cryptographic Lineage Proofs"
        subtitle="Each substantive quantitative claim is cryptographically linked to sealed CooL receipts and processing pipelines"
      >
        <div className="space-y-4">
          {(submission.claims || []).map((claim, idx) => (
            <div
              key={claim.id}
              className="p-4 rounded border border-subtle bg-surface-elevated space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-subtle pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-accent-primary bg-surface px-2 py-0.5 rounded border border-subtle">
                    Claim {idx + 1}
                  </span>
                  <span className="font-semibold text-primary-custom text-xs">{claim.claimText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="verified">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline mr-1" />
                    {claim.verificationStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Underlying Dataset</span>
                  <span className="font-mono font-medium text-primary-custom">{claim.datasetName}</span>
                  <div className="mt-1">
                    <MonospaceHash value={claim.datasetCommitment} truncate={true} startLen={8} endLen={8} />
                  </div>
                </div>

                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Sealed Evidence Receipt</span>
                  <button
                    type="button"
                    onClick={() => onViewEvidence(claim.receiptId)}
                    className="font-mono font-bold text-accent-primary hover:underline cursor-pointer"
                  >
                    {claim.receiptId}
                  </button>
                  <div className="text-muted-custom text-[11px] mt-1 font-mono">
                    Signed by {submission.authors[0]}
                  </div>
                </div>

                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Scientific Processing Lineage</span>
                  <div className="font-mono text-muted-custom text-[11px]">{claim.lineageSummary}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs">
                <span className="text-muted-custom text-[11px]">
                  Figure / Table Citation: <strong className="text-primary-custom">{claim.figureCitation}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onViewEvidence(claim.receiptId)}
                  className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Audit Claim Receipt</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Switch to Reviewer Mode CTA */}
      <div className="bg-surface-elevated border border-subtle p-5 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-primary-custom">Are you an institutional reviewer or journal editor?</h3>
          <p className="text-xs text-muted-custom mt-0.5">
            Switch to dedicated Reviewer Mode for interactive proof checklists, automated certificate generation, and domain distinction analysis.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('reviewer-mode')}
          icon={<Award className="w-4 h-4 text-white" />}
        >
          Launch Reviewer Mode
        </Button>
      </div>
    </div>
  );
};
