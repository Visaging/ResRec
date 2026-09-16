// API service layer for ResRec
// Connects UI components to live Next.js backend API routes with real Prisma database and CooL SDK

import type {
  Experiment,
  Measurement,
  Dataset,
  EvidenceRecord,
  ProvenanceNode,
  ProvenanceGraphData,
  ProvenanceGraphNode,
  ProvenanceGraphEdge,
  IntegrityCheck,
  ResearchSubmission,
  Report,
  DashboardMetrics,
  AuthUser,
} from "@/types";

const API_BASE = "";

// Helper for fetch with JSON parsing and error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    let errorDetail = text || `API request failed with status ${res.status}`;
    if (text) {
      try {
        const errJson = JSON.parse(text);
        errorDetail = errJson.error || errJson.details || JSON.stringify(errJson);
      } catch {
        // Keep the raw text when it is not valid JSON.
      }
    }
    throw new Error(errorDetail || `API request failed with status ${res.status}`);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Response from ${url} was not valid JSON.`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Dashboard
// ────────────────────────────────────────────────────────────────────────────
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const data = await fetchJson<{
      metrics: {
        totalExperiments: number;
        verifiedRecords: number;
        totalDatasets: number;
        totalEvidenceRecords: number;
        pendingSubmissions: number;
        activeAlerts: number;
        activityChart?: { name: string; verified: number; pending: number; failed: number }[];
      };
    }>("/api/dashboard");

    return {
      activeExperiments: data.metrics.totalExperiments || 0,
      datasets: data.metrics.totalDatasets || 0,
      evidenceRecords: data.metrics.totalEvidenceRecords || 0,
      verificationIssues: data.metrics.activeAlerts || 0,
      activityChart: data.metrics.activityChart,
    };
  } catch (error) {
    console.error("getDashboardMetrics failed:", error);
    return {
      activeExperiments: 0,
      datasets: 0,
      evidenceRecords: 0,
      verificationIssues: 0,
      activityChart: [],
    };
  }
}

export async function updateProfile(data: {
  name: string;
  email: string;
  institutionName?: string;
  department?: string;
  currentPassword?: string;
}): Promise<AuthUser> {
  const response = await fetchJson<{ user: AuthUser }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response.user;
}

export async function getProfile(): Promise<AuthUser> {
  const response = await fetchJson<{ user: AuthUser }>("/api/auth/profile");
  return response.user;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await fetchJson<void>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateAvatar(avatarUrl: string | null): Promise<AuthUser> {
  const response = await fetchJson<{ user: AuthUser }>("/api/auth/avatar", {
    method: "PATCH",
    body: JSON.stringify({ avatarUrl }),
  });
  return response.user;
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Experiments
// ────────────────────────────────────────────────────────────────────────────
export async function getExperiments(): Promise<Experiment[]> {
  try {
    const data = await fetchJson<any[]>("/api/experiments");
    return data.map((exp) => ({
      id: exp.publicId || exp.id,
      title: exp.title,
      researcher: exp.principalInvestigator,
      researchGroup: exp.researchGroup,
      institution: typeof exp.institution === "string" ? exp.institution : exp.institution?.name || "Independent",
      status: exp.status,
      objective: exp.objective,
      instrument: exp.instrumentName,
      sample: exp.sampleName,
      environment: exp.environment,
      protocol: exp.protocol,
      recordCount: exp.recordCount || 0,
      evidenceCount: exp.evidenceCount || 0,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      integrityStatus: exp.integrityStatus || "verified",
    }));
  } catch (error) {
    console.error("getExperiments failed:", error);
    return [];
  }
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  try {
    const exp = await fetchJson<any>(`/api/experiments/${encodeURIComponent(id)}`);
    return {
      id: exp.publicId || exp.id,
      title: exp.title,
      researcher: exp.principalInvestigator,
      researchGroup: exp.researchGroup,
      institution: typeof exp.institution === "string" ? exp.institution : exp.institution?.name || "Independent",
      status: exp.status,
      objective: exp.objective,
      instrument: exp.instrumentName,
      sample: exp.sampleName,
      environment: exp.environment,
      protocol: exp.protocol,
      recordCount: exp.recordCount || exp.measurements?.length || 0,
      evidenceCount: exp.evidenceCount || exp.evidenceRecords?.length || 0,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      integrityStatus: exp.integrityStatus || "verified",
    };
  } catch (error) {
    console.error(`getExperiment(${id}) failed:`, error);
    return null;
  }
}

export async function createExperiment(data: Partial<Experiment>): Promise<Experiment> {
  const payload = {
    title: data.title,
    objective: data.objective,
    principalInvestigator: data.researcher,
    researchGroup: data.researchGroup,
    institutionName: data.institution,
    protocol: data.protocol,
    environment: data.environment,
    instrumentName: data.instrument,
    sampleName: data.sample,
  };

  const res = await fetchJson<any>("/api/experiments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const exp = res.experiment || res;
  return {
    id: exp.publicId || exp.id,
    title: exp.title,
    researcher: exp.principalInvestigator,
    researchGroup: exp.researchGroup,
    institution: exp.institution?.name || data.institution || "Independent",
    status: exp.status,
    objective: exp.objective,
    instrument: exp.instrumentName,
    sample: exp.sampleName,
    environment: exp.environment,
    protocol: exp.protocol,
    recordCount: exp.recordCount || 0,
    evidenceCount: exp.evidenceCount || 1,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt,
    integrityStatus: exp.integrityStatus || "verified",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Measurements & Corrections
// ────────────────────────────────────────────────────────────────────────────
export async function getMeasurements(experimentId: string): Promise<Measurement[]> {
  try {
    const data = await fetchJson<any[]>(`/api/experiments/${encodeURIComponent(experimentId)}/measurements`);
    return data.map((m) => ({
      id: m.publicId || m.id,
      experimentId: experimentId,
      trial: m.trialNumber,
      timestamp: m.timestamp,
      value: m.value,
      unit: m.unit,
      instrument: m.instrumentName || "",
      status: m.status || "verified",
      evidenceId: m.evidenceRecord?.publicId || m.evidenceRecordId || undefined,
      correctionOf: m.correctionOf || undefined,
      correctionReason: m.correctionReason || undefined,
    }));
  } catch (error) {
    console.error(`getMeasurements(${experimentId}) failed:`, error);
    return [];
  }
}

export async function createMeasurement(data: Partial<Measurement>): Promise<Measurement> {
  const expId = data.experimentId || "EXP-2026-0042";
  const res = await fetchJson<any>(`/api/experiments/${encodeURIComponent(expId)}/measurements`, {
    method: "POST",
    body: JSON.stringify({
      value: data.value,
      unit: data.unit,
      trialNumber: data.trial,
      instrumentName: data.instrument,
    }),
  });

  const m = res.measurement || res;
  return {
    id: m.publicId || m.id,
    experimentId: expId,
    trial: m.trialNumber,
    timestamp: m.timestamp,
    value: m.value,
    unit: m.unit,
    instrument: m.instrumentName || data.instrument || "",
    status: m.status || "verified",
    evidenceId: res.evidenceRecord?.publicId || m.evidenceRecordId,
  };
}

export async function recordCorrection(data: {
  originalMeasurementId: string;
  correctedValue: number;
  reason: string;
  note?: string;
  operator?: string;
}): Promise<Measurement> {
  const res = await fetchJson<any>(`/api/measurements/${encodeURIComponent(data.originalMeasurementId)}/correct`, {
    method: "POST",
    body: JSON.stringify({
      correctedValue: data.correctedValue,
      reason: data.reason,
      note: data.note,
      operator: data.operator,
    }),
  });

  const m = res.correctedMeasurement;
  return {
    id: m.publicId || m.id,
    experimentId: m.experimentId,
    trial: m.trialNumber,
    timestamp: m.timestamp,
    value: m.value,
    unit: m.unit,
    instrument: m.instrumentName || "",
    status: m.status || "verified",
    evidenceId: res.evidenceRecord?.publicId || m.evidenceRecordId,
    correctionOf: data.originalMeasurementId,
    correctionReason: data.reason,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Datasets
// ────────────────────────────────────────────────────────────────────────────
export async function getDatasets(experimentId?: string): Promise<Dataset[]> {
  try {
    if (experimentId) {
      const data = await fetchJson<any[]>(`/api/experiments/${encodeURIComponent(experimentId)}/datasets`);
      return data.map((ds) => ({
        id: ds.publicId || ds.id,
        experimentId: experimentId,
        filename: ds.filename,
        version: ds.currentVersion || ds.versions?.[0]?.version || 1,
        recordCount: ds.recordCount || 0,
        sizeBytes: ds.fileSize || 0,
        sha256: ds.sha256,
        coolCommitment: ds.coolCommitment,
        evidenceId: ds.evidenceRecordId || "",
        status: ds.status || "verified",
        createdAt: ds.createdAt,
        updatedAt: ds.updatedAt,
      }));
    }

    // Fetch all experiments and their datasets
    const experiments = await fetchJson<any[]>("/api/experiments");
    const datasetList: Dataset[] = [];
    for (const exp of experiments) {
      const dsList = await fetchJson<any[]>(`/api/experiments/${exp.publicId || exp.id}/datasets`).catch(() => []);
      for (const ds of dsList) {
        datasetList.push({
          id: ds.publicId || ds.id,
          experimentId: exp.publicId || exp.id,
          filename: ds.filename,
          version: ds.currentVersion || 1,
          recordCount: ds.recordCount || 0,
          sizeBytes: ds.fileSize || 0,
          sha256: ds.sha256,
          coolCommitment: ds.coolCommitment,
          evidenceId: ds.evidenceRecordId || "",
          status: ds.status || "verified",
          createdAt: ds.createdAt,
          updatedAt: ds.updatedAt,
        });
      }
    }
    return datasetList;
  } catch (error) {
    console.error("getDatasets failed:", error);
    return [];
  }
}

export async function getDataset(id: string): Promise<Dataset | null> {
  try {
    const ds = await fetchJson<any>(`/api/datasets/${encodeURIComponent(id)}`);
    return {
      id: ds.publicId || ds.id,
      experimentId: ds.experiment?.publicId || ds.experimentId,
      filename: ds.filename,
      version: ds.currentVersion || 1,
      recordCount: ds.recordCount || 0,
      sizeBytes: ds.fileSize || 0,
      sha256: ds.sha256,
      coolCommitment: ds.coolCommitment,
      evidenceId: ds.evidenceRecordId || "",
      status: ds.status || "verified",
      createdAt: ds.createdAt,
      updatedAt: ds.updatedAt,
    };
  } catch (error) {
    console.error(`getDataset(${id}) failed:`, error);
    return null;
  }
}

export async function createDataset(
  experimentId: string,
  data: {
    name?: string;
    filename: string;
    recordCount?: number;
    fileSize?: number;
    fileHash?: string;
    content?: string;
  }
): Promise<Dataset> {
  const res = await fetchJson<any>(`/api/experiments/${encodeURIComponent(experimentId)}/datasets`, {
    method: "POST",
    body: JSON.stringify({
      name: data.name || data.filename,
      filename: data.filename,
      recordCount: data.recordCount || 0,
      fileSize: data.fileSize || 0,
      content: data.content,
    }),
  });

  const ds = res.dataset || res;
  return {
    id: ds.publicId || ds.id,
    experimentId: experimentId,
    filename: ds.filename,
    version: ds.currentVersion || 1,
    recordCount: ds.recordCount || data.recordCount || 0,
    sizeBytes: ds.fileSize || data.fileSize || 0,
    sha256: ds.sha256 || "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    coolCommitment: ds.coolCommitment || "mh:sha256:0000000000000000000000000000000000000000000000000000000000000000",
    evidenceId: res.evidenceRecord?.publicId || ds.evidenceRecordId || "",
    status: ds.status || "verified",
    createdAt: ds.createdAt || new Date().toISOString(),
    updatedAt: ds.updatedAt || new Date().toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Evidence Records
// ────────────────────────────────────────────────────────────────────────────
export async function getEvidenceRecords(experimentId?: string): Promise<EvidenceRecord[]> {
  try {
    const url = experimentId ? `/api/evidence?experimentId=${encodeURIComponent(experimentId)}` : "/api/evidence";
    const data = await fetchJson<any[]>(url);
    return data.map((r) => ({
      id: r.publicId || r.id,
      experimentId: r.experimentPublicId || r.experimentId || "SYSTEM",
      executionId: r.executionId,
      eventType: r.eventType,
      sequence: r.sequence,
      issuedAt: r.issuedAt,
      metadataCommitment: r.metadataCommitment,
      inputCommitment: r.inputCommitment || undefined,
      outputCommitment: r.outputCommitment || undefined,
      softwareIdentity: r.softwareIdentity || undefined,
      softwareVersion: r.softwareVersion || undefined,
      evidenceJson: r.evidenceJson || undefined,
      bindingVerification: r.bindingVerification || "verified",
      signatureVerification: r.signatureVerification || "verified",
      transparencyVerification: r.transparencyVerification || "verified",
      witnessVerification: r.witnessVerification || "not_provided",
      attestationVerification: r.attestationVerification || "verified",
    }));
  } catch (error) {
    console.error("getEvidenceRecords failed:", error);
    return [];
  }
}

export async function getEvidenceRecord(id: string): Promise<EvidenceRecord | null> {
  try {
    const r = await fetchJson<any>(`/api/evidence/${encodeURIComponent(id)}`);
    return {
      id: r.publicId || r.id,
      experimentId: r.experiment?.publicId || r.experimentId || "SYSTEM",
      executionId: r.executionId,
      eventType: r.eventType,
      sequence: r.sequence,
      issuedAt: r.issuedAt,
      metadataCommitment: r.metadataCommitment,
      inputCommitment: r.inputCommitment || undefined,
      outputCommitment: r.outputCommitment || undefined,
      softwareIdentity: r.softwareIdentity || undefined,
      softwareVersion: r.softwareVersion || undefined,
      evidenceJson: r.evidenceJson || undefined,
      bindingVerification: r.bindingVerification || "verified",
      signatureVerification: r.signatureVerification || "verified",
      transparencyVerification: r.transparencyVerification || "verified",
      witnessVerification: r.witnessVerification || "not_provided",
      attestationVerification: r.attestationVerification || "verified",
    };
  } catch (error) {
    console.error(`getEvidenceRecord(${id}) failed:`, error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Verification
// ────────────────────────────────────────────────────────────────────────────
export async function verifyEvidence(
  receipt: string | File,
  options?: { simulate?: "valid" | "tampered" }
): Promise<IntegrityCheck> {
  let receiptText = "";
  if (receipt instanceof File) {
    receiptText = await receipt.text();
  } else if (typeof receipt === "string") {
    receiptText = receipt;
  } else {
    receiptText = JSON.stringify(receipt);
  }

  // If simulation is set to tampered, corrupt the receipt string
  if (options?.simulate === "tampered") {
    try {
      const parsed = JSON.parse(receiptText);
      parsed.binding_hash = "mh:sha256:0000000000000000000000000000000000000000000000000000000000000000";
      receiptText = JSON.stringify(parsed);
    } catch {
      receiptText = "{\"corrupted\":true}";
    }
  }

  try {
    const res = await fetchJson<any>("/api/verification/verify-receipt", {
      method: "POST",
      body: JSON.stringify({ receipt: receiptText }),
    });

    const isVerified = res.overallStatus === "verified";
    return {
      verified: isVerified,
      bindingVerified: res.bindingStatus === "verified",
      signatureVerified: res.signatureStatus === "verified",
      transparencyVerified: res.transparencyStatus === "verified",
      datasetCommitmentVerified: res.datasetCommitmentStatus === "verified",
      recordSequenceVerified: res.recordSequenceStatus === "verified",
      lastVerification: new Date().toISOString(),
      issues: res.issues || [],
      report: res.report,
      verdictRaw: res.verdictRaw,
    };
  } catch (error: any) {
    return {
      verified: false,
      bindingVerified: false,
      signatureVerified: false,
      transparencyVerified: false,
      datasetCommitmentVerified: false,
      recordSequenceVerified: false,
      lastVerification: new Date().toISOString(),
      issues: [error.message || "Failed to verify receipt with CooL verifier."],
    };
  }
}

export async function getIntegrityCheck(experimentId: string): Promise<IntegrityCheck> {
  try {
    const res = await fetchJson<any>("/api/verification/verify-experiment", {
      method: "POST",
      body: JSON.stringify({ experimentId }),
    });

    const isVerified = res.overallStatus === "verified";
    return {
      verified: isVerified,
      bindingVerified: res.bindingStatus === "verified",
      signatureVerified: res.signatureStatus === "verified",
      transparencyVerified: res.transparencyStatus === "verified",
      datasetCommitmentVerified: res.datasetCommitmentStatus === "verified",
      recordSequenceVerified: res.recordSequenceStatus === "verified",
      lastVerification: new Date().toISOString(),
      issues: res.issues || [],
    };
  } catch (error: any) {
    console.error(`getIntegrityCheck(${experimentId}) failed:`, error);
    return {
      verified: false,
      bindingVerified: false,
      signatureVerified: false,
      transparencyVerified: false,
      datasetCommitmentVerified: false,
      recordSequenceVerified: false,
      lastVerification: new Date().toISOString(),
      issues: [error.message || "Verification check failed"],
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Provenance Graphs
// ────────────────────────────────────────────────────────────────────────────
export async function getProvenance(experimentId: string): Promise<ProvenanceNode> {
  const graph = await getProvenanceGraph(experimentId);
  const rootNode = graph.nodes.find((n) => n.type === "experiment") || graph.nodes[0];

  return {
    id: rootNode?.id || experimentId,
    type: rootNode?.type || "experiment",
    label: rootNode?.label || experimentId,
    timestamp: rootNode?.timestamp || new Date().toISOString(),
    status: (rootNode?.status as any) || "verified",
    children: [],
  };
}

export async function getProvenanceGraph(experimentId?: string): Promise<ProvenanceGraphData> {
  const expId = experimentId || "EXP-2026-0042";
  try {
    const data = await fetchJson<any>(`/api/experiments/${encodeURIComponent(expId)}/provenance`);

    // Assign centered coordinates by vertical stage so each row forms a readable pyramid.
    const stageOrder = [
      "experiment",
      "sample",
      "instrument",
      "measurement",
      "correction",
      "dataset_version",
      "dataset",
      "processing",
      "analysis",
      "result",
      "submission",
      "evidence",
    ];
    const stageForType: Record<string, string> = {
      experiment: "experiment",
      sample: "sample",
      instrument: "sample",
      measurement: "measurement",
      correction: "measurement",
      dataset_version: "dataset",
      dataset: "dataset",
      processing: "processing",
      analysis: "analysis",
      result: "result",
      submission: "submission",
      evidence: "evidence",
    };
    const stageCounters: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    for (const node of data.nodes as any[]) {
      const stage = stageForType[node.type] || "measurement";
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }

    const nodes: ProvenanceGraphNode[] = data.nodes.map((n: any) => {
      const t = n.type || "measurement";
      const stage = stageForType[t] || "measurement";
      stageCounters[stage] = (stageCounters[stage] || 0) + 1;
      const index = stageCounters[stage] - 1;
      const count = stageCounts[stage] || 1;
      const x = 500 + (index - (count - 1) / 2) * 145;
      const y = 70 + stageOrder.indexOf(stage) * 88;

      return {
        id: n.id,
        type: n.type,
        label: n.label,
        timestamp: n.timestamp,
        metadata: n.metadata || {},
        verified: n.status === "verified",
        status: n.status,
        recordId: n.evidenceRecordId || undefined,
        experimentId: expId,
        x,
        y,
      };
    });

    const edges: ProvenanceGraphEdge[] = data.edges.map((e: any) => ({
      from: e.source,
      to: e.target,
      label: e.label || "connected",
      verified: e.status === "verified",
    }));

    return {
      experimentId: expId,
      nodes,
      edges,
    };
  } catch (error) {
    console.error(`getProvenanceGraph(${expId}) failed:`, error);
    return {
      experimentId: expId,
      nodes: [],
      edges: [],
    };
  }
}

export async function getAllProvenanceGraphs(): Promise<Record<string, ProvenanceGraphData>> {
  try {
    const experiments = await getExperiments();
    const graphs: Record<string, ProvenanceGraphData> = {};
    for (const exp of experiments) {
      graphs[exp.id] = await getProvenanceGraph(exp.id);
    }
    return graphs;
  } catch (error) {
    console.error("getAllProvenanceGraphs failed:", error);
    return {};
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 8. Submissions
// ────────────────────────────────────────────────────────────────────────────
export async function getSubmissions(): Promise<ResearchSubmission[]> {
  try {
    const data = await fetchJson<any[]>("/api/submissions");
    return data.map((sub) => ({
      id: sub.publicId || sub.id,
      title: sub.title,
      authors: Array.isArray(sub.authors) ? sub.authors : [sub.authors],
      institution: sub.institution,
      status: sub.status,
      experimentIds: sub.experimentPublicId ? [sub.experimentPublicId] : sub.experimentId ? [sub.experimentId] : [],
      totalRecords: sub.totalRecords || 0,
      verifiedRecords: sub.verifiedRecords || 0,
      integrityStatus: sub.integrityStatus || "verified",
      submittedAt: sub.submittedAt,
    }));
  } catch (error) {
    console.error("getSubmissions failed:", error);
    return [];
  }
}

export async function getSubmission(id: string): Promise<ResearchSubmission | null> {
  try {
    const sub = await fetchJson<any>(`/api/submissions/${encodeURIComponent(id)}`);
    return {
      id: sub.publicId || sub.id,
      title: sub.title,
      authors: Array.isArray(sub.authors) ? sub.authors : [sub.authors],
      institution: sub.institution,
      status: sub.status,
      experimentIds: sub.experiment?.publicId ? [sub.experiment.publicId] : sub.experimentId ? [sub.experimentId] : [],
      totalRecords: sub.totalRecords || 0,
      verifiedRecords: sub.verifiedRecords || 0,
      integrityStatus: sub.integrityStatus || "verified",
      submittedAt: sub.submittedAt,
    };
  } catch (error) {
    console.error(`getSubmission(${id}) failed:`, error);
    return null;
  }
}

export async function createSubmission(data: {
  experimentId?: string;
  title: string;
  abstract?: string;
  authors: string[];
  institution?: string;
}): Promise<ResearchSubmission> {
  const res = await fetchJson<any>("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return {
    id: res.publicId || res.id,
    title: res.title,
    authors: Array.isArray(res.authors) ? res.authors : [res.authors],
    institution: res.institution,
    status: res.status,
    experimentIds: res.experimentId ? [res.experimentId] : [],
    totalRecords: res.totalRecords || 0,
    verifiedRecords: res.verifiedRecords || 0,
    integrityStatus: res.integrityStatus || "verified",
    submittedAt: res.submittedAt,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 9. Reports
// ────────────────────────────────────────────────────────────────────────────
export async function getReports(): Promise<Report[]> {
  try {
    const data = await fetchJson<any[]>("/api/reports");
    return data.map((rep) => ({
      id: rep.publicId || rep.id,
      title: rep.title,
      type: rep.type || "verification",
      experimentId: rep.experimentId,
      generatedBy: rep.generatedBy,
      generatedAt: rep.generatedAt,
      sizeBytes: rep.sizeBytes,
      status: rep.status || "ready",
      summary: rep.summary,
    }));
  } catch (error) {
    console.error("getReports failed:", error);
    return [];
  }
}

export async function createReport(data: {
  experimentId: string;
  title?: string;
  type?: string;
}): Promise<Report> {
  const res = await fetchJson<any>("/api/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return {
    id: res.publicId || res.id,
    title: res.title,
    type: res.type || "verification",
    experimentId: res.experimentId,
    generatedBy: res.generatedBy,
    generatedAt: res.generatedAt,
    sizeBytes: res.sizeBytes,
    status: res.status || "ready",
    summary: res.summary,
  };
}

export async function getReport(id: string): Promise<Report | null> {
  try {
    const rep = await fetchJson<any>(`/api/reports/${encodeURIComponent(id)}`);
    return {
      id: rep.publicId || rep.id,
      title: rep.title,
      type: rep.type || "verification",
      experimentId: rep.experimentId,
      generatedBy: rep.generatedBy,
      generatedAt: rep.generatedAt,
      sizeBytes: rep.sizeBytes,
      status: rep.status || "ready",
      summary: rep.summary,
    };
  } catch (error) {
    console.error(`getReport(${id}) failed:`, error);
    return null;
  }
}

export async function getRecentActivity(): Promise<EvidenceRecord[]> {
  try {
    const records = await getEvidenceRecords();
    return records.slice(0, 5);
  } catch (error) {
    console.error("getRecentActivity failed:", error);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 8. Authentication
// ────────────────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetchJson<{ user: AuthUser }>("/api/auth/me");
    return res.user;
  } catch {
    return null;
  }
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser }> {
  return fetchJson<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  institutionName?: string;
  department?: string;
  role?: string;
}): Promise<{ user: AuthUser }> {
  return fetchJson<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logoutUser(): Promise<void> {
  await fetchJson<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
