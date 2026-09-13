import type { VerificationResult, VerificationStatus } from '../types';
import { appState } from './api';

export type VerificationCheckResult = VerificationResult;

export async function verifyReceipt(receiptInput: string | object): Promise<VerificationResult> {
  let parsed: any;
  let rawJson = '';

  try {
    if (typeof receiptInput === 'string') {
      rawJson = receiptInput;
      parsed = JSON.parse(receiptInput);
    } else {
      rawJson = JSON.stringify(receiptInput, null, 2);
      parsed = receiptInput;
    }
  } catch {
    // If not JSON, assume receipt ID was passed
    rawJson = String(receiptInput);
    parsed = { receiptId: String(receiptInput) };
  }

  const isTampered = appState.getIsTamperSimulated();
  const receiptId = parsed?.id || parsed?.receiptId || 'REC-7F82-110C';

  // Detect explicit commitment mismatch from uploaded JSON
  const hasUploadedMismatch =
    parsed?.outputCommitment &&
    parsed?.expectedCommitment &&
    parsed.outputCommitment !== parsed.expectedCommitment;

  // If tamper simulation is active or uploaded JSON has mismatch, return the cryptographic failure breakdown
  if (isTampered || hasUploadedMismatch) {
    const tamperDetails = appState.getTamperDetails();
    return {
      receiptId,
      verifiedAt: new Date().toISOString(),
      overallStatus: 'failed',
      checks: {
        evidenceIntegrity: 'failed' as VerificationStatus,
        signature: 'verified' as VerificationStatus,
        recordBinding: 'failed' as VerificationStatus,
        transparencyInclusion: 'verified' as VerificationStatus,
        datasetCommitment: 'failed' as VerificationStatus,
        witnessConsensus: 'verified' as VerificationStatus,
        hardwareAttestation: 'not_provided' as VerificationStatus,
        postRecordingModification: 'detected',
      },
      experimentId: parsed?.experimentId || 'EXP-2026-0042',
      datasetName: parsed?.datasetName || 'thermal-cycling-042.csv',
      expectedCommitment:
        parsed?.expectedCommitment ||
        'mh:sha256:7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd',
      observedCommitment:
        parsed?.outputCommitment ||
        tamperDetails.observedCommitment ||
        'mh:sha256:2b91ac05e2f3b4d5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
      affectedRecordId: parsed?.affectedRecordId || tamperDetails.recordId || 'REC-7F82-110C',
      mismatchReason:
        `The submitted dataset does not match the commitment recorded in the evidence receipt (Trial 01 value tampered to ${tamperDetails.alteredValue}).`,
      rawReceiptJson: rawJson,
    };
  }

  // Normal verified state
  return {
    receiptId,
    verifiedAt: new Date().toISOString(),
    overallStatus: 'verified',
    checks: {
      evidenceIntegrity: 'verified' as VerificationStatus,
      signature: 'verified' as VerificationStatus,
      recordBinding: 'verified' as VerificationStatus,
      transparencyInclusion: 'verified' as VerificationStatus,
      datasetCommitment: 'verified' as VerificationStatus,
      witnessConsensus: 'verified' as VerificationStatus,
      hardwareAttestation: 'not_provided' as VerificationStatus,
      postRecordingModification: 'not_detected',
    },
    experimentId: parsed.experimentId || 'EXP-2026-0042',
    datasetName: 'thermal-cycling-042.csv',
    expectedCommitment:
      'mh:sha256:7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd',
    observedCommitment:
      'mh:sha256:7f3a88c24f61e791b8d29c3a078e4745db7a884ef928e086118dbe1542f491bd',
    rawReceiptJson: rawJson,
  };
}
