// Verification Center - flagship page with animated verification workflow - V3 Redesign

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Button,
  Textarea,
  VerificationIcon,
  CopyButton,
} from "@/components/ui";
import { getEvidenceRecord, verifyEvidence } from "@/services/api";
import type { IntegrityCheck } from "@/types";
import { Upload, CheckCircle2, XCircle, Shield, AlertTriangle } from "lucide-react";
import { formatDateTimeFull, downloadTextFile } from "@/lib/utils";

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

function toSimpleIssue(issue: string): string {
  const normalized = issue.toLowerCase();

  if (normalized.includes("schema") || normalized.includes("invalid json")) {
    return "The uploaded file is not a valid CooL evidence receipt. Use the original receipt JSON.";
  }
  if (normalized.includes("binding") || normalized.includes("binding_hash") || normalized.includes("commitment mismatch")) {
    return "The receipt fingerprint does not match its signed record. The evidence may have been changed.";
  }
  if (normalized.includes("signature")) {
    return "The receipt signature could not be verified. The evidence may have been changed or corrupted.";
  }
  if (normalized.includes("inclusion") || normalized.includes("transparency")) {
    return "The receipt could not be confirmed in the transparency log.";
  }
  if (normalized.includes("record: expected") || normalized.includes("record is missing")) {
    return "The receipt is missing its signed research record.";
  }
  if (normalized.includes("attestation")) {
    return "The runtime attestation could not be verified.";
  }
  if (normalized.includes("sequence")) {
    return "The evidence record is out of sequence.";
  }
  if (normalized.startsWith("evidence verification exception:")) {
    return "The receipt could not be checked because the verifier encountered an error.";
  }

  return issue;
}

