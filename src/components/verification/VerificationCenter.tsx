import React, { useState } from 'react';
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { StatusIndicator } from '../common/StatusIndicator';
import { appState } from '../../services/api';
import { verifyReceipt } from '../../services/verification';
import type { VerificationResult } from '../../types';
import { formatDate } from '../../lib/utils';

interface VerificationCenterProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const VerificationCenter: React.FC<VerificationCenterProps> = ({
  onViewEvidence,
}) => {
  const experiments = appState.getExperiments();
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0]?.id || 'EXP-2026-0042');
  const [verificationMode, setVerificationMode] = useState<'experiment' | 'receipt' | 'upload'>('experiment');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [customReceiptId, setCustomReceiptId] = useState('REC-7F82-110C');
  const [uploadedReceiptJson, setUploadedReceiptJson] = useState('');

  const handleRunVerification = async () => {
    setIsVerifying(true);
    // Simulate real verifier latency (400ms)
    setTimeout(async () => {
      let payload: string | object;
      if (verificationMode === 'upload' && uploadedReceiptJson.trim()) {
        payload = uploadedReceiptJson.trim();
      } else if (verificationMode === 'receipt') {
        payload = {
          id: customReceiptId.trim() || 'REC-7F82-110C',
          experimentId: selectedExpId,
        };
      } else {
        payload = {
          id: 'REC-7F82-110C',
          experimentId: selectedExpId,
          datasetName: 'thermal-cycling-042.csv',
          commitment: 'mh:sha256:7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd',
        };
      }

      const result = await verifyReceipt(payload);
      setVerificationResult(result);
      setIsVerifying(false);
    }, 400);
  };

  const handleRestoreClean = () => {
    appState.resetTamper();
    handleRunVerification();
  };

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Header */}
      <div className="border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Cryptographic Verification Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Independently recompute CooL multihashes, validate Ed25519 signatures, check witness quorums, and detect unrecorded alterations.
          </p>
        </div>
      </div>

      {/* Verification Mode Selector & Target */}
      <div className="bg-surface p-4 rounded border border-subtle grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-muted-custom font-medium mb-1.5">Verification Mode</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface-elevated rounded border border-subtle">
            <button
              type="button"
              onClick={() => setVerificationMode('experiment')}
              className={`py-1 px-2 rounded font-medium transition-all ${
                verificationMode === 'experiment'
                  ? 'bg-surface text-primary-custom shadow-xs font-semibold'
                  : 'text-muted-custom hover:text-primary-custom'
              }`}
            >
              Experiment
            </button>
            <button
              type="button"
              onClick={() => setVerificationMode('receipt')}
              className={`py-1 px-2 rounded font-medium transition-all ${
                verificationMode === 'receipt'
                  ? 'bg-surface text-primary-custom shadow-xs font-semibold'
                  : 'text-muted-custom hover:text-primary-custom'
              }`}
            >
              Receipt ID
            </button>
            <button
              type="button"
              onClick={() => setVerificationMode('upload')}
              className={`py-1 px-2 rounded font-medium transition-all ${
                verificationMode === 'upload'
                  ? 'bg-surface text-primary-custom shadow-xs font-semibold'
                  : 'text-muted-custom hover:text-primary-custom'
              }`}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {verificationMode === 'experiment' && (
          <div>
            <label className="block text-muted-custom font-medium mb-1.5">Select Target Experiment</label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono font-medium text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.id} — {exp.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {verificationMode === 'receipt' && (
          <div>
            <label className="block text-muted-custom font-medium mb-1.5">Evidence Receipt ID</label>
            <input
              type="text"
              value={customReceiptId}
              onChange={(e) => setCustomReceiptId(e.target.value)}
              className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              placeholder="REC-XXXX-XXXX"
            />
          </div>
        )}

        {verificationMode === 'upload' && (
          <div className="md:col-span-2">
            <label className="block text-muted-custom font-medium mb-1.5">Paste Receipt JSON or Drop File</label>
            <textarea
              rows={2}
              value={uploadedReceiptJson}
              onChange={(e) => setUploadedReceiptJson(e.target.value)}
              placeholder="Paste CooL receipt JSON here..."
              className="w-full rounded border border-default bg-surface py-1 px-2 font-mono text-[11px] text-primary-custom focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        )}

        <div className="flex items-end">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            onClick={handleRunVerification}
            disabled={isVerifying}
            icon={<RotateCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />}
          >
            {isVerifying ? 'Running Cryptographic Verification...' : 'Execute Proof Verification'}
          </Button>
        </div>
      </div>

      {/* Verification Output / Status */}
      {verificationResult && (
        <div className="space-y-4">
          {verificationResult.overallStatus === 'failed' ? (
            /* Failed Result Card */
            <div className="bg-danger-surface border border-danger-border rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-danger-border pb-3">
                <div className="flex items-center gap-2 text-danger-text font-bold text-sm">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span>INTEGRITY VERIFICATION FAILED: COMMITMENT MISMATCH</span>
                </div>
                <Badge variant="destructive">VERIFICATION FAILED</Badge>
              </div>

              <div className="text-xs text-danger-text leading-relaxed font-medium">
                The submitted dataset does not match the commitment recorded in the evidence receipt.
                The recorded dataset differs from the committed evidence.
              </div>

              {/* Mismatch Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-surface p-3.5 rounded border border-danger-border space-y-1.5">
                  <div className="font-sans font-semibold text-primary-custom flex items-center justify-between">
                    <span>Expected Commitment (From Signed Receipt)</span>
                    <span className="text-[10px] text-muted-custom font-mono">REC-7F82-110C</span>
                  </div>
                  <MonospaceHash
                    value={verificationResult.expectedCommitment || ''}
                    truncate={false}
                    className="w-full justify-between text-[11px]"
                  />
                  <div className="text-[11px] text-muted-custom font-sans pt-1">
                    Recorded at 2026-09-13 14:00:00 UTC by Dr. Elena Vance
                  </div>
                </div>

                <div className="bg-surface p-3.5 rounded border border-danger-border space-y-1.5">
                  <div className="font-sans font-semibold text-rose-500 flex items-center justify-between">
                    <span>Observed Commitment (Calculated from Current File)</span>
                    <span className="text-[10px] text-rose-500 font-mono">MODIFIED</span>
                  </div>
                  <MonospaceHash
                    value={verificationResult.observedCommitment || ''}
                    truncate={false}
                    className="w-full justify-between text-[11px] text-rose-500 font-bold"
                  />
                  <div className="text-[11px] text-rose-500 font-sans pt-1">
                    Unrecorded alteration detected in Trial 01 row (temperature altered)
                  </div>
                </div>
              </div>

              {/* Cryptographic breakdown */}
              <div className="bg-surface p-3.5 rounded border border-danger-border space-y-2">
                <h4 className="font-semibold text-primary-custom text-xs">Proof Check Execution Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 bg-surface-elevated rounded border border-danger-border flex items-center justify-between">
                    <span className="text-primary-custom">Dataset Commitment:</span>
                    <StatusIndicator status="failed" />
                  </div>
                  <div className="p-2 bg-surface-elevated rounded border border-subtle flex items-center justify-between">
                    <span className="text-primary-custom">Signature Valid:</span>
                    <StatusIndicator status="verified" />
                  </div>
                  <div className="p-2 bg-surface-elevated rounded border border-subtle flex items-center justify-between">
                    <span className="text-primary-custom">Witness Consensus:</span>
                    <StatusIndicator status="verified" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreClean}
                >
                  Restore Original Clean Dataset
                </Button>
                <button
                  type="button"
                  onClick={() => onViewEvidence('REC-7F82-110C')}
                  className="text-xs font-semibold text-danger-text hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Sealed Receipt REC-7F82-110C</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Verified Success Card */
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>ALL CRYPTOGRAPHIC PROOFS VERIFIED</span>
                </div>
                <Badge variant="verified">100% PROOFS VALID</Badge>
              </div>

              <p className="text-xs text-primary-custom leading-relaxed">
                The target dataset matches the exact byte-level multihash committed in evidence record{' '}
                <span className="font-mono font-bold text-primary-custom">REC-7F82-110C</span>. No post-recording modifications or omissions detected.
              </p>

              {/* Proof Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Dataset Multihash</div>
                    <div className="text-[10px] text-muted-custom font-mono">CooL SHA-256 matches</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.datasetCommitment} />
                </div>

                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Ed25519 Signature</div>
                    <div className="text-[10px] text-muted-custom font-mono">Institutional DID key</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.signature} />
                </div>

                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Record Binding</div>
                    <div className="text-[10px] text-muted-custom font-mono">Merkle sequence intact</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.recordBinding} />
                </div>

                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Transparency Log</div>
                    <div className="text-[10px] text-muted-custom font-mono">Tree head inclusion verified</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.transparencyInclusion} />
                </div>

                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Witness Quorum</div>
                    <div className="text-[10px] text-muted-custom font-mono">4/4 Independent nodes</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.witnessConsensus} />
                </div>

                <div className="p-3 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Enclave Attestation</div>
                    <div className="text-[10px] text-muted-custom font-mono">Distinguishes vs Not Provided</div>
                  </div>
                  <StatusIndicator status={verificationResult.checks.hardwareAttestation} />
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs text-muted-custom">
                <span className="font-mono text-[11px]">Audit Timestamp: {formatDate(verificationResult.timestamp || new Date().toISOString())}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewEvidence('REC-7F82-110C')}
                >
                  View Evidence Receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Verification Audits */}
      <Card
        title="Institutional Verification Audit Log"
        subtitle="Historical verification runs performed by external reviewers and compliance daemons"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Verification Audit ID</th>
                <th className="px-4 py-3 font-semibold">Target Experiment / Receipt</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Verifier Identity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              <tr className="hover:bg-surface-elevated transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-primary-custom">VER-2026-9901</td>
                <td className="px-4 py-3 font-mono">EXP-2026-0042 (REC-7F82-110C)</td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-custom">2026-09-13 15:30:00</td>
                <td className="px-4 py-3 text-primary-custom">Nature Battery Reviewer Node #3</td>
                <td className="px-4 py-3">
                  <Badge variant="verified">VERIFIED</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-custom">
                  6/6 proofs pass
                </td>
              </tr>
              <tr className="hover:bg-surface-elevated transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-primary-custom">VER-2026-9892</td>
                <td className="px-4 py-3 font-mono">EXP-2026-0042 (REC-88A2-0043)</td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-custom">2026-09-13 14:15:10</td>
                <td className="px-4 py-3 text-primary-custom">NSF Compliance Daemon v2.4</td>
                <td className="px-4 py-3">
                  <Badge variant="verified">VERIFIED</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-custom">
                  6/6 proofs pass
                </td>
              </tr>
              <tr className="hover:bg-surface-elevated transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-primary-custom">VER-2026-9880</td>
                <td className="px-4 py-3 font-mono">EXP-2026-0039 (REC-B441-0021)</td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-custom">2026-09-12 18:02:11</td>
                <td className="px-4 py-3 text-primary-custom">Stanford Institutional Auditor</td>
                <td className="px-4 py-3">
                  <Badge variant="verified">VERIFIED</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-custom">
                  6/6 proofs pass
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
