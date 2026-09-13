// Evidence Record Detail Page - CooL cryptographic receipt inspection

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PageHeader,
  Card,
  Section,
  StatusBadge,
  VerificationIcon,
  CopyButton,
  Button,
  Skeleton,
} from "@/components/ui";
import type { EvidenceRecord, Experiment } from "@/types";
import { getEvidenceRecord, getExperiment } from "@/services/api";
import { formatDateTimeFull } from "@/lib/utils";
import {
  ChevronLeft,
  ShieldCheck,
  FlaskConical,
  GitBranch,
  KeyRound,
  FileCheck,
  Fingerprint,
  Layers,
  CheckCircle2,
  XCircle,
  Code2,
} from "lucide-react";

export default function EvidenceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const evData = await getEvidenceRecord(id);
        setRecord(evData);
        if (evData?.experimentId) {
          const expData = await getExperiment(evData.experimentId);
          setExperiment(expData);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card className="p-8">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div>
        <PageHeader title="Evidence Record Not Found" />
        <Card className="p-8">
          <p className="text-sm text-ink-muted mb-4">
            The cryptographic evidence receipt with ID <span className="font-mono">{id}</span> could not be located in the registry.
          </p>
          <Link
            href="/evidence"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Return to Evidence Registry
          </Link>
        </Card>
      </div>
    );
  }

  const verifications = [
    { label: "Execution Binding Verification", status: record.bindingVerification },
    { label: "Cryptographic Signature", status: record.signatureVerification },
    { label: "Transparency Log Inclusion", status: record.transparencyVerification },
    { label: "Witness Network Attestation", status: record.witnessVerification },
    { label: "Hardware Enclave Attestation", status: record.attestationVerification },
  ];

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/evidence"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Evidence Registry
        </Link>
      </div>

      {/* Header */}
      <PageHeader
        title={record.id}
        subtitle="Cryptographic receipt verifying execution authenticity, software integrity, and immutable state commitments."
        badge={<StatusBadge status={record.bindingVerification} />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/provenance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-border text-ink hover:bg-surface-elevated transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" /> View in Provenance Graph
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Metadata */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink mb-4 pb-2 border-b border-border">
              Record Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  Event Type
                </span>
                <p className="text-sm font-semibold text-ink mt-0.5 font-mono">
                  {record.eventType}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  Sequence Number
                </span>
                <p className="text-sm font-semibold text-ink mt-0.5 font-mono">
                  #{record.sequence}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  Issued Timestamp
                </span>
                <p className="text-xs font-mono text-ink mt-0.5">
                  {formatDateTimeFull(record.issuedAt)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  Execution ID
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-mono text-ink">{record.executionId}</span>
                  <CopyButton text={record.executionId} />
                </div>
              </div>
            </div>
          </Card>

          {/* Cryptographic Commitments */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink mb-4 pb-2 border-b border-border flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Cryptographic Multihash Commitments
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-1">
                  Metadata Commitment
                </span>
                <div className="p-2.5 bg-surface-elevated border border-border flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink break-all">
                    {record.metadataCommitment}
                  </span>
                  <CopyButton text={record.metadataCommitment} />
                </div>
              </div>

              {record.inputCommitment && (
                <div>
                  <span className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-1">
                    Input Commitment
                  </span>
                  <div className="p-2.5 bg-surface-elevated border border-border flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ink break-all">
                      {record.inputCommitment}
                    </span>
                    <CopyButton text={record.inputCommitment} />
                  </div>
                </div>
              )}

              {record.outputCommitment && (
                <div>
                  <span className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-1">
                    Output Commitment
                  </span>
                  <div className="p-2.5 bg-surface-elevated border border-border flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ink break-all">
                      {record.outputCommitment}
                    </span>
                    <CopyButton text={record.outputCommitment} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Software Environment Identity */}
          {(record.softwareIdentity || record.softwareVersion) && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-ink mb-4 pb-2 border-b border-border flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" />
                Software & Toolchain Attestation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-ink-muted uppercase tracking-wide">
                    Software Identity Digest
                  </span>
                  <p className="font-mono text-ink mt-1 break-all">
                    {record.softwareIdentity || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-ink-muted uppercase tracking-wide">
                    Toolchain / Version
                  </span>
                  <p className="font-mono text-ink mt-1">
                    {record.softwareVersion || "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Raw CooL Evidence Receipt (JSON) */}
          {record.evidenceJson && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  Raw CooL Cryptographic Receipt (JSON)
                </h3>
                <CopyButton
                  text={
                    typeof record.evidenceJson === "string"
                      ? (() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(record.evidenceJson),
                              null,
                              2
                            );
                          } catch {
                            return record.evidenceJson;
                          }
                        })()
                      : JSON.stringify(record.evidenceJson, null, 2)
                  }
                />
              </div>
              <p className="text-xs text-ink-muted mb-3">
                This JSON contains the complete cryptographic envelope, including ML-DSA-65 / Ed25519 signature signatures, Intel TDX simulated enclave measurement, Merkel transparency audit path, and event commitments.
              </p>
              <pre className="p-4 bg-surface-elevated border border-border text-xs font-mono text-ink overflow-x-auto max-h-96 leading-relaxed">
                {typeof record.evidenceJson === "string"
                  ? (() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(record.evidenceJson),
                          null,
                          2
                        );
                      } catch {
                        return record.evidenceJson;
                      }
                    })()
                  : JSON.stringify(record.evidenceJson, null, 2)}
              </pre>
            </Card>
          )}
        </div>

        {/* Verification Sidebar */}
        <div className="space-y-6">
          {/* Verification Verdicts */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink mb-4 pb-2 border-b border-border flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              CooL Verification Checks
            </h3>
            <div className="space-y-3">
              {verifications.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-surface-elevated border border-border text-xs"
                >
                  <span className="text-ink font-medium">{v.label}</span>
                  <VerificationIcon status={v.status} />
                </div>
              ))}
            </div>
          </Card>

          {/* Linked Experiment */}
          {experiment && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-ink mb-3 pb-2 border-b border-border flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                Associated Experiment
              </h3>
              <p className="text-xs font-mono text-ink-muted">{experiment.id}</p>
              <p className="text-sm font-semibold text-ink mt-1">{experiment.title}</p>
              <p className="text-xs text-ink-muted mt-1">{experiment.researcher}</p>

              <Link
                href={`/experiments/${experiment.id}`}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-surface hover:bg-surface-elevated border border-border text-ink transition-colors"
              >
                View Experiment Details
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
