import type { Experiment } from '../types';
import { appState } from './api';
import { computeSha256, toCoolCommitment, generateEvidenceReceiptId, generateExecutionId } from '../lib/cryptoSimulation';

export async function getExperiments(): Promise<Experiment[]> {
  return appState.getExperiments();
}

export async function getExperiment(id: string): Promise<Experiment | undefined> {
  return appState.getExperiment(id);
}

export interface CreateExperimentDto {
  id?: string;
  title: string;
  principalInvestigator: string;
  researchGroup: string;
  institution: string;
  instrument: string;
  sample: string;
  calibrationStatus: string;
  protocol: string;
  researchObjective: string;
  experimentalSetup: string;
  primaryUnit: string;
  primaryParameter: string;
}

export async function createExperiment(data: CreateExperimentDto): Promise<Experiment> {
  const count = appState.getExperiments().length + 43;
  const id = data.id || `EXP-2026-${count.toString().padStart(4, '0')}`;
  const now = new Date().toISOString();

  const newExperiment: Experiment = {
    id,
    title: data.title,
    principalInvestigator: data.principalInvestigator,
    researchGroup: data.researchGroup,
    institution: data.institution,
    instrument: data.instrument,
    sample: data.sample,
    calibrationStatus: data.calibrationStatus,
    protocol: data.protocol,
    researchObjective: data.researchObjective,
    experimentalSetup: data.experimentalSetup,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    recordCount: 0,
    datasetCount: 0,
    correctionsCount: 0,
    primaryUnit: data.primaryUnit,
    primaryParameter: data.primaryParameter,
    integrity: {
      status: 'verified',
      evidenceRecordsVerified: true,
      datasetCommitmentVerified: true,
      recordSequenceVerified: true,
      signaturesVerified: true,
      lastVerifiedAt: now,
      receiptCount: 1,
      witnessSignatures: 4,
      witnessThreshold: 3,
      hardwareAttestation: 'not_provided',
      transparencyInclusion: 'verified',
      softwareIdentityDigest: 'sha256:4d8721c0b395ae1115b9c2a382d6148386a341b52a65d56b0578619bc7e7b89f',
    },
  };

  appState.addExperiment(newExperiment);

  // Generate genesis evidence receipt
  const genesisEvidenceId = generateEvidenceReceiptId();
  const metaHash = await computeSha256(JSON.stringify(newExperiment));

  appState.addEvidenceRecord({
    id: genesisEvidenceId,
    executionId: generateExecutionId(),
    experimentId: id,
    eventType: 'experiment.genesis',
    sequence: 1,
    issuedAt: now,
    metadataCommitment: toCoolCommitment(metaHash),
    inputCommitment: toCoolCommitment(await computeSha256(data.protocol)),
    outputCommitment: toCoolCommitment(metaHash),
    softwareIdentity: {
      name: 'ResRec-Core-Engine',
      version: 'v2.4.1',
      binaryDigest: 'sha256:4d8721c0b395ae1115b9c2a382d6148386a341b52a65d56b0578619bc7e7b89f',
      runtimeEnvironment: 'Linux x86_64 Node.js 24.21.0',
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
    signerIdentity: `did:key:z6Mku...${data.principalInvestigator.replace(/\s+/g, '_')}`,
    payloadSummary: `Genesis seal for research protocol: ${data.protocol}`,
  });

  return newExperiment;
}
