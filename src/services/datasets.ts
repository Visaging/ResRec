import type { Dataset } from '../types';
import { appState } from './api';
import {
  computeSha256,
  toCoolCommitment,
  generateEvidenceReceiptId,
  generateExecutionId,
} from '../lib/cryptoSimulation';

export async function getDatasets(experimentId?: string): Promise<Dataset[]> {
  return appState.getDatasets(experimentId);
}

export async function getDataset(id: string): Promise<Dataset | undefined> {
  return appState.getDataset(id);
}

export interface ImportDatasetDto {
  experimentId: string;
  fileName: string;
  content: string;
  description: string;
  version?: string;
}

export async function importDataset(data: ImportDatasetDto): Promise<Dataset> {
  const sha256 = await computeSha256(data.content);
  const coolCommitment = toCoolCommitment(sha256);
  const evidenceId = generateEvidenceReceiptId();
  const now = new Date().toISOString();

  // Basic CSV parsing for preview
  const lines = data.content.trim().split('\n');
  const headers = lines[0] ? lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '')) : [];
  const previewRows = lines.slice(1, 6).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h] = vals[i] ?? '';
    });
    return rowObj;
  });

  const recordCount = Math.max(0, lines.length - 1);
  const sizeBytes = new Blob([data.content]).size;
  const sizeFormatted =
    sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(sizeBytes / 1024).toFixed(1)} KB`;

  const newDataset: Dataset = {
    id: `DS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    experimentId: data.experimentId,
    fileName: data.fileName,
    version: data.version || 'v1.0',
    sha256,
    coolCommitment,
    recordCount,
    sizeBytes,
    sizeFormatted,
    createdAt: now,
    uploadedAt: now,
    updatedAt: now,
    status: 'verified',
    evidenceId,
    description: data.description,
    headers,
    previewRows,
  };

  appState.addDataset(newDataset);

  // Issue evidence record
  const allEvidence = appState.getEvidenceRecords(data.experimentId);
  const nextSeq = allEvidence.length + 1;

  appState.addEvidenceRecord({
    id: evidenceId,
    executionId: generateExecutionId(),
    experimentId: data.experimentId,
    eventType: 'dataset.committed',
    sequence: nextSeq,
    issuedAt: now,
    metadataCommitment: toCoolCommitment(await computeSha256(`dataset_meta:${newDataset.id}`)),
    inputCommitment: toCoolCommitment(sha256),
    outputCommitment: coolCommitment,
    softwareIdentity: {
      name: 'ResRec-DataSealer-Engine',
      version: 'v2.4.1',
      binaryDigest: 'sha256:4d8721c0b395ae1115b9c2a382d6148386a341b52a65d56b0578619bc7e7b89f',
      runtimeEnvironment: 'Node.js 24.21.0 / Browser WebCrypto',
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
    signerIdentity: `did:key:z6Mkp...${data.experimentId}`,
    payloadSummary: `Committed dataset ${newDataset.fileName} (${newDataset.version}) with ${newDataset.recordCount} records. Hash: ${sha256.substring(0, 16)}...`,
  });

  return newDataset;
}
