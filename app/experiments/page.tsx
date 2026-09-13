// Experiments Registry - Complete Visual Redesign V3

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PageHeader,
  Card,
  Section,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
  StatusBadge,
  VerificationIcon,
} from "@/components/ui";
import type { Experiment } from "@/types";
import { getExperiments } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import { Search, Plus, Upload, Filter, Download, FlaskConical } from "lucide-react";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [integrityFilter, setIntegrityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedDesc");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getExperiments();
        setExperiments(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredExperiments = experiments
    .filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.researcher.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
      const matchesIntegrity =
        integrityFilter === "all" || exp.integrityStatus === integrityFilter;

      return matchesSearch && matchesStatus && matchesIntegrity;
    })
    .sort((a, b) => {
      if (sortBy === "titleAsc") return a.title.localeCompare(b.title);
      if (sortBy === "titleDesc") return b.title.localeCompare(a.title);
      if (sortBy === "updatedAsc")
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "updatedDesc")
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0; // default
    });

  if (loading) {
    return (
      <div>
        <PageHeader title="Experiments" />
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
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
        title="Experiments"
        subtitle="Research experiments with cryptographic evidence tracking and integrity verification."
        actions={
          <>
            <Button variant="secondary" size="md">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
            <Button variant="secondary" size="md">
              <Upload className="w-4 h-4 mr-2" />
              Import Experiments
            </Button>
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              New Experiment
            </Button>
          </>
        }
      />

      {/* Advanced Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6 lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <Input
                placeholder="Search experiments by ID, title, or researcher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "Status" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "under_review", label: "Under Review" },
                { value: "integrity_issue", label: "Integrity Issue" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "Integrity" },
                { value: "verified", label: "Verified" },
                { value: "failed", label: "Failed" },
                { value: "not_checked", label: "Not Checked" },
                { value: "pending", label: "Pending Review" },
              ]}
              value={integrityFilter}
              onChange={(e) => setIntegrityFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Select
              options={[
                { value: "updatedDesc", label: "Sort: Newest" },
                { value: "updatedAsc", label: "Sort: Oldest" },
                { value: "titleAsc", label: "Sort: A-Z" },
                { value: "titleDesc", label: "Sort: Z-A" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Button variant="ghost" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Active filter tags */}
        {(searchTerm || statusFilter !== "all" || integrityFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 mt-4 pt-4 border-t border-border"
          >
            <span className="text-xs text-ink-muted">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-surface-elevated text-ink text-xs border border-border">
                Search: {searchTerm}
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink text-xs border border-border">
                Status: {statusFilter}
              </span>
            )}
            {integrityFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink text-xs border border-border">
                Integrity: {integrityFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setIntegrityFilter("all");
              }}
              className="text-xs text-primary hover:text-primary-hover ml-2"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">
          Showing <span className="font-medium text-ink">{filteredExperiments.length}</span> of{" "}
          <span className="font-medium text-ink">{experiments.length}</span> experiments
        </p>
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-3 h-3 mr-1" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Experiments Table */}
      {filteredExperiments.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<FlaskConical className="w-10 h-10 text-ink-muted" />}
            title="No experiments found"
            description={
              <>
                <p>
                  Adjust your filters or create a new experiment to begin recording research evidence.
                </p>
                <p className="mt-2">
                  Try clearing filters or using the search function to locate specific experiments.
                </p>
              </>
            }
            action={
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Experiment
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th
                    className="text-left py-4 px-6 font-medium text-ink text-left w-32"
                  >
                    Experiment ID
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Title
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Principal Investigator
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Status
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Evidence Count
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Integrity
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExperiments.map((exp, index) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-surface-elevated transition-all cursor-pointer group"
                    onClick={() => {
                      // Navigate to experiment detail on row click
                      window.location.href = `/experiments/${exp.id}`;
                    }}
                  >
                    <td className="py-4 px-6 font-mono text-ink">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        {exp.id}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        {exp.title}
                      </Link>
                      <div className="text-xs text-ink-muted mt-1">
                        {exp.researchGroup}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink">{exp.researcher}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={exp.status} className="h-9 w-auto" />
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-medium">
                      {exp.evidenceCount}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <VerificationIcon status={exp.integrityStatus} animate={false} />
                        <span className="text-xs font-medium text-ink-muted">
                          {exp.integrityStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink-muted">
                      {formatDateTime(exp.updatedAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}