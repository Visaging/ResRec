import React, { useState } from 'react';
import {
  Award,
  AlertCircle,
  Printer,
  Copy,
  Check,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { appState } from '../../services/api';
import { formatDate } from '../../lib/utils';

interface ReviewerModeViewProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence?: (evidenceId: string) => void;
}

export const ReviewerModeView: React.FC<ReviewerModeViewProps> = ({
  onNavigate,
}) => {
  const submission = appState.getSubmission() || {
    id: 'SUB-2026-NMAT-0042',
    title: 'Anomalous Thermal Runaway Dynamics in High-Nickel Layered Oxide Lithium Batteries Under Fast-Charging Cycling',
    doi: '10.1038/s41563-026-0042-8',
    authors: ['Dr. Elena Vance', 'Dr. Marcus Vance', 'Prof. Arthur Sterling'],
    institution: 'National Institute of Materials & Energy Research',
  };

  const [checklist, setChecklist] = useState({
    immutability: true,
    corrections: true,
    transparency: true,
    witnesses: true,
    lineage: true,
    reproducibility: true,
  });

  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedCert, setCopiedCert] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const certificateId = 'CERT-RR-2026-NMAT-0042';

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="font-mono text-xs">
              PEER REVIEW & AUDIT INTERFACE
            </Badge>
            <span className="text-xs text-muted-custom font-mono">Role: Institutional Integrity Auditor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom mt-1">
            Institutional Review & Integrity Audit Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-0.5">
            Audit manuscript #{submission.id}: "{submission.title}"
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('submissions')}
          >
            View Standard Submission
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCertificate(true)}
            icon={<Award className="w-3.5 h-3.5" />}
          >
            Generate Verification Certificate
          </Button>
        </div>
      </div>

      {/* Critical Core Concept: Scientific Correctness vs Cryptographic Integrity */}
      <div className="bg-surface-elevated text-primary-custom p-4 sm:p-5 rounded border border-subtle space-y-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Core Institutional Distinction: Cryptographic Evidence vs Scientific Domain Validity</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-primary-custom">
          <div className="bg-surface p-3.5 rounded border border-emerald-500/20 space-y-2">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              What ResRec / CooL Proves Cryptographically
            </span>
            <ul className="space-y-1.5 text-[11px] text-muted-custom">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-primary-custom">The raw measurement data was committed at the exact stated timestamp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-primary-custom">Data was not altered, cherry-picked, or silently omitted after recording.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-primary-custom">All corrections are explicitly linked via non-destructive audit lineage.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-primary-custom">Execution artifacts and code ran in the declared container environment.</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface p-3.5 rounded border border-blue-500/20 space-y-2">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
              What Requires Domain Peer Review
            </span>
            <ul className="space-y-1.5 text-[11px] text-muted-custom">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">◆</span>
                <span className="text-primary-custom">Physical sensor calibration and electrochemical experimental methodology.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">◆</span>
                <span className="text-primary-custom">Theoretical justification for the Arrhenius model formulation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">◆</span>
                <span className="text-primary-custom">Biological or material relevance of the chosen temperature ranges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">◆</span>
                <span className="text-primary-custom">Soundness of qualitative scientific conclusions and broader claims.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviewer Verification Checklist */}
      <Card
        title="Institutional Verification Checklist"
        subtitle="Cryptographic verification steps verified by ResRec audit engine"
      >
        <div className="divide-y divide-subtle text-xs">
          <div
            onClick={() => toggleCheck('immutability')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">1</span>
                <span>Data Immutability & Multihash Integrity</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                Target dataset multihash matches SHA-256 sealed in evidence receipt REC-7F82-110C.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.immutability}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div
            onClick={() => toggleCheck('corrections')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">2</span>
                <span>Non-destructive Correction Ledger</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                Cycle #14 outlier correction preserves original reading (38.2 °C) with signed justification.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.corrections}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div
            onClick={() => toggleCheck('transparency')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">3</span>
                <span>Transparency Log Inclusion</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                Inclusion proof confirmed at Merkle leaf #148920 in public transparency log.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.transparency}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div
            onClick={() => toggleCheck('witnesses')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">4</span>
                <span>Independent Witness Node Quorum</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                Signed by 4 of 4 independent institutional witness nodes (MIT, Berkeley, SLAC, CERN).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.witnesses}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div
            onClick={() => toggleCheck('lineage')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">5</span>
                <span>End-to-End Scientific Provenance Lineage</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                All 6 intermediate pipeline steps from physical cycler acquisition to Figure 3 confirmed unbroken.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.lineage}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div
            onClick={() => toggleCheck('reproducibility')}
            className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-elevated px-2 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-primary-custom flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-surface-elevated text-primary-custom font-mono text-[10px] flex items-center justify-center font-bold border border-subtle">6</span>
                <span>Computational Environment Attestation</span>
              </div>
              <div className="text-muted-custom text-[11px] ml-6 mt-0.5">
                Container SHA-256 hash verified against pipeline spec #RESREC-ENV-2026.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="verified">VERIFIED</Badge>
              <input
                type="checkbox"
                checked={checklist.reproducibility}
                onChange={() => {}}
                className="rounded border-default text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded border border-subtle max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-subtle-scale">
            <div className="border-2 border-dashed border-accent-primary p-6 space-y-4 bg-surface-elevated rounded">
              <div className="text-center space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-widest text-muted-custom">
                  ResRec Institutional Integrity Ledger
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-primary-custom tracking-tight">
                  Certificate of Cryptographic Verification
                </h2>
                <div className="font-mono text-xs text-muted-custom">ID: {certificateId}</div>
              </div>

              <div className="border-t border-b border-subtle py-4 space-y-2 text-xs text-primary-custom">
                <p>
                  This certifies that the experimental dataset, telemetry streams, and analysis lineage supporting manuscript:
                </p>
                <div className="p-3 bg-surface rounded border border-subtle font-semibold text-primary-custom text-center">
                  "{submission.title}"
                </div>
                <p className="text-[11px] text-muted-custom">
                  Authored by <strong className="text-primary-custom">{submission.authors.join(', ')}</strong> at{' '}
                  <strong className="text-primary-custom">{submission.institution}</strong>, have been independently audited and verified against the ResRec continuous proof ledger.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-primary-custom">
                <div>
                  <span className="text-muted-custom block text-[10px]">Verification Date:</span>
                  <span className="font-bold">{formatDate(new Date().toISOString())}</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[10px]">Attestation Protocol:</span>
                  <span className="font-bold">CooL-Receipt-v4</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[10px]">Integrity Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% VERIFIED</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[10px]">Witness Quorum:</span>
                  <span className="font-bold">4 / 4 CONSENSUS</span>
                </div>
              </div>

              <div className="border-t border-subtle pt-3 text-[10px] text-muted-custom font-mono text-center">
                Seal Hash: 7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `ResRec Cryptographic Verification Certificate\nCertificate ID: ${certificateId}\nSubmission: ${submission.title}\nStatus: 100% VERIFIED\nDate: ${new Date().toISOString()}`
                  );
                  setCopiedCert(true);
                  setTimeout(() => setCopiedCert(false), 2000);
                }}
                icon={copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedCert ? 'Copied to Clipboard' : 'Copy Attestation'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintCertificate}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print / Export PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCertificate(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
