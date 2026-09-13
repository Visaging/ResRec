import type { ResearchSubmission } from '../types';
import { appState } from './api';

export async function getSubmissions(): Promise<ResearchSubmission[]> {
  return appState.getSubmissions();
}

export async function getSubmission(id: string): Promise<ResearchSubmission | undefined> {
  return appState.getSubmission(id);
}
