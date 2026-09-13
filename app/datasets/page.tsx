// Datasets Registry - Complete Visual Redesign V3

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
  VerificationIcon,
  CopyButton,
} from "@/components/ui";
import type { Dataset } from "@/types";
import { getDatasets } from "@/services/api";
import { formatDateTime, formatBytes, truncateHash } from "@/lib/utils";
import { Search, Plus, Upload, Filter, Download, Copy, Database } from "lucide-react";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedDesc");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDatasets();
        setDatasets(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDatasets = datasets
    .filter((ds) => {
      const matchesSearch =
        ds.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ds.experimentId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || ds.status === statusFilter;
      const matchesExperiment =
        experimentFilter === "all" || ds.experimentId === experimentFilter;

      return matchesSearch && matchesStatus && matchesExperiment;
    })
    .sort((a, b) => {
      if (sortBy === "filenameAsc")
        return a.filename.localeCompare(b.filename);
      if (sortBy === "filenameDesc")
        return b.filename.localeCompare(a.filename);
      if (sortBy === "updatedAsc")
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "updatedDesc")
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0; // default
    });

  if (loading) {
    return (
      <div>
        <PageHeader title="Datasets" />
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Datasets"
        subtitle="Research datasets with cryptographic integrity tracking and version control."
        actions={
          <>
            <Button variant="secondary" size="md">
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </Button>
            <Button variant="secondary" size="md">
              <Upload className="w-4 h-4 mr-2" />
              Import Datasets
            </Button>
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Upload Dataset
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
                placeholder="Search datasets by filename or experiment ID..."
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
                { value: "verified", label: "Verified" },
                { value: "failed", label: "Failed" },
                { value: "pending", label: "Pending Review" },
                { value: "not_checked", label: "Not Checked" },
                { value: "processing", label: "Processing" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "Experiment" },
                // Options will be populated dynamically from datasets
                ...Array.from(
                  new Set(datasets.map((ds) => ds.experimentId))
                )
                  .sort()
                  .map((expId) => ({
                    value: expId,
                    label: expId,
                  }))
              ]}
              value={experimentFilter}
              onChange={(e) => setExperimentFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Select
              options={[
                { value: "updatedDesc", label: "Sort: Newest" },
                { value: "updatedAsc", label: "Sort: Oldest" },
                { value: "filenameAsc", label: "Sort: A-Z" },
                { value: "filenameDesc", label: "Sort: Z-A" },
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
        {(searchTerm || statusFilter !== "all" || experimentFilter !== "all") && (
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
            {experimentFilter !== "all" && (
              <span className="px-2 py-1 bg-surface-elevated text-ink text-xs border border-border">
                Experiment: {experimentFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setExperimentFilter("all");
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
          Showing <span className="font-medium text-ink">{filteredDatasets.length}</span> of{" "}
          <span className="font-medium text-ink">{datasets.length}</span> datasets
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

      {/* Datasets Table */}
      {filteredDatasets.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Database className="w-10 h-10 text-ink-muted" />}
            title="No datasets found"
            description={
              <>
                <p>
                  Adjust your filters or upload a dataset to begin recording research evidence.
                </p>
                <p className="mt-2">
                  Try clearing filters or using the search function to locate specific datasets.
                </p>
              </>
            }
            action={
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Upload Dataset
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
                    className="text-left py-4 px-6 font-medium text-ink text-left"
                  >
                    Dataset
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Experiment
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Version
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Records
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Size
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-ink">
                    Integrity
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-ink">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDatasets.map((ds, index) => (
                  <motion.tr
                    key={ds.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-surface-elevated transition-all cursor-pointer group"
                    onClick={() => {
                      // Navigate to dataset detail on row click (if implemented)
                      // window.location.href = `/datasets/${ds.id}`;
                    }}
                  >
                    <td className="py-4 px-6 text-sm text-ink">
                      <div className="font-medium">{ds.filename}</div>
                      <div className="text-xs text-ink-muted mt-1">
                        {truncateHash(ds.sha256, 8)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink">
                      <Link
                        href={`/experiments/${ds.experimentId}`}
                        className="block hover:text-primary transition-colors"
                      >
                        {ds.experimentId}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-ink">
                      v{ds.version}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-ink">
                      {ds.recordCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-ink">
                      {formatBytes(ds.sizeBytes)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <VerificationIcon
                        status={ds.status}
                        className="h-4 w-4"
                      />
                      <span className="ml-2 text-xs font-medium">
                        {ds.status
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink-muted">
                      {formatDateTime(ds.updatedAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dataset Details Panel (optional expansion) */}
      {/* In a full implementation, clicking a row would expand to show details */}
    </div>
  );
}