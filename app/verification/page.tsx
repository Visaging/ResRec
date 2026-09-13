// Verification Center - flagship page with animated verification workflow - V3 Redesign

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Button,
  Textarea,
  VerificationIcon,
  CopyButton,
} from "@/components/ui";
import { verifyEvidence } from "@/services/api";
import type { IntegrityCheck } from "@/types";
import { Upload, CheckCircle2, XCircle, Shield, AlertTriangle } from "lucide-react";
import { formatDateTimeFull } from "@/lib/utils";

// The individual cryptographic checks carried on an IntegrityCheck result.
type CheckKey =
  | "bindingVerified"
  | "signatureVerified"
  | "transparencyVerified"
  | "datasetCommitmentVerified"
  | "recordSequenceVerified";

const CHECKS: { label: string; key: CheckKey }[] = [
  { label: "Record Binding", key: "bindingVerified" },
  { label: "Signature", key: "signatureVerified" },
  { label: "Transparency Inclusion", key: "transparencyVerified" },
  { label: "Dataset Commitment", key: "datasetCommitmentVerified" },
  { label: "Record Sequence", key: "recordSequenceVerified" },
];

// Steps shown while verifying. Steps with a `key` resolve to that check's real
// outcome; the procedural steps without one always succeed, since reading the
// receipt and producing a verdict succeed even when the verdict is "failed".
const VERIFICATION_STEPS: { label: string; key?: CheckKey }[] = [
  { label: "Reading evidence receipt" },
  { label: "Validating record binding", key: "bindingVerified" },
  { label: "Checking cryptographic signatures", key: "signatureVerified" },
  { label: "Checking transparency inclusion", key: "transparencyVerified" },
  { label: "Verifying dataset commitment", key: "datasetCommitmentVerified" },
  { label: "Verifying record sequence", key: "recordSequenceVerified" },
  { label: "Generating verification verdict" },
];

type VerificationStep = {
  label: string;
  status: "pending" | "running" | "passed" | "failed";
};

// Illustrative digests for the commitment-mismatch panel. The mock verifier
// reports *that* the dataset commitment diverged but not the two digests, so
// these stand in for values a real verifier would return alongside the verdict.
const EXPECTED_COMMITMENT =
  "7f3a91bd42e8f1c9d0a5b3e7f2d8c4a6e9b1f5d3c7a2e8f4b6d9c1a5e3f7b2d8";
const OBSERVED_COMMITMENT =
  "2b91c4a7e3f5d2b8c1a6e9f4d3b7c2a5e8f1d6b9c3a4e7f2d5b8c1a9e6f3d7b2";

