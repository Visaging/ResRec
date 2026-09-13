import type { EvidenceRecord } from '../types';
import { appState } from './api';

export async function getEvidenceRecords(experimentId?: string): Promise<EvidenceRecord[]> {
  return appState.getEvidenceRecords(experimentId);
}

export async function getEvidenceRecord(id: string): Promise<EvidenceRecord | undefined> {
  return appState.getEvidenceRecord(id);
}
