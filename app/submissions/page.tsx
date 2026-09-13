// Submissions Registry - V3 Redesign

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
  EmptyState,
  Skeleton,
  StatusBadge,
  VerificationIcon,
} from "@/components/ui";
import type { ResearchSubmission } from "@/types";
import { getSubmissions } from "@/services/api";
import { formatDateTime, formatDateTimeFull } from "@/lib/utils";
import { Search, Plus, Download, ChevronDown, FileText } from "lucide-react";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recentDesc");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSubmissions();
        setSubmissions(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

      // Drafts have no submittedAt; sort them last on newest, first on oldest.
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
      <PageHeader
        title="Submissions"
        subtitle="Research submissions bundled for review, with evidence coverage and integrity status."
        actions={
          <>
            <Button variant="secondary" size="md">
              <Download className="w-4 h-4 mr-2" />
              Export Queue
            </Button>
            <Button variant="primary" size="md">
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
              className="text-xs text-primary hover:text-primary-hover ml-2"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">
          Showing <span className="font-medium text-ink">{filteredSubmissions.length}</span> of{" "}
          <span className="font-medium text-ink">{submissions.length}</span> submissions
        </p>
      </div>

      {filteredSubmissions.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No submissions found"
            description="No submissions match the current filters. Clear the filters to see the full review queue."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
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
                  <th className="w-10 py-3 px-6" />
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Submission
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Lead Author
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Evidence Coverage
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Integrity
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-ink-muted text-xs uppercase tracking-wide">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((sub, index) => {
                  const coverage =
                    sub.totalRecords > 0
                      ? Math.round((sub.verifiedRecords / sub.totalRecords) * 100)
                      : 0;
                  const isOpen = expanded === sub.id;

                  return (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.2) }}
                      className="hover:bg-surface-elevated transition-colors cursor-pointer align-top"
                      onClick={() => setExpanded(isOpen ? null : sub.id)}
                    >
                      <td className="py-4 px-6">
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-ink-faint" />
                        </motion.div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs text-ink-muted mb-1">{sub.id}</div>
                        <div className="font-medium text-ink">{sub.title}</div>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-6">
                              <div>
                                <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                  Authors
                                </span>
                                <p className="text-sm text-ink mt-1">
                                  {sub.authors.join(", ")}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                  Institution
                                </span>
                                <p className="text-sm text-ink mt-1">{sub.institution}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                  Experiments
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {sub.experimentIds.map((expId) => (
                                    <Link
                                      key={expId}
                                      href={`/experiments/${expId}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-xs text-primary hover:text-primary-hover hover:underline"
                                    >
                                      {expId}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                                  Submitted
                                </span>
                                <p className="text-sm text-ink mt-1">
                                  {sub.submittedAt
                                    ? formatDateTimeFull(sub.submittedAt)
                                    : "Not yet submitted"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-ink">{sub.authors[0]}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-3">
                          <span className="tabular-nums-sm text-ink">
                            {sub.verifiedRecords} / {sub.totalRecords}
                          </span>
                          <div
                            className="w-16 h-1.5 bg-surface-sunken overflow-hidden"
                            role="img"
                            aria-label={`${coverage} percent of records verified`}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${coverage}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={
                                coverage === 100
                                  ? "h-full bg-success"
                                  : coverage > 0
                                  ? "h-full bg-warning"
                                  : "h-full bg-border-strong"
                              }
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <VerificationIcon status={sub.integrityStatus} animate={false} />
                          <span className="text-xs font-medium text-ink-muted">
                            {sub.integrityStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-ink-muted">
                        {sub.submittedAt ? formatDateTime(sub.submittedAt) : "—"}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
