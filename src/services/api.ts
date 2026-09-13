import type {
  Experiment,
  Measurement,
  Dataset,
  EvidenceRecord,
  ProvenanceNode,
  ResearchSubmission,
  IntegrityAlert,
  DashboardMetrics,
} from '../types';
import {
  INITIAL_EXPERIMENTS,
  INITIAL_MEASUREMENTS,
  INITIAL_DATASETS,
  INITIAL_EVIDENCE_RECORDS,
  INITIAL_PROVENANCE_NODES,
  INITIAL_SUBMISSIONS,
  INITIAL_ALERTS,
} from './mockData';
import { computeSha256Sync, toCoolCommitment } from '../lib/cryptoSimulation';

// Local storage keys
const STORAGE_KEYS = {
  EXPERIMENTS: 'resrec_experiments_v1',
  MEASUREMENTS: 'resrec_measurements_v1',
  DATASETS: 'resrec_datasets_v1',
  EVIDENCE: 'resrec_evidence_v1',
  PROVENANCE: 'resrec_provenance_v1',
  SUBMISSIONS: 'resrec_submissions_v1',
  ALERTS: 'resrec_alerts_v1',
  TAMPER_ACTIVE: 'resrec_tamper_active_v1',
};

class StateStore {
  private experiments: Experiment[] = [];
  private measurements: Record<string, Measurement[]> = {};
  private datasets: Dataset[] = [];
  private evidenceRecords: EvidenceRecord[] = [];
  private provenanceNodes: Record<string, ProvenanceNode[]> = {};
  private submissions: ResearchSubmission[] = [];
  private alerts: IntegrityAlert[] = [];
  private isTamperSimulated: boolean = false;
  private tamperAlteredValue: number = 38.2;
  private tamperObservedCommitment: string = 'mh:sha256:2b91ac05e2f3b4d5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9';
  private tamperRecordId: string = 'REC-7F82-110C';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const exp = localStorage.getItem(STORAGE_KEYS.EXPERIMENTS);
      this.experiments = exp ? JSON.parse(exp) : [...INITIAL_EXPERIMENTS];

      const meas = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      const parsedMeas = meas ? JSON.parse(meas) : {};
      this.measurements = { ...INITIAL_MEASUREMENTS, ...parsedMeas };

      const ds = localStorage.getItem(STORAGE_KEYS.DATASETS);
      const parsedDs: Dataset[] = ds ? JSON.parse(ds) : [];
      const dsMap = new Map<string, Dataset>();
      INITIAL_DATASETS.forEach((d) => dsMap.set(d.id, d));
      parsedDs.forEach((d) => dsMap.set(d.id, d));
      this.datasets = Array.from(dsMap.values());

      const ev = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
      const parsedEv: EvidenceRecord[] = ev ? JSON.parse(ev) : [];
      const evMap = new Map<string, EvidenceRecord>();
      INITIAL_EVIDENCE_RECORDS.forEach((e) => evMap.set(e.id, e));
      parsedEv.forEach((e) => evMap.set(e.id, e));
      this.evidenceRecords = Array.from(evMap.values());

      const prov = localStorage.getItem(STORAGE_KEYS.PROVENANCE);
      const parsedProv = prov ? JSON.parse(prov) : {};
      this.provenanceNodes = { ...INITIAL_PROVENANCE_NODES, ...parsedProv };

      const sub = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      this.submissions = sub ? JSON.parse(sub) : [...INITIAL_SUBMISSIONS];

      const alt = localStorage.getItem(STORAGE_KEYS.ALERTS);
      this.alerts = alt ? JSON.parse(alt) : [...INITIAL_ALERTS];

