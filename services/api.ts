// API service layer for ResRec
// This abstraction allows easy transition from mock data to real API calls

import type {
  Experiment,
  Measurement,
  Dataset,
  EvidenceRecord,
  ProvenanceNode,
  IntegrityCheck,
  ResearchSubmission,
  Report,
  DashboardMetrics,
} from "@/types";

import {
  mockExperiments,
  mockMeasurements,
  mockDatasets,
  mockEvidenceRecords,
  mockIntegrityCheck,
  mockIntegrityCheckWithIssues,
  mockProvenance,
  mockSubmissions,
  mockReports,
  mockDashboardMetrics,
} from "./mockData";

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Dashboard
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await delay(300);
  return mockDashboardMetrics;
}

// Experiments
export async function getExperiments(): Promise<Experiment[]> {
  await delay(400);
  return mockExperiments;
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  await delay(300);
  return mockExperiments.find((exp) => exp.id === id) || null;
}

export async function createExperiment(
  data: Partial<Experiment>
): Promise<Experiment> {
  await delay(500);
  // Mock implementation
  return {
    id: `EXP-2026-${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}`,
    title: data.title || "New Experiment",
    researcher: data.researcher || "",
    researchGroup: data.researchGroup || "",
    institution: data.institution || "",
    status: "active",
    objective: data.objective || "",
    recordCount: 0,
    evidenceCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    integrityStatus: "not_checked",
  };
}

// Measurements
export async function getMeasurements(
  experimentId: string
): Promise<Measurement[]> {
  await delay(400);
  return mockMeasurements.filter((m) => m.experimentId === experimentId);
}

export async function createMeasurement(
  data: Partial<Measurement>
): Promise<Measurement> {
  await delay(500);
  return {
    id: `MEAS-${Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0")}`,
    experimentId: data.experimentId || "",
    trial: data.trial || 1,
    timestamp: new Date().toISOString(),
    value: data.value || 0,
    unit: data.unit || "",
    instrument: data.instrument || "",
    status: "not_checked",
  };
}

export async function recordCorrection(data: {
  originalMeasurementId: string;
  correctedValue: number;
  reason: string;
  note?: string;
}): Promise<Measurement> {
  await delay(600);
  const original = mockMeasurements.find((m) => m.id === data.originalMeasurementId);

  return {
    id: `MEAS-${Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0")}`,
    experimentId: original?.experimentId || "",
    trial: original?.trial || 1,
    timestamp: new Date().toISOString(),
    value: data.correctedValue,
    unit: original?.unit || "",
    instrument: original?.instrument || "",
    status: "verified",
    correctionOf: data.originalMeasurementId,
    correctionReason: data.reason,
  };
}

// Datasets
export async function getDatasets(experimentId?: string): Promise<Dataset[]> {
  await delay(400);
  if (experimentId) {
    return mockDatasets.filter((ds) => ds.experimentId === experimentId);
  }
  return mockDatasets;
}

export async function getDataset(id: string): Promise<Dataset | null> {
  await delay(300);
  return mockDatasets.find((ds) => ds.id === id) || null;
}

// Evidence
export async function getEvidenceRecords(
  experimentId?: string
): Promise<EvidenceRecord[]> {
  await delay(400);
  if (experimentId) {
    return mockEvidenceRecords.filter((er) => er.experimentId === experimentId);
  }
  return mockEvidenceRecords;
}

export async function getEvidenceRecord(
  id: string
): Promise<EvidenceRecord | null> {
  await delay(300);
  return mockEvidenceRecords.find((er) => er.id === id) || null;
}

// Verification
export async function verifyEvidence(
  receipt: string | File,
  options?: { simulate?: "valid" | "tampered" }
): Promise<IntegrityCheck> {
  await delay(1500);
  // Mock verification - in production this would call the CooL verifier and the
  // verdict would derive from the receipt itself. The simulate flag lets the
  // demo exercise both the passing and failing verdicts.
  return options?.simulate === "tampered"
    ? mockIntegrityCheckWithIssues
    : mockIntegrityCheck;
}

export async function getIntegrityCheck(
  experimentId: string
): Promise<IntegrityCheck> {
  await delay(400);
  return mockIntegrityCheck;
}

// Provenance
export async function getProvenance(
  experimentId: string
): Promise<ProvenanceNode> {
  await delay(600);
  return mockProvenance;
}

// Submissions
export async function getSubmissions(): Promise<ResearchSubmission[]> {
  await delay(400);
  return mockSubmissions;
}

export async function getSubmission(
  id: string
): Promise<ResearchSubmission | null> {
  await delay(300);
  return mockSubmissions.find((sub) => sub.id === id) || null;
}

// Reports
export async function getReports(): Promise<Report[]> {
  await delay(400);
  return mockReports;
}

export async function getReport(id: string): Promise<Report | null> {
  await delay(300);
  return mockReports.find((rep) => rep.id === id) || null;
}

export async function getRecentActivity(): Promise<EvidenceRecord[]> {
  await delay(400);
  return mockEvidenceRecords.slice(0, 5);
}
