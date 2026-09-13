// Enhanced Experiment Detail with animated tabs and visualizations - V3 Redesign

"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Section,
  StatusBadge,
  Button,
  VerificationIcon,
  Skeleton,
  Tabs,
  CopyButton,
} from "@/components/ui";
import type {
  Experiment,
  Measurement,
  Dataset,
  EvidenceRecord,
  IntegrityCheck,
} from "@/types";
import {
  getExperiment,
  getMeasurements,
  getDatasets,
  getEvidenceRecords,
  getIntegrityCheck,
} from "@/services/api";
import { formatDateTime, formatDateTimeFull, formatBytes } from "@/lib/utils";
import { ChevronLeft, CheckCircle2, AlertCircle, ChevronDown, Plus, Upload, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Tab = "overview" | "measurements" | "datasets" | "evidence" | "provenance" | "analysis";

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([]);
  const [integrityCheck, setIntegrityCheck] = useState<IntegrityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeasurement, setExpandedMeasurement] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [expData, measData, dsData, evData, intData] = await Promise.all([
          getExperiment(id),
          getMeasurements(id),
          getDatasets(id),
          getEvidenceRecords(id),
          getIntegrityCheck(id),
        ]);
        setExperiment(expData);
        setMeasurements(measData);
        setDatasets(dsData);
        setEvidenceRecords(evData);
        setIntegrityCheck(intData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <Card className="p-8">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div>
        <PageHeader title="Experiment not found" />
        <Card className="p-8">
          <p className="text-sm text-ink-muted">
            The requested experiment could not be found. Check the experiment ID and try again.
          </p>
        </Card>
      </div>
    );
  }

  const tabItems = [
    { id: "overview", label: "Overview" },
    { id: "measurements", label: "Measurements", count: measurements.length },
    { id: "datasets", label: "Datasets", count: datasets.length },
    { id: "evidence", label: "Evidence", count: evidenceRecords.length },
    { id: "provenance", label: "Provenance" },
    { id: "analysis", label: "Analysis" },
  ];

  // Chart data from measurements
  const chartData = measurements
    .filter((m) => !m.correctionOf)
    .map((m) => ({
      trial: `Trial ${m.trial}`,
      temperature: m.value,
      timestamp: new Date(m.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return (
    <div>
      {/* Navigation */}
      <Link
        href="/experiments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Experiments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-semibold text-ink">{experiment.id}</h1>
              <StatusBadge status={experiment.status} />
            </div>
            <p className="text-lg text-ink">{experiment.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="grid grid-cols-6 gap-6 text-sm mt-6 p-4 bg-surface border border-border">
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Principal Investigator
            </span>
            <p className="text-ink font-medium mt-1">{experiment.researcher}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Research Group
            </span>
            <p className="text-ink font-medium mt-1">{experiment.researchGroup}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Instrument
            </span>
            <p className="text-ink font-medium mt-1">
              {experiment.instrument || "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Protocol
            </span>
            <p className="text-ink font-medium mt-1">
              {experiment.protocol || "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Created
            </span>
            <p className="text-ink font-medium mt-1">
              {formatDateTime(experiment.createdAt)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
              Last Updated
            </span>
            <p className="text-ink font-medium mt-1">
              {formatDateTime(experiment.updatedAt)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id as Tab)} />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                {/* Research Objective */}
                <Section title="Research Objective">
                  <Card className="p-6">
                    <p className="text-sm text-ink-muted leading-relaxed">
                      {experiment.objective}
                    </p>
                  </Card>
                </Section>

                {/* Experimental Setup */}
                <Section title="Experimental Setup">
                  <Card className="p-6">
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      {[
                        { label: "Instrument", value: experiment.instrument },
                        { label: "Sample", value: experiment.sample },
                        { label: "Environment", value: experiment.environment },
                        { label: "Protocol", value: experiment.protocol },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                            {item.label}
                          </span>
                          <p className="text-ink mt-1">
                            {item.value || "Not specified"}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </Section>

                {/* Temperature Chart */}
                {chartData.length > 0 && (
                  <Section title="Measurement Trend">
                    <Card className="p-6">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--color-border) 20%, transparent)" />
                            <XAxis
                              dataKey="trial"
                              tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                              label={{
                                value: "Temperature (°C)",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: 12, fill: "var(--color-ink-muted)" },
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: 0,
                                fontSize: 12,
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="temperature"
                              stroke="var(--color-primary)"
                              strokeWidth={2}
                              dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
                              activeDot={{ r: 6 }}
                              name="Temperature (°C)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Section>
                )}
              </div>

              {/* Sidebar - Integrity Status */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-ink mb-4">
                    Integrity Status
                  </h3>
                  {integrityCheck?.verified ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium text-success">
                          All checks passed
                        </span>
                      </div>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: "Evidence records", status: "verified" as const },
                          { label: "Dataset commitment", status: "verified" as const },
                          { label: "Record sequence", status: "verified" as const },
                          { label: "Signatures", status: "verified" as const },
                        ].map((check, i) => (
                          <motion.div
                            key={check.label}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <VerificationIcon status={check.status} />
                            <span className="text-ink">{check.label}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border text-xs text-ink-muted">
                        Last verified: {formatDateTimeFull(integrityCheck.lastVerification)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-error/20 bg-error/5 p-4">
                        <AlertCircle className="w-5 h-5 text-error" />
                        <span className="text-sm font-medium text-error">
                          Issues detected
                        </span>
                      </div>
                      {integrityCheck?.issues.map((issue, idx) => (
                        <p key={idx} className="text-sm text-error">
                          {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Quick Stats */}
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-ink mb-4">
                    Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-faint">Measurements</span>
                      <span className="font-medium text-ink">{measurements.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-faint">Datasets</span>
                      <span className="font-medium text-ink">{datasets.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-faint">Evidence Records</span>
                      <span className="font-medium text-ink">{evidenceRecords.length}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Measurements Tab */}
          {activeTab === "measurements" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-ink-muted">
                  {measurements.length} measurement records
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button variant="secondary" size="sm">
                    Record Correction
                  </Button>
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Measurement
                  </Button>
                </div>
              </div>

              <Card className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-surface">
                      <tr>
                        <th className="w-8 py-4 px-6" />
                        <th className="text-left py-4 px-6 font-medium text-ink">Trial</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Timestamp</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Value</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Unit</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Instrument</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Evidence</th>
                        <th className="text-left py-4 px-6 font-medium text-ink">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {measurements.map((m, index) => (
                        <Fragment key={m.id}>
                          <motion.tr
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-surface-elevated transition-all cursor-pointer group"
                            onClick={() =>
                              setExpandedMeasurement(
                                expandedMeasurement === m.id ? null : m.id
                              )
                            }
                          >
                            <td className="py-4 px-6">
                              <motion.div
                                animate={{
                                  rotate: expandedMeasurement === m.id ? 180 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-ink-muted" />
                              </motion.div>
                            </td>
                            <td className="py-4 px-6 font-mono text-ink">
                              <span className="font-medium">{m.trial.toString().padStart(2, "0")}</span>
                            </td>
                            <td className="py-4 px-6 text-sm text-ink-muted">
                              {new Date(m.timestamp).toLocaleTimeString("en-IN")}
                            </td>
                            <td className="py-4 px-6 text-sm font-medium text-ink">
                              {m.value}
                              {m.correctionOf && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium border border-warning/25 bg-warning/10 text-warning">
                                  corrected
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-sm text-ink">{m.unit}</td>
                            <td className="py-4 px-6 text-sm text-ink font-mono">{m.instrument}</td>
                            <td className="py-4 px-6 text-sm text-ink">
                              {m.evidenceId ? (
                                <Link
                                  href={`/evidence/${m.evidenceId}`}
                                  className="block hover:text-primary transition-colors"
                                >
                                  {m.evidenceId}
                                </Link>
                              ) : (
                                <span className="text-ink-faint">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <VerificationIcon
                                  status={m.status}
                                  animate={false}
                                />
                                <span className="text-xs font-medium">
                                  {m.status
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                                </span>
                              </div>
                            </td>
                          </motion.tr>

                          {/* Expanded row */}
                          <AnimatePresence>
                            {expandedMeasurement === m.id && (
                              <motion.tr
                                key={`${m.id}-expanded`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <td colSpan={8} className="bg-surface px-6">
                                  <div className="py-4 grid grid-cols-4 gap-6 text-sm border-l-2 border-primary pl-4">
                                    <div>
                                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                        Raw Value
                                      </span>
                                      <p className="text-sm font-medium text-ink mt-1">
                                        {m.value} {m.unit}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                        Instrument
                                      </span>
                                      <p className="text-sm font-mono text-ink mt-1">
                                        {m.instrument}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                        Timestamp
                                      </span>
                                      <p className="text-sm font-medium text-ink mt-1">
                                        {formatDateTimeFull(m.timestamp)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                        Verification
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <VerificationIcon status={m.status} animate={false} />
                                        <span className="text-xs font-medium">
                                          {m.status
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                      </div>
                                    </div>
                                    {m.correctionOf && (
                                      <div className="col-span-4 mt-4 pt-3 border-t border-border">
                                        <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                          Correction
                                        </span>
                                        <p className="text-sm text-ink mt-1">
                                          Reason: {m.correctionReason}
                                        </p>
                                        <p className="text-xs text-ink-muted mt-1">
                                          Correction of: {m.correctionOf}
                                        </p>
                                      </div>
                                    )}
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
              </Card>
            </div>
          )}

          {/* Datasets Tab */}
          {activeTab === "datasets" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-ink-muted">{datasets.length} datasets</p>
                <Button variant="primary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Dataset
                </Button>
              </div>
              <div className="space-y-4">
                {datasets.map((ds, index) => (
                  <motion.div
                    key={ds.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6" hover>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-base font-medium text-ink mb-1">
                            {ds.filename}
                          </h3>
                          <p className="text-sm text-ink-muted">
                            Version {ds.version} • {ds.recordCount} records •{" "}
                            {formatBytes(ds.sizeBytes)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <VerificationIcon status={ds.status} />
                          <span className="text-sm font-medium text-ink">
                            {ds.status
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                              SHA-256
                            </span>
                            <CopyButton text={ds.sha256} />
                          </div>
                          <code className="block text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                            {ds.sha256}
                          </code>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                              CooL Commitment
                            </span>
                            <CopyButton text={ds.coolCommitment} />
                          </div>
                          <code className="block text-xs font-mono text-ink bg-surface-elevated px-3 py-2 border border-border overflow-x-auto">
                            {ds.coolCommitment}
                          </code>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === "evidence" && (
            <div>
              <p className="text-sm text-ink-muted mb-6">
                {evidenceRecords.length} evidence records
              </p>
              <Card className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-surface">
                      <tr>
                        <th className="w-8 py-4 px-6" />
                        <th className="text-left py-4 px-6 font-medium text-ink">
                          Record ID
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-ink">
                          Event
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-ink">
                          Sequence
                        </th>
                        <th className="text-center py-4 px-6 font-medium text-ink">
                          Timestamp
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-ink">
                          Verification
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {evidenceRecords.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-surface-elevated transition-all cursor-pointer group"
                        >
                          <td className="py-4 px-6">
                            <Link
                              href={`/evidence/${record.id}`}
                              className="block font-mono text-xs text-ink hover:text-primary transition-colors"
                            >
                              {record.id}
                            </Link>
                          </td>
                          <td className="py-4 px-6 text-sm text-ink">{record.eventType}</td>
                          <td className="py-4 px-6 text-sm font-mono text-ink">{record.sequence}</td>
                          <td className="py-4 px-6 text-sm text-ink-muted">
                            {formatDateTime(record.issuedAt)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <VerificationIcon
                                status={record.signatureVerification}
                                animate={false}
                              />
                              <span className="text-xs font-medium">
                                {record.signatureVerification
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Provenance Tab */}
          {activeTab === "provenance" && (
            <div>
              <Card className="p-6">
                <p className="text-sm text-ink-muted mb-6">
                  View the full provenance graph for this experiment on the{" "}
                  <Link href="/provenance" className="text-primary hover:text-primary-hover">
                    Provenance
                  </Link>{" "}
                  page.
                </p>
              </Card>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === "analysis" && (
            <div>
              <Card className="p-6">
                <p className="text-sm text-ink-muted">
                  No analysis records have been created for this experiment.
                </p>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}