      const tm = localStorage.getItem(STORAGE_KEYS.TAMPER_ACTIVE);
      this.isTamperSimulated = tm ? JSON.parse(tm) : false;
    } catch {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.experiments = JSON.parse(JSON.stringify(INITIAL_EXPERIMENTS));
    this.measurements = JSON.parse(JSON.stringify(INITIAL_MEASUREMENTS));
    this.datasets = JSON.parse(JSON.stringify(INITIAL_DATASETS));
    this.evidenceRecords = JSON.parse(JSON.stringify(INITIAL_EVIDENCE_RECORDS));
    this.provenanceNodes = JSON.parse(JSON.stringify(INITIAL_PROVENANCE_NODES));
    this.submissions = JSON.parse(JSON.stringify(INITIAL_SUBMISSIONS));
    this.alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    this.isTamperSimulated = false;
    this.saveState();
    this.notify();
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPERIMENTS, JSON.stringify(this.experiments));
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(this.measurements));
      localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(this.datasets));
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(this.evidenceRecords));
      localStorage.setItem(STORAGE_KEYS.PROVENANCE, JSON.stringify(this.provenanceNodes));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_KEYS.TAMPER_ACTIVE, JSON.stringify(this.isTamperSimulated));
    } catch {
      // ignore storage quota errors
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Experiments
  public getExperiments(): Experiment[] {
    return [...this.experiments];
  }

  public getExperiment(id: string): Experiment | undefined {
    return this.experiments.find((e) => e.id === id);
  }

  public addExperiment(experiment: Experiment) {
    this.experiments.unshift(experiment);
    this.saveState();
    this.notify();
  }

  public updateExperiment(id: string, updates: Partial<Experiment>) {
    this.experiments = this.experiments.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    this.saveState();
    this.notify();
  }

  // Measurements
  public getMeasurements(experimentId: string): Measurement[] {
    let list = this.measurements[experimentId];
    if ((!list || list.length === 0) && INITIAL_MEASUREMENTS[experimentId]) {
      this.measurements[experimentId] = JSON.parse(JSON.stringify(INITIAL_MEASUREMENTS[experimentId]));
      list = this.measurements[experimentId];
    }
    list = list || [];
    if (this.isTamperSimulated && experimentId === 'EXP-2026-0042') {
      return list.map((m) => {
        if (m.trialNumber === '01') {
          return { ...m, value: this.tamperAlteredValue, status: 'flagged' };
        }
        return m;
      });
    }
    return [...list];
  }

  public addMeasurement(experimentId: string, measurement: Measurement) {
    if (!this.measurements[experimentId]) {
      this.measurements[experimentId] = [];
    }
    this.measurements[experimentId].push(measurement);

    const exp = this.getExperiment(experimentId);
    if (exp) {
      const stats = exp.stats || {
        totalMeasurements: 0,
        totalDatasets: 0,
        totalEvidenceRecords: 0,
        totalCorrections: 0,
      };
      this.updateExperiment(experimentId, {
        recordCount: this.measurements[experimentId].length,
        stats: {
          ...stats,
          totalMeasurements: this.measurements[experimentId].length,
          totalEvidenceRecords: stats.totalEvidenceRecords + 1,
        },
      });
    }

    this.saveState();
    this.notify();
  }

  public addCorrection(
    experimentId: string,
    measurementId: string,
    correctedValue: number,
    reason: string,
    supportingNote: string,
    evidenceId: string,
    recordedBy: string
  ) {
    const list = this.measurements[experimentId];
    if (!list) return;

    const idx = list.findIndex((m) => m.id === measurementId);
    if (idx === -1) return;

    const current = list[idx];
    const correction = {
      correctionId: `CORR-${experimentId.replace('EXP-', '')}-${Date.now().toString().slice(-4)}`,
      correctedValue,
      recordedAt: new Date().toISOString(),
      reason,
      supportingNote,
      evidenceId,
      recordedBy,
    };

    list[idx] = {
      ...current,
      value: correctedValue,
      status: 'corrected',
      correction,
    };

    const exp = this.getExperiment(experimentId);
    if (exp) {
      const stats = exp.stats || {
        totalMeasurements: 0,
        totalDatasets: 0,
        totalEvidenceRecords: 0,
        totalCorrections: 0,
      };
      this.updateExperiment(experimentId, {
        correctionsCount: (exp.correctionsCount || 0) + 1,
        stats: {
          ...stats,
          totalCorrections: stats.totalCorrections + 1,
          totalEvidenceRecords: stats.totalEvidenceRecords + 1,
        },
      });
    }

    this.saveState();
    this.notify();
  }

  // Datasets
  public getDatasets(experimentId?: string): Dataset[] {
    if (experimentId) {
      let list = this.datasets.filter((d) => d.experimentId === experimentId);
      if (list.length === 0) {
        const defaults = INITIAL_DATASETS.filter((d) => d.experimentId === experimentId);
        if (defaults.length > 0) {
          defaults.forEach((d) => {
            if (!this.datasets.some((existing) => existing.id === d.id)) {
              this.datasets.push(d);
            }
          });
          list = defaults;
        }
      }
      return list;
    }
    return [...this.datasets];
  }

  public getDataset(id: string): Dataset | undefined {
    return this.datasets.find((d) => d.id === id);
  }

  public addDataset(dataset: Dataset) {
    this.datasets.unshift(dataset);
    const exp = this.getExperiment(dataset.experimentId);
    if (exp) {
      const stats = exp.stats || {
        totalMeasurements: 0,
        totalDatasets: 0,
        totalEvidenceRecords: 0,
        totalCorrections: 0,
      };
      this.updateExperiment(dataset.experimentId, {
        datasetCount: (exp.datasetCount || 0) + 1,
        stats: {
          ...stats,
          totalDatasets: stats.totalDatasets + 1,
          totalEvidenceRecords: stats.totalEvidenceRecords + 1,
        },
      });
    }
    this.saveState();
    this.notify();
  }

  public tamperDatasetDirectly(
    datasetId: string,
    updatedPreviewRows: Record<string, string>[],
    alteredValueSummary: string = 'In-place dataset cell edit'
  ) {
    const ds = this.datasets.find((d) => d.id === datasetId);
    if (!ds) return;

    const headers = ds.headers || Object.keys(updatedPreviewRows[0] || {});
    const rows = updatedPreviewRows.map((r) =>
      headers.map((h) => `${r[h] ?? ''}`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const computedHash = computeSha256Sync(csv);
    const computedCommitment = toCoolCommitment(computedHash);

    // Alter the dataset in-place WITHOUT creating a new evidence record
    ds.previewRows = updatedPreviewRows;
    ds.sha256 = computedHash;
    ds.coolCommitment = computedCommitment;
    ds.status = 'mismatch';
    ds.isTampered = true;

    // Set tamper state flags
    this.isTamperSimulated = true;
    this.tamperObservedCommitment = computedCommitment;
    this.tamperRecordId = ds.evidenceId;

    const exp = this.getExperiment(ds.experimentId);

    // Log critical alert
    const alert: IntegrityAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      severity: 'critical',
      title: 'Dataset In-Place Modification Detected',
      experimentId: ds.experimentId,
      experimentTitle: exp?.title || ds.experimentId,
      datasetName: ds.fileName,
      recordId: ds.evidenceId,
      timestamp: new Date().toISOString(),
      reason: `Dataset ${ds.fileName} modified in-place (${alteredValueSummary}) without CooL witness consensus.`,
      expectedCommitment: ds.coolCommitment,
      observedCommitment: computedCommitment,
      status: 'open',
    };
    this.alerts.unshift(alert);

    this.saveState();
    this.notify();
  }

  // Evidence
  public getEvidenceRecords(experimentId?: string): EvidenceRecord[] {
    if (experimentId) {
      let list = this.evidenceRecords.filter((e) => e.experimentId === experimentId);
      if (list.length === 0) {
        const defaults = INITIAL_EVIDENCE_RECORDS.filter((e) => e.experimentId === experimentId);
        if (defaults.length > 0) {
          defaults.forEach((e) => {
            if (!this.evidenceRecords.some((existing) => existing.id === e.id)) {
              this.evidenceRecords.push(e);
            }
          });
          list = defaults;
        }
      }
      return list;
    }
    return [...this.evidenceRecords];
  }

  public getEvidenceRecord(id: string): EvidenceRecord | undefined {
    return this.evidenceRecords.find((e) => e.id === id);
  }

  public addEvidenceRecord(record: EvidenceRecord) {
    this.evidenceRecords.unshift(record);
    this.saveState();
    this.notify();
  }

  // Provenance
  public getProvenanceNodes(experimentId: string): ProvenanceNode[] {
    let list = this.provenanceNodes[experimentId];
    if ((!list || list.length === 0) && INITIAL_PROVENANCE_NODES[experimentId]) {
      this.provenanceNodes[experimentId] = JSON.parse(JSON.stringify(INITIAL_PROVENANCE_NODES[experimentId]));
      list = this.provenanceNodes[experimentId];
    }
    return list || [];
  }

  public addProvenanceNode(experimentId: string, node: ProvenanceNode) {
    if (!this.provenanceNodes[experimentId]) {
      this.provenanceNodes[experimentId] = [];
    }
    this.provenanceNodes[experimentId].push(node);
    this.saveState();
    this.notify();
  }

  // Submissions
  public getSubmissions(): ResearchSubmission[] {
    return [...this.submissions];
  }

  public getSubmission(id?: string): ResearchSubmission | undefined {
    if (!id) return this.submissions[0];
    return this.submissions.find((s) => s.id === id);
  }

  // Alerts
  public getAlerts(): IntegrityAlert[] {
    return [...this.alerts];
  }

  public dismissAlert(id: string) {
    this.alerts = this.alerts.map((a) => (a.id === id ? { ...a, status: 'dismissed' } : a));
    this.saveState();
    this.notify();
  }

  // Dashboard Metrics
  public getDashboardMetrics(): DashboardMetrics {
    const totalExp = this.experiments.length;
    const totalDs = this.datasets.length;
    const totalEv = this.evidenceRecords.length + 1836;
    const issues = this.alerts.filter((a) => a.status === 'open' && a.severity !== 'info').length;

    return {
      activeExperiments: totalExp,
      datasets: totalDs,
      evidenceRecords: totalEv,
      verificationIssues: this.isTamperSimulated ? issues + 1 : issues,
    };
  }

  // Tamper Simulation
  public getIsTampered(): boolean {
    return this.isTamperSimulated;
  }

  public getIsTamperSimulated(): boolean {
    return this.isTamperSimulated;
  }

  public setTampered(
    tamper: boolean,
    alteredValue?: number,
    calculatedCommitment?: string,
    recordId?: string
  ) {
    this.isTamperSimulated = tamper;
    if (alteredValue !== undefined) this.tamperAlteredValue = alteredValue;
    if (calculatedCommitment) this.tamperObservedCommitment = calculatedCommitment;
    if (recordId) this.tamperRecordId = recordId;
    this.saveState();
    this.notify();
  }

  public getTamperDetails() {
    return {
      isTampered: this.isTamperSimulated,
      alteredValue: this.tamperAlteredValue,
      observedCommitment: this.tamperObservedCommitment,
      recordId: this.tamperRecordId,
    };
  }

  public setTamperSimulation(tamper: boolean) {
    this.isTamperSimulated = tamper;
    this.saveState();
    this.notify();
  }

  public resetTamper() {
    this.isTamperSimulated = false;
    this.saveState();
    this.notify();
  }
}

export const appState = new StateStore();
