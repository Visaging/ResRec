// Evidence Explorer with expandable records and progressive disclosure - V3 Redesign

"use client";

import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Button,
  Select,
  VerificationIcon,
  Skeleton,
  CopyButton,
  EmptyState,
} from "@/components/ui";
import type { EvidenceRecord } from "@/types";
import { getEvidenceRecords } from "@/services/api";
import { formatDateTime, formatDateTimeFull, downloadJsonFile } from "@/lib/utils";
import { ChevronDown, Search, Filter, Download, Code2, ShieldCheck } from "lucide-react";

export default function EvidencePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getEvidenceRecords();
        setRecords(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredRecords =
    eventFilter === "all"
      ? records
      : records.filter((r) => r.eventType === eventFilter);

  if (loading) {
    return (
      <div>
        <PageHeader title="Evidence Registry" />
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Evidence Registry"
        subtitle="Complete record of all cryptographic evidence events across experiments."
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              downloadJsonFile(
                `resrec_evidence_${new Date().toISOString().slice(0, 10)}.json`,
                filteredRecords
              )
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: "all", label: "All Events" },
                { value: "measurement.recorded", label: "Measurement Recorded" },
                { value: "measurement.corrected", label: "Measurement Corrected" },
                { value: "dataset.finalized", label: "Dataset Finalized" },
              ]}
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">{filteredRecords.length}</span> evidence records
          </p>
        </div>
      </Card>

      {/* Evidence Table with Expandable Rows */}
      <Card className="p-0 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="w-8 py-4 px-4 sm:px-6" />
                <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                  Record ID
                </th>
                <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                  Event
                </th>
                <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                  Experiment
                </th>
                <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                  Sequence
                </th>
                <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                  Timestamp
                </th>
                <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((record, index) => (
                <Fragment key={record.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-surface-elevated transition-all cursor-pointer group"
                    onClick={() =>
                      setExpandedRecord(expandedRecord === record.id ? null : record.id)
                    }
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <motion.div
                        animate={{ rotate: expandedRecord === record.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-ink-muted" />
                      </motion.div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs sm:text-sm text-ink">
                      <span className="font-medium truncate">{record.id}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-ink">{record.eventType}</td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-ink">
                      <Link
                        href={`/experiments/${record.experimentId}`}
                        className="block hover:text-primary transition-colors truncate"
                      >
                        {record.experimentId}
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm font-medium text-ink text-center">{record.sequence}</td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-ink-muted text-center">
                      {formatDateTime(record.issuedAt)}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <VerificationIcon
                          status={record.signatureVerification}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <span className="text-xs font-medium hidden sm:inline">
                          {record.signatureVerification
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded Evidence Detail */}
                  <AnimatePresence>
                    {expandedRecord === record.id && (
                      <motion.tr
                        key={`${record.id}-expanded`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <td colSpan={7} className="bg-surface px-4 sm:px-6">
                          <div className="py-4 sm:py-6 pl-0 sm:pl-8 space-y-4 sm:space-y-6">
                            {/* Record Info */}
                            <div>
                              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                                Record
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                                <div>
                                  <span className="text-xs text-ink-faint">Record ID</span>
                                  <p className="font-mono text-xs text-ink mt-0.5 break-all">{record.id}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-ink-faint">Execution ID</span>
                                  <p className="font-mono text-xs text-ink mt-0.5 break-all">
                                    {record.executionId}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-ink-faint">Sequence</span>
                                  <p className="text-ink font-medium mt-0.5">{record.sequence}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-ink-faint">Issued At</span>
                                  <p className="text-ink mt-0.5 text-xs">
                                    {formatDateTimeFull(record.issuedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Commitments */}
                            <div>
                              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                                Commitments
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-ink-faint">Metadata Commitment</span>
                                    <CopyButton text={record.metadataCommitment} />
                                  </div>
                                  <code className="block text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                                    {record.metadataCommitment}
                                  </code>
                                </div>
                                {record.inputCommitment && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-ink-faint">Input Commitment</span>
                                      <CopyButton text={record.inputCommitment} />
                                    </div>
                                    <code className="block text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                                      {record.inputCommitment}
                                    </code>
                                  </div>
                                )}
                                {record.outputCommitment && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-ink-faint">Output Commitment</span>
                                      <CopyButton text={record.outputCommitment} />
                                    </div>
                                    <code className="block text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                                      {record.outputCommitment}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Software identity */}
                            {record.softwareIdentity && (
                              <div>
                                <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                                  Software Identity
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                  <div>
                                    <span className="text-xs text-ink-faint">Identity</span>
                                    <p className="font-mono text-xs text-ink mt-0.5 break-all">
                                      {record.softwareIdentity}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-ink-faint">Version</span>
                                    <p className="font-mono text-xs text-ink mt-0.5">
                                      {record.softwareVersion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Cryptographic Verification */}
                            <div>
                              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                                Cryptographic Verification
                              </h4>
                              <div className="space-y-2">
                                {[
                                  { label: "Binding", status: record.bindingVerification },
                                  { label: "Signature", status: record.signatureVerification },
                                  { label: "Transparency", status: record.transparencyVerification },
                                  { label: "Witnesses", status: record.witnessVerification },
                                  { label: "Attestation", status: record.attestationVerification },
                                ].map((check) => (
                                  <div
                                    key={check.label}
                                    className="flex items-center justify-between py-2"
                                  >
                                    <span className="text-sm text-ink">{check.label}</span>
                                    <div className="flex items-center gap-2">
                                      <VerificationIcon status={check.status} animate={false} />
                                      <span className="text-xs font-medium">
                                        {check.status
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Raw CooL Cryptographic Receipt */}
                            <div className="pt-2 border-t border-border">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                                <div className="flex items-center gap-2">
                                  <Code2 className="w-4 h-4 text-primary" />
                                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                                    Raw CooL Receipt (JSON)
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                  <CopyButton
                                    text={
                                      record.evidenceJson ||
                                      JSON.stringify(record, null, 2)
                                    }
                                  />
                                  <Link
                                    href={`/evidence/${record.id}`}
                                    className="text-xs text-primary hover:underline font-medium"
                                  >
                                    Full Page →
                                  </Link>
                                </div>
                              </div>
                              <pre className="bg-surface-elevated text-ink font-mono text-xs p-3 sm:p-4 rounded border border-border overflow-x-auto max-h-48 sm:max-h-64 whitespace-pre">
                                {(() => {
                                  try {
                                    if (record.evidenceJson) {
                                      return JSON.stringify(
                                        JSON.parse(record.evidenceJson),
                                        null,
                                        2
                                      );
                                    }
                                  } catch {
                                    // fallback
                                  }
                                  return JSON.stringify(record, null, 2);
                                })()}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="sm:hidden space-y-3 p-4">
          {filteredRecords.length === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center">
              No evidence records.
            </p>
          ) : (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-border bg-surface cursor-pointer"
                onClick={() =>
                  setExpandedRecord(expandedRecord === record.id ? null : record.id)
                }
              >
                {/* Header Row */}
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-ink-muted truncate">
                      {record.id}
                    </p>
                    <p className="text-sm font-medium text-ink mt-1">
                      {record.eventType}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedRecord === record.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-ink-muted" />
                  </motion.div>
                </div>

                {/* Summary Row */}
                <div className="px-3 pb-3 grid grid-cols-2 gap-3 text-xs border-t border-border pt-3">
                  <div>
                    <p className="text-ink-faint">Experiment</p>
                    <Link
                      href={`/experiments/${record.experimentId}`}
                      className="text-ink font-mono text-xs hover:text-primary truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {record.experimentId}
                    </Link>
                  </div>
                  <div>
                    <p className="text-ink-faint">Sequence</p>
                    <p className="text-ink font-mono font-medium">
                      #{record.sequence}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-ink-faint mb-1">Verification</p>
                    <div className="flex items-center gap-2">
                      <VerificationIcon status={record.signatureVerification} animate={false} />
                      <span className="text-xs font-medium capitalize">
                        {record.signatureVerification.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRecord === record.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border p-3 space-y-3"
                    >
                      {/* Core Info */}
                      <div>
                        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                          Details
                        </p>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-ink-faint">Execution ID</span>
                            <p className="font-mono text-ink truncate">{record.executionId}</p>
                          </div>
                          <div>
                            <span className="text-ink-faint">Issued</span>
                            <p className="text-ink">{formatDateTimeFull(record.issuedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Commitments */}
                      <div>
                        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                          Commitments
                        </p>
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-ink-faint">Metadata</span>
                              <CopyButton text={record.metadataCommitment} />
                            </div>
                            <code className="block text-xs font-mono text-ink bg-surface-elevated px-2 py-1.5 border border-border overflow-x-auto">
                              {record.metadataCommitment}
                            </code>
                          </div>
                          {record.inputCommitment && (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-ink-faint">Input</span>
                                <CopyButton text={record.inputCommitment} />
                              </div>
                              <code className="block text-xs font-mono text-ink bg-surface-elevated px-2 py-1.5 border border-border overflow-x-auto">
                                {record.inputCommitment}
                              </code>
                            </div>
                          )}
                          {record.outputCommitment && (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-ink-faint">Output</span>
                                <CopyButton text={record.outputCommitment} />
                              </div>
                              <code className="block text-xs font-mono text-ink bg-surface-elevated px-2 py-1.5 border border-border overflow-x-auto">
                                {record.outputCommitment}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verification Checks */}
                      <div>
                        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                          Verification
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {[
                            { label: "Binding", status: record.bindingVerification },
                            { label: "Signature", status: record.signatureVerification },
                            { label: "Transparency", status: record.transparencyVerification },
                            { label: "Witnesses", status: record.witnessVerification },
                            { label: "Attestation", status: record.attestationVerification },
                          ].map((check) => (
                            <div
                              key={check.label}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="text-ink-muted">{check.label}</span>
                              <div className="flex items-center gap-1">
                                <VerificationIcon status={check.status} animate={false} />
                                <span className="font-medium capitalize">
                                  {check.status.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* View Full Page Link */}
                      <Link
                        href={`/evidence/${record.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Code2 className="w-3 h-3" />
                        View Full Receipt
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Empty state handling */}
      {filteredRecords.length === 0 && !loading && (
        <Card className="p-8">
          <EmptyState
            icon={<Filter className="w-10 h-10 text-ink-muted" />}
            title="No evidence records found"
            description={
              <>
                <p>
                  Adjust your filters or generate evidence records to begin exploring cryptographic evidence.
                </p>
                <p className="mt-2">
                  Try clearing filters or running experiments to generate evidence records.
                </p>
              </>
            }
            action={
              <Button variant="primary">
                <Search className="w-4 h-4 mr-2" />
                Run Experiment
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
}