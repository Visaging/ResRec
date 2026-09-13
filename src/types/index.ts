export type VerificationStatus =
  | 'verified'
  | 'failed'
  | 'not_provided'
  | 'not_checked';

export type PostRecordingModificationStatus =
  | 'not_detected'
  | 'detected'
  | 'unknown';

export type ExperimentStatus =
  | 'active'
  | 'completed'
  | 'under_review'
  | 'integrity_issue'
  | 'sealed';

export type BadgeVariant =
  | 'verified'
  | 'failed'
  | 'not_provided'
  | 'not_checked'
  | 'active'
  | 'completed'
  | 'under_review'
  | 'integrity_issue'
  | 'sealed'
  | 'corrected'
  | 'flagged'
  | 'mismatch'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'critical';

export interface IntegrityDetails {
  status?: string;
  evidenceRecordsVerified: boolean;
  datasetCommitmentVerified: boolean;
  recordSequenceVerified: boolean;
  signaturesVerified: boolean;
  lastVerifiedAt: string;
  receiptCount?: number;
  witnessSignatures?: number;
  witnessThreshold?: number;
  hardwareAttestation?: string;
  transparencyInclusion?: string;
  softwareIdentityDigest?: string;
}

export interface ExperimentStats {
  totalMeasurements: number;
  totalDatasets: number;
  totalEvidenceRecords: number;
  totalCorrections: number;
}

export interface ExperimentMetadata {
  laboratory: string;
  grantId: string;
  operatorId?: string;
  reproducibilityPackage?: string;
}

export interface Experiment {
  id: string; // e.g. "EXP-2026-0042"
  title: string;
  description?: string;
  pi?: string;
  principalInvestigator: string;
  researchGroup: string;
  institution: string;
  instrument: string;
  sample: string;
  calibrationStatus: string;
  protocol: string;
  researchObjective: string;
  experimentalSetup: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
  recordCount: number;
  datasetCount: number;
  correctionsCount: number;
  integrity: IntegrityDetails;
  primaryUnit: string;
  primaryParameter: string;
  stats?: ExperimentStats;
  metadata?: ExperimentMetadata;
  tags?: string[];
}

export interface MeasurementCorrection {
  correctionId: string;
  correctedValue: number;
  recordedAt: string;
  reason: string;
  supportingNote: string;
  evidenceId: string;
  recordedBy: string;
}

export interface Measurement {
  id: string; // e.g. "M-042-017"
  experimentId: string;
  trialNumber: string; // e.g. "01", "02"
  timestamp: string;
  value: number;
  secondaryValue?: number;
  unit: string;
  parameter: string;
  instrument: string;
  status: 'verified' | 'corrected' | 'flagged';
  evidenceId: string; // e.g. "REC-91A2-4011"
  rawPayloadHash: string;
  correction?: MeasurementCorrection;
}

export interface DatasetVersion {
  version: string;
  sha256: string;
  coolCommitment: string;
  recordCount: number;
  sizeFormatted: string;
  timestamp: string;
  reason: string;
  evidenceId: string;
}

export interface Dataset {
  id: string;
  experimentId: string;
  fileName: string;
  version: string;
  recordCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  coolCommitment: string;
  evidenceId: string;
  status: 'verified' | 'mismatch' | 'uncommitted';
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  description: string;
  headers: string[];
  previewRows: Array<Record<string, string | number>>;
  previousVersions?: DatasetVersion[];
  isTampered?: boolean;
}

export type EvidenceEventType =
  | 'measurement.recorded'
  | 'measurement.corrected'
  | 'dataset.committed'
  | 'dataset.finalized'
  | 'experiment.genesis'
  | 'pipeline.executed'
  | 'provenance.sealed'
  | 'calibration.verified';

export interface EvidenceCheckBreakdown {
  binding: VerificationStatus;
  signature: VerificationStatus;
  transparency: VerificationStatus;
  witnesses: VerificationStatus;
  attestation: VerificationStatus;
}

export interface SoftwareIdentity {
  name: string;
  version: string;
  binaryDigest: string;
  runtimeEnvironment: string;
}

export interface EvidenceRecord {
  id: string; // e.g. "REC-91A2-0042"
  executionId: string; // e.g. "EXEC-42-881"
  experimentId: string;
  eventType: EvidenceEventType;
  sequence: number;
  issuedAt: string;
  metadataCommitment: string;
  inputCommitment: string;
  outputCommitment: string;
  softwareIdentity: SoftwareIdentity;
  verification: EvidenceCheckBreakdown;
  witnessCount: number;
  witnessThreshold: number;
  transparencyLogIndex?: number;
  signerIdentity: string;
  payloadSummary: string;
}

export interface ProvenanceNode {
  id: string;
  label: string;
  category:
    | 'experiment'
    | 'raw_measurements'
    | 'dataset'
    | 'processing_step'
    | 'analysis'
    | 'derived_result'
    | 'figure'
    | 'submission';
  timestamp: string;
  recordId: string;
  status: 'verified' | 'warning' | 'failed';
  details: {
    description: string;
    operator?: string;
    software?: string;
    parameters?: Record<string, string | number>;
    inputHash?: string;
    outputHash?: string;
  };
  childrenNodeIds?: string[];
}

export interface VerificationResult {
  receiptId: string;
  verifiedAt: string;
  timestamp?: string;
  overallStatus: 'verified' | 'failed';
  checks: {
    evidenceIntegrity: VerificationStatus;
    signature: VerificationStatus;
    recordBinding: VerificationStatus;
    transparencyInclusion: VerificationStatus;
    datasetCommitment: VerificationStatus;
    witnessConsensus: VerificationStatus;
    hardwareAttestation: VerificationStatus;
    postRecordingModification: PostRecordingModificationStatus;
  };
  experimentId?: string;
  datasetName?: string;
  expectedCommitment?: string;
  observedCommitment?: string;
  affectedRecordId?: string;
  mismatchReason?: string;
  rawReceiptJson?: string;
}

export interface ClaimProof {
  id: string;
  claimText: string;
  datasetName: string;
  datasetCommitment: string;
  receiptId: string;
  lineageSummary: string;
  figureCitation: string;
  verificationStatus: VerificationStatus;
}

export interface ResearchSubmission {
  id: string; // e.g. "RSP-2026-1042"
  title: string;
  authors: string[];
  institution: string;
  grantNumber: string;
  targetJournal: string;
  status: 'under_review' | 'approved' | 'action_required' | 'rejected';
  experimentIds: string[];
  experimentId?: string;
  doi?: string;
  submissionDate?: string;
  claims?: ClaimProof[];
  coverage: {
    totalMeasurements: number;
    verifiedMeasurements: number;
    totalProcessingEvents: number;
    verifiedProcessingEvents: number;
    finalizedDatasets: number;
    verifiedDatasets: number;
  };
  lastEvidenceEvent: string;
  integrityIssuesCount: number;
  leadVerifier: string;
  abstract: string;
}

export interface IntegrityAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  experimentId: string;
  experimentTitle: string;
  datasetName?: string;
  recordId?: string;
  timestamp: string;
  reason: string;
  expectedCommitment?: string;
  observedCommitment?: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export interface DashboardMetrics {
  activeExperiments: number;
  datasets: number;
  evidenceRecords: number;
  verificationIssues: number;
}
