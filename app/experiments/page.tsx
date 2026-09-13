// Experiments Registry - Complete Visual Redesign V3

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
  StatusBadge,
  VerificationIcon,
} from "@/components/ui";
import type { Experiment } from "@/types";
import { getExperiments, createExperiment } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, downloadJsonFile } from "@/lib/utils";
import {
  Search,
  Plus,
  Upload,
  Filter,
  Download,
  FlaskConical,
  CheckCircle2,
  FileCode,
  Loader2,
} from "lucide-react";

export default function ExperimentsPage() {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [integrityFilter, setIntegrityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedDesc");

  // Modals & form state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Experiment Form
  const [formData, setFormData] = useState({
    title: "",
    researcher: user?.name || "Dr. Investigator",
    researchGroup: user?.department || "Scientific Research Group",
    institution: user?.institutionName || "Indian Institute of Technology Bombay",
    objective: "",
    protocol: "Standard Research Protocol Rev 4.2",
    instrument: "Quantum Design MPMS3 SQUID Magnetometer",
    sample: "Sample Specimen Batch A-1",
    environment: "Controlled Argon Atmosphere, 295K, 1 atm",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        researcher: user.name || prev.researcher,
        researchGroup: user.department || prev.researchGroup,
        institution: user.institutionName || prev.institution,
      }));
    }
  }, [user]);

  // Import text/file state
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

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

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const created = await createExperiment({
        title: formData.title,
        researcher: formData.researcher,
        researchGroup: formData.researchGroup,
        institution: formData.institution,
        objective: formData.objective || "Empirical scientific investigation and validation.",
        protocol: formData.protocol,
        instrument: formData.instrument,
        sample: formData.sample,
        environment: formData.environment,
      });

      setExperiments((prev) => [created, ...prev]);
      setIsNewModalOpen(false);
      setFormData({
        title: "",
        researcher: "Dr. Sarah Chen",
        researchGroup: "Advanced Materials Laboratory",
        institution: "Indian Institute of Technology Bombay",
        objective: "",
        protocol: "Standard Research Protocol Rev 4.2",
        instrument: "Quantum Design MPMS3 SQUID Magnetometer",
        sample: "Hydride Sample Batch A",
        environment: "Controlled Argon Atmosphere, 295K, 1 atm",
      });
      showNotification(`Experiment ${created.id} registered and sealed with CooL receipt!`);
    } catch (err: any) {
      alert(`Failed to create experiment: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportAll = () => {
    downloadJsonFile(
      `resrec_experiments_export_${new Date().toISOString().slice(0, 10)}.json`,
      filteredExperiments
    );
    showNotification(`Exported ${filteredExperiments.length} experiments as JSON.`);
  };

  const handleImportJson = async () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError("Please enter or paste JSON experiment data.");
      return;
    }

    setImporting(true);
    try {
      let parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      const createdList: Experiment[] = [];
      for (const item of parsed) {
        const created = await createExperiment({
          title: item.title || "Imported Research Run",
          researcher: item.researcher || item.principalInvestigator || "Research Investigator",
          researchGroup: item.researchGroup || "Research Division",
          institution: item.institution || "Institutional Partner",
          objective: item.objective || "Imported experimental dataset validation.",
          protocol: item.protocol || "Standard Protocol",
          instrument: item.instrument || item.instrumentName || "Analytical Instrument",
          sample: item.sample || item.sampleName || "Sample Specimen",
          environment: item.environment || "Laboratory ambient",
        });
        createdList.push(created);
      }

      setExperiments((prev) => [...createdList, ...prev]);
      setIsImportModalOpen(false);
      setImportJsonText("");
      showNotification(`Successfully imported and sealed ${createdList.length} experiment(s)!`);
    } catch (err: any) {
      setImportError(`Invalid JSON or API error: ${err?.message || err}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

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
        title="Experiments"
        subtitle="Research experiments with cryptographic evidence tracking and integrity verification."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Export Results
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
              Import Experiments
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Experiment
            </Button>
          </>
        }
      />

      {/* Advanced Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-4">
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
          <div className="col-span-6 sm:col-span-3 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "All Statuses" },
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
          <div className="col-span-6 sm:col-span-3 lg:col-span-2">
            <Select
              options={[
                { value: "all", label: "All Integrities" },
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
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Select
              options={[
                { value: "updatedDesc", label: "Sort: Newest First" },
                { value: "updatedAsc", label: "Sort: Oldest First" },
                { value: "titleAsc", label: "Sort: Title (A-Z)" },
                { value: "titleDesc", label: "Sort: Title (Z-A)" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full"
            />
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
              className="text-xs text-primary hover:text-primary-hover ml-2 cursor-pointer font-medium"
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
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                title: `Batch Run #${experiments.length + 1} - Comparative Spectroscopy`,
              }));
              setIsNewModalOpen(true);
            }}
          >
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
              <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>
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
                  <th className="text-left py-4 px-6 font-medium text-ink w-36">
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
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-surface-elevated transition-all cursor-pointer group"
                    onClick={() => {
                      window.location.href = `/experiments/${exp.id}`;
                    }}
                  >
                    <td className="py-4 px-6 font-mono text-ink">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="block hover:text-primary transition-colors font-medium"
                      >
                        {exp.id}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink">
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {exp.title}
                      </div>
                      <div className="text-xs text-ink-muted mt-1 truncate max-w-md">
                        {exp.objective || "Scientific research experiment"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink">
                      <div>{exp.researcher}</div>
                      <div className="text-xs text-ink-muted mt-1">
                        {exp.researchGroup}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-sm text-ink">
                      {exp.evidenceCount || 1}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <VerificationIcon status={exp.integrityStatus || "verified"} />
                        <span className="text-xs font-medium text-ink capitalize">
                          {exp.integrityStatus || "verified"}
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

      {/* Register New Experiment Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register New Research Experiment"
        description="Creates an immutable experiment ledger with post-quantum CooL receipt generation."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Experiment Title *
            </label>
            <Input
              required
              placeholder="e.g., Temperature Dependent Resistance in LaH10 Hydrides"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Principal Investigator *
              </label>
              <Input
                required
                value={formData.researcher}
                onChange={(e) => setFormData({ ...formData, researcher: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Research Group
              </label>
              <Input
                value={formData.researchGroup}
                onChange={(e) => setFormData({ ...formData, researchGroup: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Institution
              </label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Protocol / Standard
              </label>
              <Input
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Primary Instrument
              </label>
              <Input
                value={formData.instrument}
                onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Sample Specimen
              </label>
              <Input
                value={formData.sample}
                onChange={(e) => setFormData({ ...formData, sample: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Research Objective
            </label>
            <Textarea
              rows={3}
              placeholder="State the empirical hypotheses, methods, and validation goals..."
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
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
                  Generating Receipt...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Register & Seal Experiment
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Experiments Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Experiments"
        description="Upload or paste JSON experiment definitions. CooL receipts will be generated automatically."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-surface-elevated file:text-ink hover:file:bg-border border border-border p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Or Paste JSON Data
            </label>
            <Textarea
              rows={8}
              placeholder='[ { "title": "Experimental Run A", "researcher": "Dr. Sarah Chen", "objective": "..." } ]'
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
              disabled={importing || !importJsonText.trim()}
              onClick={handleImportJson}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing & Sealing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Experiments
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
