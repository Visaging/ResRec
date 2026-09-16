// Reports Registry - V3 Redesign

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  Skeleton,
  CopyButton,
} from "@/components/ui";
import type { Report, ReportStatus } from "@/types";
import { getReports, createReport, getExperiments } from "@/services/api";
import { formatDateTime, formatBytes, downloadJsonFile } from "@/lib/utils";
import {
  Search,
  Plus,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const STATUS_META: Record<
  ReportStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  ready: {
    label: "Ready",
    className: "text-success",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  generating: {
    label: "Generating",
    className: "text-warning",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  failed: {
    label: "Failed",
    className: "text-error",
    icon: <XCircle className="w-4 h-4" />,
  },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [experimentsList, setExperimentsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recentDesc");

  // Modal & Form State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    experimentId: "EXP-2026-0042",
    type: "verification",
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [repData, expData] = await Promise.all([getReports(), getExperiments()]);
        setReports(repData);
        setExperimentsList(expData.map((e) => e.id));
        if (expData.length > 0) {
          setForm((prev) => ({ ...prev, experimentId: expData[0].id }));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportAll = () => {
    downloadJsonFile(
      `resrec_reports_export_${new Date().toISOString().slice(0, 10)}.json`,
      filteredReports
    );
    showNotification(`Exported ${filteredReports.length} audit reports.`);
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.experimentId) return;

    setGenerating(true);
    try {
      const created = await createReport({
        experimentId: form.experimentId,
        title: form.title || undefined,
        type: form.type,
      });

      setReports((prev) => [created, ...prev]);
      setIsGenerateModalOpen(false);
      setForm({
        title: "",
        experimentId: experimentsList[0] || "EXP-2026-0042",
        type: "verification",
      });
      showNotification(`Audit report ${created.id} generated and verified!`);
    } catch (err: any) {
      alert(`Failed to generate report: ${err?.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  const experimentOptions = Array.from(
    new Set(reports.map((rep) => rep.experimentId).filter((id): id is string => Boolean(id)))
  ).sort();

  const filteredReports = reports
    .filter((rep) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        rep.id.toLowerCase().includes(term) ||
        rep.title.toLowerCase().includes(term) ||
        rep.summary.toLowerCase().includes(term) ||
        rep.generatedBy.toLowerCase().includes(term) ||
        (rep.experimentId?.toLowerCase().includes(term) ?? false);

      const matchesType = typeFilter === "all" || rep.type === typeFilter;
      const matchesExperiment =
        experimentFilter === "all" || rep.experimentId === experimentFilter;

      return matchesSearch && matchesType && matchesExperiment;
    })
    .sort((a, b) => {
      if (sortBy === "typeAsc") return a.type.localeCompare(b.type);
      if (sortBy === "typeDesc") return b.type.localeCompare(a.type);
      const aTime = new Date(a.generatedAt).getTime();
      const bTime = new Date(b.generatedAt).getTime();
      if (sortBy === "recentAsc") return aTime - bTime;
      return bTime - aTime;
    });

  const readyCount = reports.filter((rep) => rep.status === "ready").length;
  const failedCount = reports.filter((rep) => rep.status === "failed").length;

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports" />
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed left-4 right-4 top-6 z-50 bg-primary text-white px-4 py-3 shadow-xl border border-primary/30 flex items-center gap-2 text-sm sm:left-auto sm:right-6"
        >
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{notification}</span>
        </motion.div>
      )}

      <PageHeader
        title="Reports"
        subtitle="Verification, integrity, and audit reports generated from recorded evidence."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <Input
                placeholder="Search by report ID, title, experiment, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="col-span-4 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "All types" },
                { value: "verification", label: "Verification" },
                { value: "integrity", label: "Integrity" },
                { value: "audit", label: "Audit" },
                { value: "summary", label: "Summary" },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="col-span-4 lg:col-span-3">
            <Select
              options={[
                { value: "all", label: "All experiments" },
                ...experimentOptions.map((expId) => ({ value: expId, label: expId })),
              ]}
              value={experimentFilter}
              onChange={(e) => setExperimentFilter(e.target.value)}
            />
          </div>
          <div className="col-span-4 lg:col-span-2">
            <Select
              options={[
                { value: "recentDesc", label: "Sort: Newest" },
                { value: "recentAsc", label: "Sort: Oldest" },
                { value: "typeAsc", label: "Sort: Type A-Z" },
                { value: "typeDesc", label: "Sort: Type Z-A" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>

        {(searchTerm || typeFilter !== "all" || experimentFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-4 pt-4 border-t border-border"
          >
            <span className="text-xs text-ink-faint">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-surface-elevated text-ink-muted text-xs border border-border">
                Search: {searchTerm}
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink-muted text-xs border border-border">
                Type: {typeFilter}
              </span>
            )}
            {experimentFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink-muted text-xs border border-border font-mono">
                {experimentFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setExperimentFilter("all");
              }}
              className="text-xs text-primary hover:text-primary-hover ml-2 cursor-pointer font-medium"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">
          Showing <span className="font-medium text-ink">{filteredReports.length}</span> of{" "}
          <span className="font-medium text-ink">{reports.length}</span> reports
        </p>
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            {readyCount} ready
          </span>
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-error" />
              {failedCount} failed
            </span>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No reports found"
            description="No reports match the current filters. Clear the filters, or generate a report from a completed experiment."
            action={
              <Button
                variant="primary"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-elevated">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Report
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Experiment
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Generated By
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Generated
                  </th>
                  <th className="text-right py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Size
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="w-12 py-3 px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((rep, index) => {
                  const status = STATUS_META[rep.status];

                  return (
                    <motion.tr
                      key={rep.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.2) }}
                      className="hover:bg-surface-elevated transition-colors align-top"
                    >
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs text-ink-muted mb-1">{rep.id}</div>
                        <div className="font-medium text-ink">{rep.title}</div>
                        <p className="text-xs text-ink-muted mt-1 max-w-md leading-relaxed">
                          {rep.summary}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium border border-border bg-surface-elevated text-ink-muted uppercase tracking-wide">
                          {rep.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {rep.experimentId ? (
                          <Link
                            href={`/experiments/${rep.experimentId}`}
                            className="font-mono text-xs text-primary hover:text-primary-hover hover:underline"
                          >
                            {rep.experimentId}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-ink">{rep.generatedBy}</td>
                      <td className="py-4 px-6 text-ink-muted">
                        {formatDateTime(rep.generatedAt)}
                      </td>
                      <td className="py-4 px-6 text-right tabular-nums-sm text-ink">
                        {rep.status === "generating" ? "—" : formatBytes(rep.sizeBytes)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-medium ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <CopyButton text={rep.id} />
                          {rep.status === "ready" && (
                            <button
                              onClick={() => {
                                downloadJsonFile(`${rep.id}_report.json`, rep);
                                showNotification(`Downloaded report ${rep.id}`);
                              }}
                              className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                              title="Download report"
                              aria-label={`Download ${rep.title}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Audit / Verification Report"
        description="Runs deep cryptographic verification against all evidence receipts and produces an immutable report."
        maxWidth="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Experiment *
            </label>
            <Select
              options={
                experimentsList.length > 0
                  ? experimentsList.map((id) => ({ value: id, label: id }))
                  : [{ value: "EXP-2026-0042", label: "EXP-2026-0042" }]
              }
              value={form.experimentId}
              onChange={(e) => setForm({ ...form, experimentId: e.target.value })}
              className="w-full font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Report Title (Optional)
            </label>
            <Input
              placeholder="e.g., Battery Thermal Cycling - Full Cryptographic Audit"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Report Type *
            </label>
            <Select
              options={[
                { value: "verification", label: "Verification Report" },
                { value: "integrity", label: "Integrity Audit" },
                { value: "audit", label: "Full Lineage Audit" },
                { value: "summary", label: "Executive Summary" },
              ]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Audit...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
