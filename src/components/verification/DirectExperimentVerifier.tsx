import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RotateCw, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MonospaceHash } from '../common/MonospaceHash';
import { StatusIndicator } from '../common/StatusIndicator';
import type { Experiment, VerificationResult } from '../../types';
import { verifyReceipt } from '../../services/verification';

interface DirectExperimentVerifierProps {
  experiment: Experiment;
  onNavigateToVerificationCenter: () => void;
}

export const DirectExperimentVerifier: React.FC<DirectExperimentVerifierProps> = ({
  experiment,
  onNavigateToVerificationCenter,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleRunVerification = async () => {
    setIsVerifying(true);
    // Simulate real verifier latency (350ms)
    setTimeout(async () => {
      const res = await verifyReceipt({
        id: 'REC-7F82-110C',
        experimentId: experiment.id,
        datasetName: 'thermal-cycling-042.csv',
        commitment: 'mh:sha256:7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd',
      });
      setResult(res);
      setIsVerifying(false);
    }, 350);
  };

  return (
    <div className="space-y-6 animate-subtle-fade">
      <Card
        title={`Live Cryptographic Integrity Verification: ${experiment.id}`}
        subtitle="Compare current experimental dataset and measurement ledger against sealed CooL commitments"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunVerification}
            disabled={isVerifying}
            icon={<RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />}
          >
            {isVerifying ? 'Verifying Proofs...' : 'Run Integrity Verification'}
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          {!result ? (
            <div className="p-8 text-center bg-surface-elevated rounded border border-dashed border-subtle">
              <ShieldCheck className="w-10 h-10 text-muted-custom mx-auto mb-2" />
              <div className="font-semibold text-primary-custom">
                Ready to Verify Experimental Ledger
              </div>
              <p className="text-muted-custom text-xs mt-1 max-w-md mx-auto">
                Execute independent cryptographic audit against distributed witnesses and transparency logs.
              </p>
              <div className="mt-4">
                <Button variant="primary" size="sm" onClick={handleRunVerification}>
                  Verify Now
                </Button>
              </div>
            </div>
          ) : result.overallStatus === 'failed' ? (
            <div className="bg-danger-surface border border-danger-border rounded p-4 space-y-3">
              <div className="flex items-center gap-2 text-danger-text font-bold text-sm">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>INTEGRITY VERIFICATION FAILED</span>
              </div>

              <p className="text-danger-text leading-relaxed font-medium">
                The submitted dataset does not match the commitment recorded in the evidence receipt.
                The recorded dataset differs from the committed evidence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                <div className="p-3 bg-surface rounded border border-danger-border">
                  <span className="text-muted-custom block font-sans text-xs mb-1">Expected Commitment (Recorded):</span>
                  <MonospaceHash value={result.expectedCommitment || ''} truncate={false} className="w-full justify-between" />
                </div>
                <div className="p-3 bg-surface rounded border border-danger-border">
                  <span className="text-rose-500 block font-sans text-xs mb-1">Observed Commitment (Current Dataset):</span>
                  <MonospaceHash value={result.observedCommitment || ''} truncate={false} className="w-full justify-between text-rose-500 font-bold" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-danger-border text-primary-custom">
                <span>
                  Affected Record:{' '}
                  <span className="font-mono font-bold text-primary-custom">{result.affectedRecordId}</span> (Trial 01 value altered)
                </span>
                <span className="font-semibold text-rose-500">Scientific Review Recommended</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>EVIDENCE INTEGRITY VERIFIED</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Dataset Commitment:</span>
                  <StatusIndicator status={result.checks.datasetCommitment} />
                </div>
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Signature Validity:</span>
                  <StatusIndicator status={result.checks.signature} />
                </div>
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Record Binding:</span>
                  <StatusIndicator status={result.checks.recordBinding} />
                </div>
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Transparency Log:</span>
                  <StatusIndicator status={result.checks.transparencyInclusion} />
                </div>
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Witness Consensus:</span>
                  <StatusIndicator status={result.checks.witnessConsensus} />
                </div>
                <div className="p-2.5 bg-surface rounded border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-primary-custom">Enclave Attestation:</span>
                  <StatusIndicator status={result.checks.hardwareAttestation} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-muted-custom">
                <span>All 6 cryptographic proof checkpoints successfully validated against witness network.</span>
                <button
                  type="button"
                  onClick={onNavigateToVerificationCenter}
                  className="font-medium text-accent-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Verification Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
