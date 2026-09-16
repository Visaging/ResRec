// Datasets Registry - Complete Visual Redesign V3

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
  Textarea,
  Modal,
  EmptyState,
  Skeleton,
  VerificationIcon,
  CopyButton,
} from "@/components/ui";
import type { Dataset } from "@/types";
import { getDatasets, createDataset, getExperiments } from "@/services/api";
import { formatDateTime, formatBytes, truncateHash, downloadJsonFile } from "@/lib/utils";
import { Search, Plus, Upload, Filter, Download, Database, CheckCircle2, Loader2 } from "lucide-react";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [experimentsList, setExperimentsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedDesc");

  // Modals & state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Upload Dataset Form
  const [uploadForm, setUploadForm] = useState({
    filename: "thermal_cycling_processed.csv",
    experimentId: "EXP-2026-0042",
    recordCount: 48,
    fileSize: 15420,
    fileHash: "sha256:4f5a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
  });

  // Import JSON Form
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [dsData, expData] = await Promise.all([getDatasets(), getExperiments()]);
        setDatasets(dsData);
        setExperimentsList(expData.map((e) => e.id));
        if (expData.length > 0) {
          setUploadForm((prev) => ({ ...prev, experimentId: expData[0].id }));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCatalog = () => {
    downloadJsonFile(
      `resrec_datasets_catalog_${new Date().toISOString().slice(0, 10)}.json`,
      filteredDatasets
    );
    showNotification(`Exported ${filteredDatasets.length} datasets catalog as JSON.`);
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.filename || !uploadForm.experimentId) return;

    setSubmitting(true);
    try {
      const created = await createDataset(uploadForm.experimentId, {
        filename: uploadForm.filename,
        recordCount: Number(uploadForm.recordCount),
        fileSize: Number(uploadForm.fileSize),
        fileHash: uploadForm.fileHash,
      });

      setDatasets((prev) => [created, ...prev]);
      setIsUploadModalOpen(false);
      showNotification(`Dataset ${created.filename} registered and sealed with CooL receipt!`);
    } catch (err: any) {
      alert(`Failed to register dataset: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportJson = async () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError("Please provide JSON dataset records to import.");
      return;
    }

    setSubmitting(true);
    try {
      let parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) parsed = [parsed];

      const createdList: Dataset[] = [];
      for (const item of parsed) {
        const expId = item.experimentId || uploadForm.experimentId || "EXP-2026-0042";
        const created = await createDataset(expId, {
          filename: item.filename || "dataset.csv",
          recordCount: item.recordCount || 100,
          fileSize: item.sizeBytes || item.fileSize || 1024,
          fileHash: item.sha256 || item.fileHash || "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        });
        createdList.push(created);
      }

      setDatasets((prev) => [...createdList, ...prev]);
      setIsImportModalOpen(false);
      setImportJsonText("");
      showNotification(`Successfully imported and sealed ${createdList.length} dataset(s)!`);
    } catch (err: any) {
      setImportError(`Invalid JSON or API error: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadForm((prev) => ({
      ...prev,
      filename: file.name,
      fileSize: file.size,
    }));
  };

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
        title="Datasets"
        subtitle="Research datasets with cryptographic integrity tracking and version control."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleExportCatalog}>
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setImportError(null);
                setIsImportModalOpen(true);
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Datasets
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Dataset
            </Button>
          </>
        }
      />

      {/* Advanced Filters */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 md:grid md:grid-cols-3 lg:grid lg:grid-cols-12 lg:gap-4">
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
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
          <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "All Statuses" },
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
          <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "All Experiments" },
                ...Array.from(new Set(datasets.map((ds) => ds.experimentId)))
                  .sort()
                  .map((expId) => ({
                    value: expId,
                    label: expId,
                  })),
              ]}
              value={experimentFilter}
              onChange={(e) => setExperimentFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <Select
              options={[
                { value: "updatedDesc", label: "Sort: Newest First" },
                { value: "updatedAsc", label: "Sort: Oldest First" },
                { value: "filenameAsc", label: "Sort: Filename (A-Z)" },
                { value: "filenameDesc", label: "Sort: Filename (Z-A)" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Active filter tags */}
        {(searchTerm || statusFilter !== "all" || experimentFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border"
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
              className="text-xs text-primary hover:text-primary-hover ml-2 cursor-pointer font-medium"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </Card>

      {/* Results summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
        <p className="text-xs sm:text-sm text-ink-muted">
          Showing <span className="font-medium text-ink">{filteredDatasets.length}</span> of{" "}
          <span className="font-medium text-ink">{datasets.length}</span> datasets
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-ink-muted">
          <Button variant="outline" size="sm" onClick={handleExportCatalog}>
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Upload Dataset
          </Button>
        </div>
      </div>

      {/* Datasets Table & Mobile Cards */}
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
              <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Dataset
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="p-0 hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                      Dataset
                    </th>
                    <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                      Experiment
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                      Version
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                      Records
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                      Size
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-ink">
                      Integrity
                    </th>
                    <th className="text-left py-4 px-4 sm:px-6 font-medium text-ink">
                      Updated
                    </th>
                    <th className="text-right py-4 px-4 sm:px-6 font-medium text-ink">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDatasets.map((ds, index) => (
                    <motion.tr
                      key={ds.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-surface-elevated transition-all cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink">
                        <div className="font-medium group-hover:text-primary transition-colors">
                          {ds.filename}
                        </div>
                        <div className="text-[10px] sm:text-xs text-ink-muted mt-1 font-mono">
                          {truncateHash(ds.sha256, 12)}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink">
                        <Link
                          href={`/experiments/${ds.experimentId}`}
                          className="block hover:text-primary transition-colors font-mono font-medium"
                        >
                          {ds.experimentId}
                        </Link>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium text-ink text-center">
                        v{ds.version}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium text-ink text-center">
                        {ds.recordCount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium text-ink text-center">
                        {formatBytes(ds.sizeBytes)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <VerificationIcon status={ds.status} />
                          <span className="text-[10px] sm:text-xs font-medium capitalize">
                            {ds.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink-muted">
                        {formatDateTime(ds.updatedAt)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            downloadJsonFile(`${ds.filename}.json`, ds);
                            showNotification(`Downloaded metadata for ${ds.filename}`);
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredDatasets.map((ds, index) => (
              <motion.div
                key={ds.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="p-4 space-y-3">
                  {/* Header: Filename + Experiment */}
                  <div className="pb-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors mb-1">
                      {ds.filename}
                    </h3>
                    <Link
                      href={`/experiments/${ds.experimentId}`}
                      className="text-xs font-mono text-primary hover:text-primary-hover transition-colors"
                    >
                      {ds.experimentId}
                    </Link>
                    <p className="text-[10px] text-ink-muted font-mono mt-1">
                      Hash: {truncateHash(ds.sha256, 16)}
                    </p>
                  </div>

                  {/* Status & Version */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VerificationIcon status={ds.status} />
                      <span className="text-xs font-medium capitalize text-ink">
                        {ds.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-ink-muted bg-surface px-2 py-1">
                      v{ds.version}
                    </span>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-surface-elevated p-2">
                      <p className="text-ink-muted font-medium uppercase tracking-wide text-[10px] mb-1">
                        Records
                      </p>
                      <p className="font-semibold text-ink">
                        {ds.recordCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-elevated p-2">
                      <p className="text-ink-muted font-medium uppercase tracking-wide text-[10px] mb-1">
                        Size
                      </p>
                      <p className="font-semibold text-ink">
                        {formatBytes(ds.sizeBytes)}
                      </p>
                    </div>
                  </div>

                  {/* Updated & Actions */}
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-ink-muted">
                      Updated: {formatDateTime(ds.updatedAt)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        downloadJsonFile(`${ds.filename}.json`, ds);
                        showNotification(`Downloaded metadata for ${ds.filename}`);
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Upload Dataset Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload & Register Dataset"
        description="Creates a versioned dataset entry sealed with post-quantum CooL commitments."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadDataset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Associated Experiment *
            </label>
            <Select
              options={
                experimentsList.length > 0
                  ? experimentsList.map((id) => ({ value: id, label: id }))
                  : [{ value: "EXP-2026-0042", label: "EXP-2026-0042" }]
              }
              value={uploadForm.experimentId}
              onChange={(e) => setUploadForm({ ...uploadForm, experimentId: e.target.value })}
              className="w-full font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Dataset File
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-surface-elevated file:text-ink hover:file:bg-border border border-border p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Filename *
            </label>
            <Input
              required
              value={uploadForm.filename}
              onChange={(e) => setUploadForm({ ...uploadForm, filename: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Record Count *
              </label>
              <Input
                type="number"
                required
                value={uploadForm.recordCount}
                onChange={(e) => setUploadForm({ ...uploadForm, recordCount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Size in Bytes *
              </label>
              <Input
                type="number"
                required
                value={uploadForm.fileSize}
                onChange={(e) => setUploadForm({ ...uploadForm, fileSize: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              SHA-256 Digest
            </label>
            <Input
              value={uploadForm.fileHash}
              onChange={(e) => setUploadForm({ ...uploadForm, fileHash: e.target.value })}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering & Sealing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload & Seal Dataset
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Datasets Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Datasets"
        description="Paste JSON dataset definitions to create cryptographically sealed dataset versions."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Dataset JSON Data
            </label>
            <Textarea
              rows={8}
              placeholder='[ { "filename": "sensor_stream_v1.csv", "recordCount": 120, "fileSize": 2048 } ]'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {importError && (
            <div className="p-3 bg-error/10 border border-error/30 text-error text-xs">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={submitting || !importJsonText.trim()}
              onClick={handleImportJson}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import & Seal Datasets
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
