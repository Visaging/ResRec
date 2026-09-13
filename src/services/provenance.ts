import type { ProvenanceNode } from '../types';
import { appState } from './api';

export async function getProvenanceNodes(experimentId: string): Promise<ProvenanceNode[]> {
  return appState.getProvenanceNodes(experimentId);
}