export default function VerificationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<IntegrityCheck | null>(null);
  const [steps, setSteps] = useState<VerificationStep[]>([]);
  const [simulate, setSimulate] = useState<"valid" | "tampered">("valid");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReceiptText("");
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);

    setSteps(
      VERIFICATION_STEPS.map(({ label }) => ({
        label,
        status: "pending" as const,
      }))
    );

    // Animate through steps
    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === i ? "running" : idx < i ? "passed" : "pending",
        }))
      );
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
    }

    try {
      const input = file || receiptText;
      const verificationResult = await verifyEvidence(input, { simulate });

      // Resolve each step against the check it actually represents.
      setSteps((prev) =>
        prev.map((s, idx) => {
          const key = VERIFICATION_STEPS[idx].key;
          const passed = key ? verificationResult[key] : true;
          return { ...s, status: passed ? "passed" : "failed" };
        })
      );

      // Small delay before showing result
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(verificationResult);
    } finally {
      setVerifying(false);
    }
  };

  const canVerify = file || receiptText.trim().length > 0;

  const resetVerification = () => {
    setResult(null);
    setSteps([]);
    setFile(null);
    setReceiptText("");
  };

  const failedChecks = result ? CHECKS.filter((c) => !result[c.key]) : [];

  return (
    <div>
      <PageHeader
        title="Evidence Verification"
        subtitle="Independently verify the integrity of submitted research evidence before review or approval."
      />

      <div className="max-w-5xl">
        <AnimatePresence mode="wait">
          {!result && !verifying && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Verification Input */}
              <div className="grid grid-cols-2 gap-8">
                <Card className="p-8">
                  <h2 className="text-base font-semibold text-ink mb-6">
                    Submit Evidence for Verification
                  </h2>

                  {/* File Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-ink mb-3">
                      Upload Evidence Receipt
                    </label>
                    <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border hover:border-border-strong transition-colors cursor-pointer bg-surface">
                      <Upload className="w-8 h-8 text-ink-muted mb-3" />
                      <span className="text-sm text-ink mb-1 font-medium">
                        {file ? file.name : "Choose a file"}
                      </span>
                      <span className="text-xs text-ink-faint">
                        JSON, PDF, or text evidence receipts
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".json,.pdf,.txt"
                      />
                    </label>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-ink-faint uppercase tracking-wide">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  {/* Text Input */}
                  <Textarea
                    label="Paste Evidence JSON"
                    placeholder="Paste the evidence receipt JSON here..."
                    rows={8}
                    value={receiptText}
                    onChange={(e) => {
                      setReceiptText(e.target.value);
                      setFile(null);
                    }}
                    className="font-mono text-xs"
                  />

                  {/* Verify Button */}
                  <Button
                    variant="primary"
                    onClick={handleVerify}
                    disabled={!canVerify}
                    className="w-full mt-6 py-3"
                    size="lg"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Evidence
                  </Button>
                </Card>

                {/* Awaiting Panel */}
                <div className="flex flex-col gap-6">
                  <Card className="p-8 flex flex-1 flex-col items-center justify-center bg-surface border border-border">
                    <Shield className="w-16 h-16 text-ink-muted mb-6" />
                    <h3 className="text-base font-semibold text-ink mb-2">
                      Awaiting Evidence
                    </h3>
                    <p className="text-sm text-ink-muted text-center max-w-sm">
                      Submit an evidence receipt to begin independent verification
                      of research record integrity.
                    </p>
                  </Card>

                  {/*
                    This build runs against mock data, so the verifier cannot
                    derive a verdict from the receipt itself. This selector
                    chooses which verdict the demo returns.
                  */}
                  <Card className="p-6 border border-warning/25 bg-warning/5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink mb-1">
                          Demonstration mode
                        </p>
                        <p className="text-xs text-ink-muted mb-4">
                          Verification results are simulated. Choose the verdict
                          this receipt should return.
                        </p>
                        <div
                          role="group"
                          aria-label="Simulated verification verdict"
                          className="grid grid-cols-2 gap-2"
                        >
                          {(
                            [
                              { value: "valid", label: "Valid receipt" },
                              { value: "tampered", label: "Tampered receipt" },
                            ] as const
                          ).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSimulate(option.value)}
                              aria-pressed={simulate === option.value}
                              className={`px-3 py-2 text-xs font-medium border transition-colors ${
                                simulate === option.value
                                  ? "border-primary bg-primary text-primary-ink"
                                  : "border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verification in Progress */}
          {verifying && !result && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-8">
                <h2 className="text-lg font-semibold text-ink mb-8">
                  Verification in Progress
                </h2>

                <div className="max-w-xl mx-auto">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 py-4 border-b border-border last:border-0"
                    >
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        {step.status === "running" && (
                          <div className="w-5 h-5 border-2 border-primary/20 border-t-transparent rounded-full animate-spin" />
                        )}
                        {step.status === "passed" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          </motion.div>
                        )}
                        {step.status === "failed" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <XCircle className="w-5 h-5 text-error" />
                          </motion.div>
                        )}
                        {step.status === "pending" && (
                          <div className="w-2 h-2 bg-surface-elevated rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          step.status === "running"
                            ? "text-primary"
                            : step.status === "passed"
                            ? "text-success"
                            : step.status === "failed"
                            ? "text-error"
                            : "text-ink-muted"
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Verification Result - Success */}
          {result && result.verified && (
            <motion.div
              key="passed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-8 border border-success/20 bg-success/5">
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-success flex-shrink-0" />
                  </motion.div>
                  <div>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl font-semibold text-success mb-2"
                    >
                      Verification Passed
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-sm text-success/80"
                    >
                      Evidence integrity confirmed. All cryptographic checks have passed successfully.
                    </motion.p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <h3 className="text-base font-semibold text-ink mb-6">
                  Verification Details
                </h3>

                <div className="space-y-0">
                  {CHECKS.map((check, index) => (
                    <motion.div
                      key={check.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between py-4 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-ink">{check.label}</span>
                      <div className="flex items-center gap-2">
                        <VerificationIcon
                          status={result[check.key] ? "verified" : "failed"}
                        />
                        <span
                          className={`text-sm font-medium uppercase tracking-wide ${
                            result[check.key] ? "text-success" : "text-error"
                          }`}
                        >
                          {result[check.key] ? "Verified" : "Failed"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border text-xs text-ink-muted">
                  Verification completed: {formatDateTimeFull(result.lastVerification)}
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={resetVerification}>
                  Verify Another Receipt
                </Button>
                <Button variant="primary">Download Verification Report</Button>
              </div>
            </motion.div>
          )}

          {/* Verification Result - Failed */}
          {result && !result.verified && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-8 border border-error/20 bg-error/5">
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    <XCircle className="w-10 h-10 text-error flex-shrink-0" />
                  </motion.div>
                  <div>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl font-semibold text-error mb-2"
                    >
                      Integrity Verification Failed
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-sm text-error/80"
                    >
                      {failedChecks.length === 1
                        ? `One cryptographic check did not pass: ${failedChecks[0].label}.`
                        : `${failedChecks.length} cryptographic checks did not pass.`}
                    </motion.p>
                  </div>
                </div>
              </Card>

              {/* Per-check breakdown, so passing checks stay visible alongside failures */}
              <Card className="p-8">
                <h3 className="text-base font-semibold text-ink mb-6">
                  Verification Details
                </h3>

                <div className="space-y-0">
                  {CHECKS.map((check, index) => (
                    <motion.div
                      key={check.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between py-4 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-ink">{check.label}</span>
                      <div className="flex items-center gap-2">
                        <VerificationIcon
                          status={result[check.key] ? "verified" : "failed"}
                        />
                        <span
                          className={`text-sm font-medium uppercase tracking-wide ${
                            result[check.key] ? "text-success" : "text-error"
                          }`}
                        >
                          {result[check.key] ? "Verified" : "Failed"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border text-xs text-ink-muted">
                  Verification completed: {formatDateTimeFull(result.lastVerification)}
                </div>
              </Card>

              {/* Reported issues */}
              {result.issues.length > 0 && (
                <Card className="p-8">
                  <h3 className="text-base font-semibold text-ink mb-4">
                    Reported Issues
                  </h3>
                  <ul className="space-y-3">
                    {result.issues.map((issue) => (
                      <li key={issue} className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-ink">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Commitment diff, only meaningful when the commitment check failed */}
              {!result.datasetCommitmentVerified && (
                <Card className="p-8">
                  <h3 className="text-base font-semibold text-ink mb-6">
                    Dataset Commitment Mismatch
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2 block">
                        Expected Commitment
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                          {EXPECTED_COMMITMENT}
                        </code>
                        <CopyButton text={EXPECTED_COMMITMENT} />
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2 block">
                        Observed Commitment
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-error bg-error/10 px-3 py-2 border border-border overflow-x-auto">
                          {OBSERVED_COMMITMENT}
                        </code>
                        <CopyButton text={OBSERVED_COMMITMENT} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                            Affected Record
                          </span>
                          <p className="font-mono text-xs text-ink mt-1">REC-91A2C847</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                            Timestamp
                          </span>
                          <p className="text-sm text-ink-muted mt-1">
                            {formatDateTimeFull(result.lastVerification)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-surface border border-border mt-4">
                      <p className="text-sm text-ink font-medium mb-1">Conclusion</p>
                      <p className="text-sm text-ink/80">
                        The current dataset differs from the dataset represented by the recorded evidence.
                        Review recommended.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={resetVerification}>
                  Verify Another Receipt
                </Button>
                <Button variant="primary">Download Verification Report</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
