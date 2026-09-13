// Core types for ResRec

export type ExperimentStatus =
  | "active"
  | "completed"
  | "under_review"
  | "integrity_issue";

export type VerificationStatus =
  | "verified"
  | "failed"
  | "not_provided"
  | "not_checked";

export type EvidenceEventType =
  | "measurement.recorded"
  | "measurement.corrected"
  | "dataset.created"
  | "dataset.finalized"
  | "dataset.modified"
  | "processing.applied"
  | "analysis.completed";

export interface Experiment {
  id: string;
  title: string;
  researcher: string;
  researchGroup: string;
  institution: string;
  status: ExperimentStatus;
  objective: string;
  instrument?: string;
  sample?: string;
  environment?: string;
  protocol?: string;
  recordCount: number;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
  integrityStatus: VerificationStatus;
}

export interface Measurement {
  id: string;
  experimentId: string;
  trial: number;
  timestamp: string;
  value: number;
  unit: string;
  instrument: string;
  status: VerificationStatus;
  evidenceId?: string;
  correctionOf?: string;
  correctionReason?: string;
}

export interface Dataset {
  id: string;
  experimentId: string;
  filename: string;
  version: number;
  recordCount: number;
  sizeBytes: number;
  sha256: string;
  coolCommitment: string;
  evidenceId: string;
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  experimentId: string;
  executionId: string;
  eventType: EvidenceEventType;
  sequence: number;
  issuedAt: string;
  metadataCommitment: string;
  inputCommitment?: string;
  outputCommitment?: string;
  softwareIdentity?: string;
  softwareVersion?: string;
  bindingVerification: VerificationStatus;
  signatureVerification: VerificationStatus;
  transparencyVerification: VerificationStatus;
  witnessVerification: VerificationStatus;
  attestationVerification: VerificationStatus;
}

export interface ProvenanceNode {
  id: string;
  type: "experiment" | "measurement" | "dataset" | "processing" | "analysis" | "result" | "submission";
  label: string;
  timestamp: string;
  recordId?: string;
  status: VerificationStatus;
  children?: ProvenanceNode[];
}

export interface IntegrityCheck {
  verified: boolean;
  bindingVerified: boolean;
  signatureVerified: boolean;
  transparencyVerified: boolean;
  datasetCommitmentVerified: boolean;
  recordSequenceVerified: boolean;
  lastVerification: string;
  issues: string[];
}

export interface ResearchSubmission {
  id: string;
  title: string;
  authors: string[];
  institution: string;
  status: "draft" | "under_review" | "approved" | "rejected";
  experimentIds: string[];
  totalRecords: number;
  verifiedRecords: number;
  integrityStatus: VerificationStatus;
  submittedAt?: string;
}

export type ReportType =
  | "verification"
  | "integrity"
  | "audit"
  | "summary";

export type ReportStatus = "ready" | "generating" | "failed";

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  experimentId?: string;
  generatedBy: string;
  generatedAt: string;
  sizeBytes: number;
  status: ReportStatus;
  summary: string;
}

export interface DashboardMetrics {
  activeExperiments: number;
  datasets: number;
  evidenceRecords: number;
  verificationIssues: number;
}
