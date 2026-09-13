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
  Input,
  Select,
  Textarea,
  Modal,
  EmptyState,
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
  ProvenanceGraphData,
} from "@/types";
import {
  getExperiment,
  getMeasurements,
  getDatasets,
  getEvidenceRecords,
  getIntegrityCheck,
  getProvenanceGraph,
  createMeasurement,
  createDataset,
  recordCorrection,
} from "@/services/api";
import {
  formatDateTime,
  formatDateTimeFull,
  formatBytes,
  downloadJsonFile,
  downloadCsvFile,
} from "@/lib/utils";
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Plus,
  Upload,
  Download,
  Database,
  GitBranch,
  ShieldCheck,
  Loader2,
  Code2,
  Eye,
  FileJson,
} from "lucide-react";
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
  const [provenanceGraph, setProvenanceGraph] = useState<ProvenanceGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeasurement, setExpandedMeasurement] = useState<string | null>(null);

  // Modals & form state
  const [isAddMeasModalOpen, setIsAddMeasModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
  const [isUploadDatasetOpen, setIsUploadDatasetOpen] = useState(false);
  const [selectedEvidenceRecord, setSelectedEvidenceRecord] = useState<EvidenceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Add Measurement Form
  const [measForm, setMeasForm] = useState({
    trial: 1,
    value: "",
    unit: "K",
    instrument: "",
  });

  // Dataset Upload Form
  const [datasetForm, setDatasetForm] = useState({
    name: "",
    filename: "",
    recordCount: 48,
    content: "",
  });

  // Correction Form
  const [corrForm, setCorrForm] = useState({
    originalMeasurementId: "",
    correctedValue: "",
    reason: "Sensor Calibration Drift",
    note: "Verified against standard reference resistance specimen.",
    operator: "Dr. Sarah Chen",
  });

  // CSV Import Form
  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [expData, measData, dsData, evData, intData, provData] = await Promise.all([
          getExperiment(id),
          getMeasurements(id),
          getDatasets(id),
          getEvidenceRecords(id),
          getIntegrityCheck(id),
          getProvenanceGraph(id),
        ]);
        setExperiment(expData);
        setMeasurements(measData);
        setDatasets(dsData);
        setEvidenceRecords(evData);
        setIntegrityCheck(intData);
        setProvenanceGraph(provData);

        if (measData.length > 0) {
          setMeasForm((prev) => ({
            ...prev,
            trial: Math.max(...measData.map((m) => m.trial)) + 1,
            unit: measData[0]?.unit || "K",
            instrument: measData[0]?.instrument || expData?.instrument || "Analytical Instrument",
          }));
          setCorrForm((prev) => ({
            ...prev,
            originalMeasurementId: measData[0]?.id || "",
          }));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleExportBundle = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      experiment,
      measurements,
      datasets,
      evidenceRecords,
      integrityCheck,
      provenanceGraph,
    };
    downloadJsonFile(`${id}_research_bundle.json`, bundle);
    showNotification(`Exported complete research bundle for ${id}`);
  };

  const handleExportDatasets = () => {
    if (datasets.length === 0) {
      alert("No datasets available to export.");
      return;
    }
    downloadJsonFile(`${id}_datasets.json`, datasets);
    showNotification(`Exported ${datasets.length} dataset record(s).`);
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measForm.value) return;

    setSubmitting(true);
    try {
      const newM = await createMeasurement({
        experimentId: id,
        trial: Number(measForm.trial),
        value: parseFloat(measForm.value),
        unit: measForm.unit,
        instrument: measForm.instrument || experiment?.instrument || "Analytical Instrument",
      });

      setMeasurements((prev) => [...prev, newM]);
      setIsAddMeasModalOpen(false);
      setMeasForm((prev) => ({
        ...prev,
        trial: prev.trial + 1,
        value: "",
      }));
      showNotification(`Trial #${newM.trial} recorded and sealed with CooL receipt!`);
    } catch (err: any) {
      alert(`Failed to add measurement: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrForm.originalMeasurementId || !corrForm.correctedValue) return;

    setSubmitting(true);
    try {
      const corrected = await recordCorrection({
        originalMeasurementId: corrForm.originalMeasurementId,
        correctedValue: parseFloat(corrForm.correctedValue),
        reason: corrForm.reason,
        note: corrForm.note,
        operator: corrForm.operator,
      });

      setMeasurements((prev) => [...prev, corrected]);
      setIsCorrectionModalOpen(false);
      setCorrForm((prev) => ({
        ...prev,
        correctedValue: "",
      }));
      showNotification(
        `Immutable correction ${corrected.id} recorded and sealed with CooL receipt!`
      );
    } catch (err: any) {
      alert(`Failed to record correction: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCsv = async () => {
    setCsvError(null);
    if (!csvText.trim()) {
      setCsvError("Please provide CSV data to import.");
      return;
    }

    setSubmitting(true);
    try {
      const lines = csvText.trim().split("\n");
      const createdList: Measurement[] = [];
      let startTrial = measurements.length > 0 ? Math.max(...measurements.map((m) => m.trial)) + 1 : 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith("trial") || line.toLowerCase().startsWith("value")) {
          continue;
        }

        const parts = line.split(",").map((p) => p.trim());
        const val = parseFloat(parts[1] || parts[0]);
        if (isNaN(val)) continue;

        const trialNum = parseInt(parts[0]) || startTrial++;
        const unit = parts[2] || measForm.unit || "K";
        const instrument = parts[3] || measForm.instrument || experiment?.instrument || "Instrument";

        const newM = await createMeasurement({
          experimentId: id,
          trial: trialNum,
          value: val,
          unit,
          instrument,
        });
        createdList.push(newM);
      }

      setMeasurements((prev) => [...prev, ...createdList]);
      setIsImportCsvModalOpen(false);
      setCsvText("");
      showNotification(`Successfully imported and sealed ${createdList.length} measurement trial(s)!`);
    } catch (err: any) {
      setCsvError(`CSV Import error: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetForm.filename) return;

    setSubmitting(true);
    try {
      const created = await createDataset(id, {
        name: datasetForm.name || datasetForm.filename,
        filename: datasetForm.filename,
        recordCount: Number(datasetForm.recordCount) || 1,
        content: datasetForm.content || undefined,
      });

      setDatasets((prev) => [created, ...prev]);
      setIsUploadDatasetOpen(false);
      setDatasetForm({
        name: "",
        filename: "",
        recordCount: 48,
        content: "",
      });
      showNotification(`Dataset ${created.filename} registered and sealed with CooL receipt!`);
    } catch (err: any) {
      alert(`Failed to register dataset: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDatasetFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lineCount = text ? text.trim().split("\n").length - 1 : 0;
      setDatasetForm((prev) => ({
        ...prev,
        filename: file.name,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
        recordCount: lineCount > 0 ? lineCount : 1,
        content: text,
      }));
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Experiment Details" />
        <Card className="p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div>
        <PageHeader title="Experiment Not Found" />
        <Card className="p-8 text-center">
          <p className="text-ink-muted">The requested experiment could not be found.</p>
          <Link href="/experiments" className="mt-4 inline-block">
            <Button variant="primary">Return to Experiments</Button>
          </Link>
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

  // Prepare chart data
  const chartData = measurements
    .slice()
    .sort((a, b) => a.trial - b.trial)
    .map((m) => ({
      trial: m.trial,
      value: m.value,
      timestamp: new Date(m.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-6 right-6 z-50 bg-primary text-white px-4 py-3 shadow-xl border border-primary/30 flex items-center gap-2 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Navigation */}
      <Link
        href="/experiments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Experiments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-semibold text-ink">{experiment.id}</h1>
              <StatusBadge status={experiment.status} />
            </div>
            <p className="text-lg text-ink font-medium">{experiment.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportBundle}>
              <Download className="w-4 h-4 mr-2" />
              Export Bundle
            </Button>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm mt-6 p-4 bg-surface border border-border">
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
              {experiment.protocol || "Standard Research Protocol"}
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
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={(tid) => setActiveTab(tid as Tab)} />
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Objective */}
                  <Card className="p-6">
                    <h3 className="text-base font-semibold text-ink mb-3">
                      Research Objective & Methodology
                    </h3>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      {experiment.objective || "Empirical scientific investigation and validation."}
                    </p>
                    {experiment.sample && (
                      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                        <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                          Sample Specimen:
                        </span>
                        <span className="text-xs font-mono text-ink bg-surface-elevated px-2 py-1 border border-border">
                          {experiment.sample}
                        </span>
                      </div>
                    )}
                  </Card>

                  {/* Measurements Chart */}
                  {measurements.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-ink">
                          Measurement Telemetry Stream
                        </h3>
                        <span className="text-xs font-medium text-ink-muted">
                          {measurements.length} points recorded
                        </span>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="trial"
                              stroke="#6b7280"
                              fontSize={12}
                              tickLine={false}
                              label={{ value: "Trial #", position: "insideBottomRight", offset: -5 }}
                            />
                            <YAxis
                              stroke="#6b7280"
                              fontSize={12}
                              tickLine={false}
                              domain={["auto", "auto"]}
                              label={{
                                value: measurements[0]?.unit || "Value",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--surface)",
                                borderColor: "var(--border)",
                                borderRadius: "0px",
                                fontSize: "12px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name={measurements[0]?.unit ? `Value (${measurements[0].unit})` : "Value"}
                              stroke="#000000"
                              strokeWidth={2}
                              dot={{ r: 3, fill: "#000000" }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                  {/* Integrity Card */}
                  <Card className="p-6">
                    <h3 className="text-base font-semibold text-ink mb-4">
                      Cryptographic Verification Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-xs text-ink-muted">Overall Integrity</span>
                        <div className="flex items-center gap-1.5">
                          <VerificationIcon status={integrityCheck?.verified ? "verified" : "failed"} />
                          <span className="text-xs font-semibold uppercase">
                            {integrityCheck?.verified ? "verified" : "failed"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-xs text-ink-muted">Signature Domain</span>
                        <div className="flex items-center gap-1.5">
                          <VerificationIcon status={integrityCheck?.signatureVerified ? "verified" : "failed"} />
                          <span className="text-xs font-semibold uppercase">
                            {integrityCheck?.signatureVerified ? "verified" : "failed"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-ink-muted">Binding Domain</span>
                        <div className="flex items-center gap-1.5">
                          <VerificationIcon status={integrityCheck?.bindingVerified ? "verified" : "failed"} />
                          <span className="text-xs font-semibold uppercase">
                            {integrityCheck?.bindingVerified ? "verified" : "failed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Summary Counts */}
                  <Card className="p-6">
                    <h3 className="text-base font-semibold text-ink mb-4">
                      Ledger Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Measurements</span>
                        <span className="font-semibold text-ink">{measurements.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Datasets</span>
                        <span className="font-semibold text-ink">{datasets.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Evidence Records</span>
                        <span className="font-semibold text-ink">{evidenceRecords.length}</span>
                      </div>
                    </div>
                  </Card>
                </div>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCsvError(null);
                      setIsImportCsvModalOpen(true);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                  >
                    Record Correction
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddMeasModalOpen(true)}
                  >
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
                            transition={{ delay: index * 0.02 }}
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
                                  className="block hover:text-primary transition-colors font-mono text-xs"
                                >
                                  {m.evidenceId}
                                </Link>
                              ) : (
                                <span className="text-ink-faint">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <VerificationIcon status={m.status} animate={false} />
                                <span className="text-xs font-medium capitalize">
                                  {m.status.replace(/_/g, " ")}
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
                                          {m.status.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    </div>
                                    {m.evidenceId && (
                                      <div className="col-span-4 mt-2 pt-3 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-ink-faint">Sealed Receipt ID:</span>
                                          <code className="text-xs font-mono text-ink bg-surface-elevated px-2 py-0.5 border border-border">
                                            {m.evidenceId}
                                          </code>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            const rec = evidenceRecords.find(
                                              (r) =>
                                                r.id === m.evidenceId ||
                                                (r as any).recordId === m.evidenceId ||
                                                (r as any).publicId === m.evidenceId
                                            );
                                            return (
                                              <>
                                                {rec && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setSelectedEvidenceRecord(rec)}
                                                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-ink bg-surface border border-border hover:bg-surface-elevated transition-colors"
                                                  >
                                                    <Code2 className="w-3.5 h-3.5 mr-1 text-primary" />
                                                    View Receipt JSON
                                                  </button>
                                                )}
                                                <Link
                                                  href={`/evidence/${m.evidenceId}`}
                                                  className="text-xs text-primary hover:underline font-medium"
                                                >
                                                  Open Receipt Page →
                                                </Link>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    {m.correctionOf && (
                                      <div className="col-span-4 mt-2 pt-3 border-t border-border">
                                        <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                          Correction Trace
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
                <p className="text-sm text-ink-muted">
                  {datasets.length} dataset{datasets.length === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportDatasets}
                    disabled={datasets.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Dataset
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsUploadDatasetOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Dataset
                  </Button>
                </div>
              </div>

              {datasets.length === 0 ? (
                <Card className="p-8">
                  <EmptyState
                    icon={<Database className="w-10 h-10 text-ink-muted" />}
                    title="No datasets registered yet"
                    description="Upload raw sensor data, processed CSV logs, or tabular outputs. Each dataset version is cryptographically committed with an Intel TDX hardware-attested CooL receipt."
                    action={
                      <Button
                        variant="primary"
                        onClick={() => setIsUploadDatasetOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Dataset
                      </Button>
                    }
                  />
                </Card>
              ) : (
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
                            <span className="text-sm font-medium text-ink capitalize">
                              {ds.status.replace(/_/g, " ")}
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
              )}
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === "evidence" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    Cryptographic Evidence Records ({evidenceRecords.length})
                  </h3>
                  <p className="text-sm text-ink-muted">
                    Immutable CooL receipts sealed with Intel TDX runtime attestation and ML-DSA-65 post-quantum signatures.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={evidenceRecords.length === 0}
                    onClick={() =>
                      downloadJsonFile(
                        `${experiment?.publicId || id}_evidence_receipts.json`,
                        evidenceRecords.map((r) => {
                          try {
                            return r.evidenceJson ? JSON.parse(r.evidenceJson) : r;
                          } catch {
                            return r;
                          }
                        })
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Export All Receipts (.json)
                  </Button>
                </div>
              </div>

              {evidenceRecords.length === 0 ? (
                <Card className="p-8">
                  <EmptyState
                    icon={<ShieldCheck className="w-10 h-10 text-ink-muted" />}
                    title="No evidence records generated yet"
                    description="Record a measurement or upload a dataset to generate verifiable CooL receipts."
                  />
                </Card>
              ) : (
                <Card className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-surface">
                        <tr>
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
                          <th className="text-right py-4 px-6 font-medium text-ink">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {evidenceRecords.map((record, index) => (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-surface-elevated transition-all"
                          >
                            <td className="py-4 px-6">
                              <Link
                                href={`/evidence/${record.id}`}
                                className="font-mono text-xs text-ink hover:text-primary transition-colors font-medium"
                              >
                                {record.id}
                              </Link>
                            </td>
                            <td className="py-4 px-6 text-sm text-ink">{record.eventType}</td>
                            <td className="py-4 px-6 text-sm font-mono text-ink">{record.sequence}</td>
                            <td className="py-4 px-6 text-sm text-ink-muted text-center">
                              {formatDateTime(record.issuedAt)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <VerificationIcon
                                  status={record.signatureVerification}
                                  animate={false}
                                />
                                <span className="text-xs font-medium capitalize">
                                  {record.signatureVerification.replace(/_/g, " ")}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvidenceRecord(record)}
                                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-ink bg-surface border border-border hover:bg-surface-elevated transition-colors"
                                  title="Inspect and copy raw CooL receipt JSON"
                                >
                                  <Code2 className="w-3.5 h-3.5 mr-1 text-primary" />
                                  Receipt JSON
                                </button>
                                <CopyButton
                                  text={
                                    record.evidenceJson ||
                                    JSON.stringify(record, null, 2)
                                  }
                                />
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Provenance Tab */}
          {activeTab === "provenance" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      Research Provenance & Lineage Pipeline
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Cryptographically tracked stages from initial raw measurements to published results and peer review submissions.
                    </p>
                  </div>
                  <Link
                    href="/provenance"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors self-start sm:self-auto"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    Open Full Graph Canvas
                  </Link>
                </div>

                {/* Provenance Stage Nodes */}
                <div className="mt-6 space-y-4">
                  {provenanceGraph && provenanceGraph.nodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {provenanceGraph.nodes.map((node) => {
                        const isVerified = node.verified && node.status !== "failed";
                        return (
                          <div
                            key={node.id}
                            className="bg-surface-elevated border border-border p-3.5 flex flex-col justify-between hover:border-border-strong transition-colors"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted bg-surface px-2 py-0.5 border border-border">
                                  {node.type}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                    isVerified ? "text-success" : "text-error"
                                  }`}
                                >
                                  {isVerified ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  )}
                                  {isVerified ? "Verified" : "Issue"}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-ink truncate mb-1">
                                {node.label}
                              </p>

                              <p className="text-[11px] text-ink-faint font-mono mb-2">
                                {formatDateTime(node.timestamp)}
                              </p>

                              <div className="space-y-1 text-[11px] text-ink-muted bg-surface p-2 border border-border mb-3 max-h-24 overflow-y-auto">
                                {Object.entries(node.metadata).map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-1">
                                    <span className="capitalize text-ink-faint">{k}:</span>
                                    <span className="font-mono text-ink truncate">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {node.recordId && (
                              <Link
                                href={`/evidence/${node.recordId}`}
                                className="inline-flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-primary hover:text-primary-hover hover:underline"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                View Evidence ({node.recordId})
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-ink-muted text-sm">
                      No provenance nodes recorded for this experiment yet.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === "analysis" && (
            <div>
              <Card className="p-6">
                <p className="text-sm text-ink-muted">
                  No analysis records have been created for this experiment yet.
                </p>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Measurement Modal */}
      <Modal
        isOpen={isAddMeasModalOpen}
        onClose={() => setIsAddMeasModalOpen(false)}
        title="Add Experimental Measurement"
        description="Records a new measurement trial sealed with real-time CooL cryptographic receipt."
        maxWidth="md"
      >
        <form onSubmit={handleAddMeasurement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Trial Number *
              </label>
              <Input
                type="number"
                required
                value={measForm.trial}
                onChange={(e) => setMeasForm({ ...measForm, trial: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Unit *
              </label>
              <Input
                required
                placeholder="e.g., K, V, mA, %"
                value={measForm.unit}
                onChange={(e) => setMeasForm({ ...measForm, unit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Measured Value *
            </label>
            <Input
              type="number"
              step="any"
              required
              placeholder="e.g., 250.4"
              value={measForm.value}
              onChange={(e) => setMeasForm({ ...measForm, value: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Instrument Identifier
            </label>
            <Input
              placeholder="e.g., SQUID Magnetometer #1"
              value={measForm.instrument}
              onChange={(e) => setMeasForm({ ...measForm, instrument: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddMeasModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sealing Receipt...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Record & Seal
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Correction Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Record Immutable Measurement Correction"
        description="Creates an auditable correction linked to the parent trial without modifying historical receipts."
        maxWidth="lg"
      >
        <form onSubmit={handleRecordCorrection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Measurement to Correct *
            </label>
            <Select
              options={measurements.map((m) => ({
                value: m.id,
                label: `Trial #${m.trial} (Value: ${m.value} ${m.unit}) - ${m.id}`,
              }))}
              value={corrForm.originalMeasurementId}
              onChange={(e) => setCorrForm({ ...corrForm, originalMeasurementId: e.target.value })}
              className="w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Corrected Value *
            </label>
            <Input
              type="number"
              step="any"
              required
              placeholder="e.g., 250.8"
              value={corrForm.correctedValue}
              onChange={(e) => setCorrForm({ ...corrForm, correctedValue: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Correction Reason *
            </label>
            <Select
              options={[
                { value: "Sensor Calibration Drift", label: "Sensor Calibration Drift" },
                { value: "Transcription Error", label: "Transcription Error" },
                { value: "Ambient Temperature Fluctuation", label: "Ambient Temperature Fluctuation" },
                { value: "Instrument Baseline Adjustment", label: "Instrument Baseline Adjustment" },
                { value: "Artifact Re-evaluation", label: "Artifact Re-evaluation" },
              ]}
              value={corrForm.reason}
              onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Supervisor / Auditor Notes
            </label>
            <Textarea
              rows={3}
              value={corrForm.note}
              onChange={(e) => setCorrForm({ ...corrForm, note: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sealing Correction...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Seal Correction Record
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={isImportCsvModalOpen}
        onClose={() => setIsImportCsvModalOpen(false)}
        title="Import Measurements from CSV"
        description="Paste or upload CSV data (trial, value, unit, instrument). Each trial is cryptographically sealed."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvFileUpload}
              className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-surface-elevated file:text-ink hover:file:bg-border border border-border p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Or Paste CSV Lines
            </label>
            <Textarea
              rows={8}
              placeholder={"trial,value,unit,instrument\n1,250.2,K,SQUID-1\n2,250.5,K,SQUID-1\n3,250.8,K,SQUID-1"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {csvError && (
            <div className="p-3 bg-error/10 border border-error/30 text-error text-xs">
              {csvError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsImportCsvModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={submitting || !csvText.trim()}
              onClick={handleImportCsv}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing & Sealing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import & Seal Measurements
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Dataset Modal */}
      <Modal
        isOpen={isUploadDatasetOpen}
        onClose={() => setIsUploadDatasetOpen(false)}
        title="Upload & Seal Research Dataset"
        description="Register and cryptographically commit a new research dataset. A post-quantum CooL receipt will be generated and signed."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadDataset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Data File (CSV, JSON, DAT, TXT)
            </label>
            <input
              type="file"
              accept=".csv,.json,.dat,.txt,.tsv"
              onChange={handleDatasetFileSelected}
              className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-surface-elevated file:text-ink hover:file:bg-border border border-border p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Dataset Name *
              </label>
              <Input
                required
                placeholder="e.g., Raw Sensor Stream"
                value={datasetForm.name}
                onChange={(e) =>
                  setDatasetForm({ ...datasetForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Filename *
              </label>
              <Input
                required
                placeholder="e.g., raw_stream_v1.csv"
                value={datasetForm.filename}
                onChange={(e) =>
                  setDatasetForm({ ...datasetForm, filename: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Record / Data Point Count
            </label>
            <Input
              type="number"
              min="1"
              value={datasetForm.recordCount}
              onChange={(e) =>
                setDatasetForm({
                  ...datasetForm,
                  recordCount: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Dataset Content (or Raw Preview)
            </label>
            <Textarea
              rows={5}
              placeholder={"sample,trial,value\n1,1,100.0\n1,2,100.2"}
              value={datasetForm.content}
              onChange={(e) =>
                setDatasetForm({ ...datasetForm, content: e.target.value })
              }
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadDatasetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !datasetForm.filename}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sealing Dataset Receipt...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Register & Seal Dataset
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inspect CooL Cryptographic Receipt Modal */}
      <Modal
        isOpen={!!selectedEvidenceRecord}
        onClose={() => setSelectedEvidenceRecord(null)}
        title={`CooL Cryptographic Receipt: ${selectedEvidenceRecord?.id || ""}`}
        description="Immutable cryptographic execution receipt sealed with Intel TDX runtime attestation and dual post-quantum ML-DSA-65 signatures."
        maxWidth="2xl"
      >
        {selectedEvidenceRecord && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <VerificationIcon status={selectedEvidenceRecord.signatureVerification} />
                <span className="text-xs font-semibold uppercase text-ink">
                  {selectedEvidenceRecord.eventType} (Sequence #{selectedEvidenceRecord.sequence})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton
                  text={
                    selectedEvidenceRecord.evidenceJson ||
                    JSON.stringify(selectedEvidenceRecord, null, 2)
                  }
                />
                <Link
                  href={`/evidence/${selectedEvidenceRecord.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium ml-2"
                >
                  Full Record Page →
                </Link>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Raw CooL Cryptographic Receipt (JSON)
                </span>
                <span className="text-xs text-ink-faint font-mono">
                  cool.receipt.v2
                </span>
              </div>
              <pre className="bg-surface-elevated text-ink font-mono text-xs p-4 rounded border border-border overflow-x-auto max-h-96 whitespace-pre">
                {(() => {
                  try {
                    if (selectedEvidenceRecord.evidenceJson) {
                      return JSON.stringify(
                        JSON.parse(selectedEvidenceRecord.evidenceJson),
                        null,
                        2
                      );
                    }
                  } catch {
                    // fallback
                  }
                  return JSON.stringify(selectedEvidenceRecord, null, 2);
                })()}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-xs text-ink-muted">
                Issued {formatDateTimeFull(selectedEvidenceRecord.issuedAt)}
              </span>
              <div className="flex gap-2">
                <Link
                  href="/verification"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Verify in Verification Center
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedEvidenceRecord(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