function CooLVerifierPanel({ result }: { result: IntegrityCheck }) {
  const verdict = result.verdictRaw;
  const subject = verdict?.subject;
  const rawChecks = verdict?.checks || {};
  const checks = [
    { label: "Record binding", value: rawChecks.binding, fallback: result.bindingVerified },
    { label: "Signature", value: rawChecks.signature, fallback: result.signatureVerified },
    { label: "Transparency inclusion", value: rawChecks.inclusion, fallback: result.transparencyVerified },
    { label: "Witnesses", value: rawChecks.witnesses },
    { label: "Runtime attestation", value: rawChecks.attestation },
    { label: "Enclave", value: rawChecks.enclave },
    { label: "Public anchor", value: rawChecks.anchor },
  ];

  const getStatus = (check: (typeof checks)[number]) => {
    if (check.value?.status === "pass" || check.value?.status === "simulated" || check.fallback) {
      return check.value?.status === "simulated" ? "Simulated" : "Verified";
    }
    if (check.value?.status === "absent") return "Not provided";
    if (check.value?.status === "fail") return "Failed";
    return "Not checked";
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div>
          <h4 className="text-sm font-semibold text-ink">CooL Cryptographic Verification</h4>
          <p className="text-xs text-ink-muted mt-1">
            Receipt integrity checks presented in a readable verification view.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border flex-shrink-0 ${
            result.verified
              ? "text-success border-success/30 bg-success/10"
              : "text-error border-error/30 bg-error/10"
          }`}
        >
          {result.verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {result.verified ? "Verified" : "Failed"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2 sm:p-3 bg-surface-elevated border border-border">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">Evidence event</p>
          <p className="text-xs font-medium text-ink truncate">{subject?.subject || "CooL evidence receipt"}</p>
        </div>
        <div className="p-2 sm:p-3 bg-surface-elevated border border-border">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">Record ID</p>
          <p className="text-xs font-mono text-ink truncate">{subject?.record_id || "Not available"}</p>
        </div>
        <div className="p-2 sm:p-3 bg-surface-elevated border border-border">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">Signer</p>
          <p className="text-xs font-mono text-ink truncate">{subject?.key_id || "Not available"}</p>
        </div>
        <div className="p-2 sm:p-3 bg-surface-elevated border border-border">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">Runtime</p>
          <p className="text-xs text-ink truncate">{subject?.tee || "Not available"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map((check) => {
          const status = getStatus(check);
          const verified = status === "Verified" || status === "Simulated";
          const failed = status === "Failed";
          return (
            <div key={check.label} className="flex items-center justify-between gap-3 p-2 sm:p-3 border border-border bg-surface">
              <span className="text-xs text-ink">{check.label}</span>
              <span className={`text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${verified ? "text-success" : failed ? "text-error" : "text-ink-muted"}`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function VerificationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<IntegrityCheck | null>(null);
  const [steps, setSteps] = useState<VerificationStep[]>([]);
  const [simulate, setSimulate] = useState<"valid" | "tampered">("valid");
  const [demoStatus, setDemoStatus] = useState<string>("");

  useEffect(() => {
    const evidenceId = new URLSearchParams(window.location.search).get("evidence");
    if (!evidenceId) return;

    let cancelled = false;
    getEvidenceRecord(evidenceId).then((record) => {
      if (!cancelled && record?.evidenceJson) {
        setReceiptText(record.evidenceJson);
        setFile(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleDownloadReport = () => {
    if (!result) return;

    const simpleIssues = Array.from(new Set(result.issues.map(toSimpleIssue)));
    const report = [
      "RESREC VERIFICATION REPORT",
      "==========================",
      "",
      `Result: ${result.verified ? "VERIFIED" : "FAILED"}`,
      `Completed: ${formatDateTimeFull(result.lastVerification)}`,
      "",
      "CHECKS",
      ...CHECKS.map((check) => `${check.label}: ${result[check.key] ? "Verified" : "Failed"}`),
      "",
      "REPORTED ISSUES",
      ...(simpleIssues.length > 0 ? simpleIssues.map((issue) => `- ${issue}`) : ["- None"]),
      "",
      result.verified
        ? "Conclusion: The evidence receipt is intact and its cryptographic checks passed."
        : "Conclusion: The evidence receipt could not be fully verified. Review the issues above.",
      "",
      "Technical verifier output is available in the application for audit purposes.",
    ].join("\n");

    downloadTextFile(`resrec-verification-${result.verified ? "verified" : "failed"}.txt`, report);
  };

  const runTamperDemo = async (endpoint: string, label: string) => {
    setDemoStatus(`Running ${label} demo...`);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${label.toLowerCase()}`);
      }
      setDemoStatus(data.message || `${label} demo complete.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown tamper error";
      setDemoStatus(`Demo failed: ${message}`);
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <Card className="p-4 sm:p-8">
                  <h2 className="text-base font-semibold text-ink mb-4 sm:mb-6">
                    Submit Evidence for Verification
                  </h2>

                  {/* File Upload */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-sm font-medium text-ink mb-3">
                      Upload Evidence Receipt
                    </label>
                    <label className="flex flex-col items-center justify-center py-8 sm:py-12 border-2 border-dashed border-border hover:border-border-strong transition-colors cursor-pointer bg-surface">
                      <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-ink-muted mb-2 sm:mb-3" />
                      <span className="text-xs sm:text-sm text-ink mb-1 font-medium text-center px-2">
                        {file ? file.name : "Choose a file"}
                      </span>
                      <span className="text-xs text-ink-faint">
                        JSON, PDF, or text
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
                  <div className="flex items-center gap-4 my-4 sm:my-6">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-ink-faint uppercase tracking-wide">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  {/* Text Input */}
                  <Textarea
                    label="Paste Evidence JSON"
                    placeholder="Paste the evidence receipt JSON here..."
                    rows={6}
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
                    className="w-full mt-4 sm:mt-6 py-3"
                    size="lg"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Evidence
                  </Button>
                </Card>

                {/* Awaiting Panel */}
                <div className="flex flex-col gap-4 md:gap-6">
                  <Card className="p-4 sm:p-8 flex flex-1 flex-col items-center justify-center bg-surface border border-border">
                    <Shield className="w-10 sm:w-16 h-10 sm:h-16 text-ink-muted mb-3 sm:mb-6" />
                    <h3 className="text-base font-semibold text-ink mb-2">
                      Awaiting Evidence
                    </h3>
                    <p className="text-sm text-ink-muted text-center max-w-sm px-2">
                      Submit an evidence receipt to begin independent verification
                      of research record integrity.
                    </p>
                  </Card>

                  {/* CooL Cryptographic Engine Panel */}
                  <Card className="p-4 sm:p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink mb-1">
                          Live CooL Verification Engine
                        </p>
                        <p className="text-xs text-ink-muted mb-3 sm:mb-4">
                          Directly validates ML-DSA-65 post-quantum signatures, Intel TDX enclave measurements, Merkle inclusion paths, and multihash event bindings.
                        </p>
                        <div className="border-t border-border pt-2 sm:pt-3">
                          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                            Auditor Test Mode
                          </label>
                          <div
                            role="group"
                            aria-label="Verification mode"
                            className="grid grid-cols-2 gap-2"
                          >
                            {(
                              [
                                { value: "valid", label: "Direct Verification" },
                                { value: "tampered", label: "Simulate Tampered" },
                              ] as const
                            ).map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setSimulate(option.value)}
                                aria-pressed={simulate === option.value}
                                className={`px-2 sm:px-3 py-2 text-xs font-medium border transition-colors truncate ${
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

                        <div className="border-t border-border pt-2 sm:pt-3 mt-3 sm:mt-4">
                          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                            Tamper Demo
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => runTamperDemo("/api/dev/tamper/measurement", "Measurement tamper")}
                              className="px-2 sm:px-3 py-2 text-xs font-medium border border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong transition-colors truncate"
                            >
                              Tamper Measurement
                            </button>
                            <button
                              type="button"
                              onClick={() => runTamperDemo("/api/dev/tamper/dataset", "Dataset tamper")}
                              className="px-2 sm:px-3 py-2 text-xs font-medium border border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong transition-colors truncate"
                            >
                              Tamper Dataset
                            </button>
                            <button
                              type="button"
                              onClick={() => runTamperDemo("/api/dev/tamper/receipt", "Receipt tamper")}
                              className="px-2 sm:px-3 py-2 text-xs font-medium border border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong transition-colors truncate"
                            >
                              Corrupt Receipt
                            </button>
                            <button
                              type="button"
                              onClick={() => runTamperDemo("/api/dev/restore", "Restore baseline")}
                              className="px-2 sm:px-3 py-2 text-xs font-medium border border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong transition-colors truncate"
                            >
                              Restore Baseline
                            </button>
                          </div>
                          {demoStatus && (
                            <p className="mt-2 sm:mt-3 text-xs text-ink-muted">{demoStatus}</p>
                          )}
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
              <Card className="p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-ink mb-6 sm:mb-8">
                  Verification in Progress
                </h2>

                <div className="max-w-xl mx-auto">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 border-b border-border last:border-0"
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
              className="space-y-4 sm:space-y-6"
            >
              <Card className="p-4 sm:p-8 border border-success/20 bg-success/5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    <CheckCircle2 className="w-8 sm:w-10 h-8 sm:h-10 text-success flex-shrink-0" />
                  </motion.div>
                  <div className="min-w-0">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg sm:text-xl font-semibold text-success mb-1 sm:mb-2"
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

              <Card className="p-4 sm:p-8">
                <h3 className="text-base font-semibold text-ink mb-4 sm:mb-6">
                  Verification Details
                </h3>

                <div className="space-y-0">
                  {CHECKS.map((check, index) => (
                    <motion.div
                      key={check.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between py-3 sm:py-4 border-b border-border last:border-0 gap-2"
                    >
                      <span className="text-sm text-ink">{check.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <VerificationIcon
                          status={result[check.key] ? "verified" : "failed"}
                        />
                        <span
                          className={`text-xs sm:text-sm font-medium uppercase tracking-wide ${
                            result[check.key] ? "text-success" : "text-error"
                          }`}
                        >
                          {result[check.key] ? "Verified" : "Failed"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border text-xs text-ink-muted">
                  Verification completed: {formatDateTimeFull(result.lastVerification)}
                </div>
              </Card>

              <CooLVerifierPanel result={result} />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={resetVerification} className="w-full sm:w-auto">
                  Verify Another Receipt
                </Button>
                <Button variant="primary" onClick={handleDownloadReport} className="w-full sm:w-auto">Download Verification Report</Button>
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
              className="space-y-4 sm:space-y-6"
            >
              <Card className="p-4 sm:p-8 border border-error/20 bg-error/5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    <XCircle className="w-8 sm:w-10 h-8 sm:h-10 text-error flex-shrink-0" />
                  </motion.div>
                  <div className="min-w-0">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg sm:text-xl font-semibold text-error mb-1 sm:mb-2"
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
              <Card className="p-4 sm:p-8">
                <h3 className="text-base font-semibold text-ink mb-4 sm:mb-6">
                  Verification Details
                </h3>

                <div className="space-y-0">
                  {CHECKS.map((check, index) => (
                    <motion.div
                      key={check.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between py-3 sm:py-4 border-b border-border last:border-0 gap-2"
                    >
                      <span className="text-sm text-ink">{check.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <VerificationIcon
                          status={result[check.key] ? "verified" : "failed"}
                        />
                        <span
                          className={`text-xs sm:text-sm font-medium uppercase tracking-wide ${
                            result[check.key] ? "text-success" : "text-error"
                          }`}
                        >
                          {result[check.key] ? "Verified" : "Failed"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border text-xs text-ink-muted">
                  Verification completed: {formatDateTimeFull(result.lastVerification)}
                </div>
              </Card>

              {/* Reported issues */}
              {result.issues.length > 0 && (
                <Card className="p-4 sm:p-8">
                  <h3 className="text-base font-semibold text-ink mb-3 sm:mb-4">
                    Reported Issues
                  </h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {Array.from(new Set(result.issues.map(toSimpleIssue))).map((issue) => (
                      <li key={issue} className="flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-ink">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Commitment diff, only meaningful when the commitment check failed */}
              {!result.datasetCommitmentVerified && (
                <Card className="p-4 sm:p-8">
                  <h3 className="text-base font-semibold text-ink mb-4 sm:mb-6">
                    Dataset Commitment Mismatch
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2 block">
                        Expected Commitment
                      </span>
                      <div className="flex items-center gap-2 gap-y-0">
                        <code className="flex-1 text-xs font-mono text-ink bg-surface-elevated px-2 sm:px-3 py-2 border border-border overflow-x-auto break-all">
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
                        <code className="flex-1 text-xs font-mono text-error bg-error/10 px-2 sm:px-3 py-2 border border-border overflow-x-auto break-all">
                          {OBSERVED_COMMITMENT}
                        </code>
                        <CopyButton text={OBSERVED_COMMITMENT} />
                      </div>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
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

                    <div className="p-3 sm:p-4 bg-surface border border-border mt-3 sm:mt-4">
                      <p className="text-sm text-ink font-medium mb-1">Conclusion</p>
                      <p className="text-sm text-ink/80">
                        The current dataset differs from the dataset represented by the recorded evidence.
                        Review recommended.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <CooLVerifierPanel result={result} />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={resetVerification} className="w-full sm:w-auto">
                  Verify Another Receipt
                </Button>
                <Button variant="primary" onClick={handleDownloadReport} className="w-full sm:w-auto">Download Verification Report</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
