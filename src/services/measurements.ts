import type { Measurement, EvidenceRecord } from '../types';
import { appState } from './api';
import {
  computeSha256,
  toCoolCommitment,
  generateEvidenceReceiptId,
  generateExecutionId,
} from '../lib/cryptoSimulation';

export async function getMeasurements(experimentId: string): Promise<Measurement[]> {
  return appState.getMeasurements(experimentId);
}

export interface AddMeasurementDto {
  experimentId: string;
  value: number;
  secondaryValue?: number;
  unit: string;
  parameter: string;
  instrument: string;
  trialNumber?: string;
}

export async function createMeasurement(data: AddMeasurementDto): Promise<Measurement> {
  const existing = appState.getMeasurements(data.experimentId);
  const nextTrialNum = (existing.length + 1).toString().padStart(2, '0');
  const now = new Date().toISOString();
  const id = `M-${data.experimentId.replace('EXP-2026-', '')}-${(existing.length + 1)
    .toString()
    .padStart(4, '0')}`;

  const payloadString = JSON.stringify({
    trial: nextTrialNum,
    val: data.value,
    unit: data.unit,
    inst: data.instrument,
    ts: now,
  });

  const payloadHash = await computeSha256(payloadString);
  const evidenceId = generateEvidenceReceiptId();

  const newMeasurement: Measurement = {
    id,
    experimentId: data.experimentId,
    trialNumber: data.trialNumber || nextTrialNum,
    timestamp: now,
    value: data.value,
    secondaryValue: data.secondaryValue,
    unit: data.unit,
    parameter: data.parameter,
    instrument: data.instrument,
    status: 'verified',
    evidenceId,
    rawPayloadHash: payloadHash,
  };

  appState.addMeasurement(data.experimentId, newMeasurement);

  // Add evidence record
  const allEvidence = appState.getEvidenceRecords(data.experimentId);
  const nextSeq = allEvidence.length + 1;

  appState.addEvidenceRecord({
    id: evidenceId,
    executionId: generateExecutionId(),
    experimentId: data.experimentId,
    eventType: 'measurement.recorded',
    sequence: nextSeq,
    issuedAt: now,
    metadataCommitment: toCoolCommitment(await computeSha256(`meta:${evidenceId}`)),
    inputCommitment: toCoolCommitment(
      await computeSha256(`sensor_input:${data.instrument}:${data.value}`)
    ),
    outputCommitment: toCoolCommitment(payloadHash),
    softwareIdentity: {
      name: 'ResRec-InSitu-Daemon',
      version: 'v2.4.1',
      binaryDigest: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      runtimeEnvironment: 'Linux x86_64 RT-PREEMPT',
    },
    verification: {
      binding: 'verified',
      signature: 'verified',
      transparency: 'verified',
      witnesses: 'verified',
      attestation: 'verified',
    },
    witnessCount: 4,
    witnessThreshold: 3,
    signerIdentity: `did:key:z6Mku...${data.instrument.replace(/\s+/g, '_')}`,
    payloadSummary: `Recorded trial ${newMeasurement.trialNumber}: ${data.value} ${data.unit} (${data.instrument})`,
  });

  return newMeasurement;
}

export interface RecordCorrectionDto {
  experimentId: string;
  measurementId: string;
  originalValue?: number;
  correctedValue: number;
  reason: string;
  supportingNote: string;
  recordedBy: string;
}

export async function recordCorrection(data: RecordCorrectionDto): Promise<{
  evidenceRecord: EvidenceRecord;
  evidenceId: string;
}> {
  const existingMeas = appState
    .getMeasurements(data.experimentId)
    .find((m) => m.id === data.measurementId);
  const origVal = data.originalValue ?? existingMeas?.value ?? 0;

  const now = new Date().toISOString();
  const corrPayload = JSON.stringify({
    targetId: data.measurementId,
    original: origVal,
    corrected: data.correctedValue,
    reason: data.reason,
    note: data.supportingNote,
    by: data.recordedBy,
    ts: now,
  });

  const corrHash = await computeSha256(corrPayload);
  const evidenceId = generateEvidenceReceiptId();

  // Non-destructive update in state
  appState.addCorrection(
    data.experimentId,
    data.measurementId,
    data.correctedValue,
    data.reason,
    data.supportingNote,
    evidenceId,
    data.recordedBy
  );

  // Generate distinct cryptographic evidence receipt linked to prior evidence record
  const allEvidence = appState.getEvidenceRecords(data.experimentId);
  const nextSeq = allEvidence.length + 1;

  const newRecord: EvidenceRecord = {
    id: evidenceId,
    executionId: generateExecutionId(),
    experimentId: data.experimentId,
    eventType: 'measurement.corrected',
    sequence: nextSeq,
    issuedAt: now,
    metadataCommitment: toCoolCommitment(await computeSha256(`corr_meta:${evidenceId}`)),
    inputCommitment: toCoolCommitment(await computeSha256(`orig_meas:${data.measurementId}`)),
    outputCommitment: toCoolCommitment(corrHash),
    softwareIdentity: {
      name: 'ResRec-Institutional-Console',
      version: 'v3.1.0',
      binaryDigest: 'sha256:821fa4401889c1d0b4920e8839ca17df91823ab498c11e74a819bb445012399e',
      runtimeEnvironment: 'Node.js 24.21.0 / Browser WebCrypto',
    },
    verification: {
      binding: 'verified',
      signature: 'verified',
      transparency: 'verified',
      witnesses: 'verified',
      attestation: 'verified',
    },
    witnessCount: 3,
    witnessThreshold: 3,
    signerIdentity: `did:key:z6Mk...${data.recordedBy.replace(/\s+/g, '_')}`,
    payloadSummary: `Correction recorded for ${data.measurementId} (${origVal} -> ${data.correctedValue}). Reason: ${data.reason}`,
  };

  appState.addEvidenceRecord(newRecord);

  return { evidenceRecord: newRecord, evidenceId };
}
