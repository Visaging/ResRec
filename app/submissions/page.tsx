// Submissions Registry - V3 Redesign

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  EmptyState,
  Skeleton,
  StatusBadge,
  VerificationIcon,
} from "@/components/ui";
import type { ResearchSubmission } from "@/types";
import { getSubmissions, createSubmission, getExperiments } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, formatDateTimeFull, downloadJsonFile } from "@/lib/utils";
import { Search, Plus, Download, ChevronDown, FileText, CheckCircle2, Loader2 } from "lucide-react";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [experimentsList, setExperimentsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recentDesc");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modal & Form State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    experimentId: "EXP-2026-0042",
    abstract: "",
    author: user?.name || "Dr. Investigator",
    institution: user?.institutionName || "Indian Institute of Technology Bombay",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        author: user.name || prev.author,
        institution: user.institutionName || prev.institution,
      }));
    }
  }, [user]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [subData, expData] = await Promise.all([getSubmissions(), getExperiments()]);
        setSubmissions(subData);
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

  const handleExportQueue = () => {
    downloadJsonFile(
      `resrec_submissions_export_${new Date().toISOString().slice(0, 10)}.json`,
      filteredSubmissions
    );
    showNotification(`Exported ${filteredSubmissions.length} submissions.`);
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      const created = await createSubmission({
        title: form.title,
        experimentId: form.experimentId,
        abstract: form.abstract,
        authors: [form.author],
        institution: form.institution,
      });

      setSubmissions((prev) => [created, ...prev]);
      setIsNewModalOpen(false);
      setForm({
        title: "",
        experimentId: experimentsList[0] || "EXP-2026-0042",
        abstract: "",
        author: "Dr. Sarah Chen",
        institution: "Indian Institute of Technology Bombay",
      });
      showNotification(`Submission ${created.id} registered for peer review!`);
    } catch (err: any) {
      alert(`Failed to create submission: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = submissions
    .filter((sub) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        sub.id.toLowerCase().includes(term) ||
        sub.title.toLowerCase().includes(term) ||
        sub.authors.some((a) => a.toLowerCase().includes(term));

      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "titleAsc") return a.title.localeCompare(b.title);
      if (sortBy === "titleDesc") return b.title.localeCompare(a.title);

      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      if (sortBy === "recentAsc") return aTime - bTime;
      return bTime - aTime;
    });

  if (loading) {
    return (
      <div>
        <PageHeader title="Submissions" />
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

      <PageHeader
        title="Submissions"
        subtitle="Research submissions bundled for review, with evidence coverage and integrity status."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleExportQueue}>
              <Download className="w-4 h-4 mr-2" />
              Export Queue
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <Input
                placeholder="Search by submission ID, title, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="col-span-6 lg:col-span-3">
            <Select
              options={[
                { value: "all", label: "All statuses" },
                { value: "draft", label: "Draft" },
                { value: "under_review", label: "Under Review" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="col-span-6 lg:col-span-3">
            <Select
              options={[
                { value: "recentDesc", label: "Sort: Newest" },
                { value: "recentAsc", label: "Sort: Oldest" },
                { value: "titleAsc", label: "Sort: A-Z" },
                { value: "titleDesc", label: "Sort: Z-A" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>

        {(searchTerm || statusFilter !== "all") && (
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
            {statusFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink-muted text-xs border border-border">
                Status: {statusFilter.replace(/_/g, " ")}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="text-xs text-primary hover:text-primary-hover ml-2 cursor-pointer font-medium"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </Card>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<FileText className="w-10 h-10 text-ink-muted" />}
            title="No submissions found"
            description="Adjust your search or filter settings to locate specific submissions, or create a new submission."
            action={
              <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Submission
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub, index) => {
            const isExpanded = expanded === sub.id;
            const coverage =
              sub.totalRecords > 0
                ? Math.round((sub.verifiedRecords / sub.totalRecords) * 100)
                : 0;

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-0 overflow-hidden">
                  <div
                    onClick={() => setExpanded(isExpanded ? null : sub.id)}
                    className="p-6 cursor-pointer hover:bg-surface-elevated transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {sub.id}
                          </span>
                          <StatusBadge status={sub.status} />
                          <div className="flex items-center gap-1.5 ml-1">
                            <VerificationIcon status={sub.integrityStatus} animate={false} />
                            <span className="text-xs text-ink-muted capitalize">
                              {sub.integrityStatus.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-ink truncate">
                          {sub.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                          <span>{sub.authors.join(", ")}</span>
                          <span className="text-ink-faint">•</span>
                          <span>{sub.institution}</span>
                          {sub.submittedAt && (
                            <>
                              <span className="text-ink-faint">•</span>
                              <span>Submitted {formatDateTime(sub.submittedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-ink-faint">Evidence Coverage</div>
                          <div className="text-sm font-semibold font-mono text-ink">
                            {sub.verifiedRecords} / {sub.totalRecords} ({coverage}%)
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadJsonFile(`${sub.id}_submission.json`, sub);
                            showNotification(`Downloaded bundle for ${sub.id}`);
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Bundle
                        </Button>

                        <ChevronDown
                          className={`w-4 h-4 text-ink-muted transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border bg-surface-elevated/40 px-6 py-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          <div>
                            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                              Associated Experiments
                            </span>
                            <div className="mt-2 space-y-1.5">
                              {sub.experimentIds.length === 0 ? (
                                <p className="text-xs text-ink-muted italic">
                                  No linked experiments
                                </p>
                              ) : (
                                sub.experimentIds.map((expId) => (
                                  <Link
                                    key={expId}
                                    href={`/experiments/${expId}`}
                                    className="block font-mono text-xs text-primary hover:underline"
                                  >
                                    {expId}
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                              Integrity Snapshot
                            </span>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-ink-muted">Status:</span>
                                <span className="font-medium capitalize text-ink">
                                  {sub.integrityStatus.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-ink-muted">Verified records:</span>
                                <span className="font-mono text-ink">{sub.verifiedRecords}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-ink-muted">Total records:</span>
                                <span className="font-mono text-ink">{sub.totalRecords}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                              Submission Details
                            </span>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-ink-muted">Institution:</span>
                                <span className="text-ink">{sub.institution}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-ink-muted">Authors:</span>
                                <span className="text-ink">{sub.authors.join("; ")}</span>
                              </div>
                              {sub.submittedAt && (
                                <div className="flex justify-between">
                                  <span className="text-ink-muted">Timestamp:</span>
                                  <span className="text-ink">
                                    {formatDateTimeFull(sub.submittedAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Submission Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Research Submission"
        description="Bundle experiment evidence and datasets for peer review or journal publication."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Manuscript / Paper Title *
            </label>
            <Input
              required
              placeholder="e.g., Verification of High-Pressure Hydride Superconductivity"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Primary Experiment Ledger *
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Lead Author *
              </label>
              <Input
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Institution
              </label>
              <Input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Abstract & Review Notes
            </label>
            <Textarea
              rows={3}
              placeholder="Summary of research outcomes, validation metrics, and cryptographic receipts..."
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Submission...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Submission
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
