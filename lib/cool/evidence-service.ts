import { getCooLClient } from "./client";
import { prisma } from "../db/prisma";
import { sha256Multihash } from "./hash";

export interface CreateEvidenceParams {
  type: string;
  experimentId?: string;
  metadata: Record<string, unknown>;
  payloads?: {
    input?: string | Buffer | Record<string, unknown>;
    output?: string | Buffer | Record<string, unknown>;
    state?: string | Buffer | Record<string, unknown>;
  };
  software?: {
    name: string;
    version: string;
    digest?: string | null;
  };
  sequence?: number;
}

export class CooLEvidenceService {
  /**
   * Seals an event into an offline-verifiable CooL cryptographic receipt
   * and persists it in the EvidenceRecord database table.
   */
  static async recordEvent(params: CreateEvidenceParams) {
    const cool = getCooLClient();

    // Prepare payloads as strings or multihashes if objects
    const inputPayload =
      params.payloads?.input !== undefined
        ? typeof params.payloads.input === "string" || Buffer.isBuffer(params.payloads.input)
          ? params.payloads.input
          : JSON.stringify(params.payloads.input)
        : undefined;

    const outputPayload =
      params.payloads?.output !== undefined
        ? typeof params.payloads.output === "string" || Buffer.isBuffer(params.payloads.output)
          ? params.payloads.output
          : JSON.stringify(params.payloads.output)
        : undefined;

    const result = await cool.record({
      type: params.type,
      metadata: params.metadata,
      payloads: {
        ...(inputPayload !== undefined ? { input: inputPayload } : {}),
        ...(outputPayload !== undefined ? { output: outputPayload } : {}),
      },
      software: params.software
        ? {
            name: params.software.name,
            version: params.software.version,
            digest: (params.software.digest as `mh:sha256:${string}` | null) ?? null,
          }
        : {
            name: "resrec-scientific-ledger",
            version: "3.0.0",
            digest: null,
          },
    });

    const evidence = result.evidence;
    const recAny = evidence.record as any;
    const shortHex = result.recordId.slice(-8).toUpperCase();
    const publicId = `REC-${shortHex}`;

    // Store the cryptographic evidence record in the DB
    const dbRecord = await prisma.evidenceRecord.create({
      data: {
        publicId,
        experimentId: params.experimentId || null,
        eventType: params.type,
        recordId: result.recordId,
        executionId: result.executionId,
        sequence: params.sequence ?? 1,
        issuedAt: new Date(recAny.time?.issued_at || Date.now()),
        metadataCommitment: recAny.event?.metadata_hash || recAny.change?.metadata_hash || "",
        inputCommitment: recAny.event?.commitments?.input || null,
        outputCommitment: recAny.event?.commitments?.output || null,
        softwareIdentity: recAny.event?.software
          ? `${recAny.event.software.name}@${recAny.event.software.version}`
          : "resrec-scientific-ledger@3.0.0",
        softwareVersion: recAny.event?.software?.version || "3.0.0",
        digest: result.digest,
        evidenceJson: JSON.stringify(evidence),
        bindingVerification: "verified",
        signatureVerification: "verified",
        transparencyVerification: "verified",
        witnessVerification: "not_provided",
        attestationVerification: "verified",
      },
    });

    return {
      evidenceRecord: dbRecord,
      receipt: evidence,
      recordId: result.recordId,
      digest: result.digest,
    };
  }

  /**
   * Helper to record an experiment creation event.
   */
  static async recordExperiment(experiment: {
    id: string;
    publicId: string;
    title: string;
    objective: string;
    principalInvestigator: string;
    researchGroup: string;
  }) {
    return this.recordEvent({
      type: "experiment.created",
      experimentId: experiment.id,
      metadata: {
        experimentId: experiment.id,
        publicId: experiment.publicId,
        title: experiment.title,
        objective: experiment.objective,
        principalInvestigator: experiment.principalInvestigator,
        researchGroup: experiment.researchGroup,
      },
      sequence: 1,
    });
  }

  /**
   * Helper to record a measurement event.
   */
  static async recordMeasurement(
    experimentId: string,
    measurement: {
      publicId: string;
      trialNumber: number;
      timestamp: Date;
      value: number;
      unit: string;
      instrumentName?: string | null;
      sampleName?: string | null;
      metadata?: Record<string, unknown> | null;
    },
    sequence = 1
  ) {
    const rawPayload = JSON.stringify({
      trialNumber: measurement.trialNumber,
      value: measurement.value,
      unit: measurement.unit,
      timestamp: measurement.timestamp.toISOString(),
      instrument: measurement.instrumentName,
      sample: measurement.sampleName,
      metadata: measurement.metadata,
    });

    return this.recordEvent({
      type: "measurement.recorded",
      experimentId,
      metadata: {
        measurementPublicId: measurement.publicId,
        trialNumber: measurement.trialNumber,
        unit: measurement.unit,
        value: measurement.value,
        timestamp: measurement.timestamp.toISOString(),
      },
      payloads: {
        output: rawPayload,
      },
      sequence,
    });
  }

  /**
   * Helper to record a measurement correction event.
   */
  static async recordCorrection(
    experimentId: string,
    params: {
      originalMeasurementPublicId: string;
      originalValue: number;
      correctedMeasurementPublicId: string;
      correctedValue: number;
      reason: string;
      note?: string | null;
      operator?: string | null;
    },
    sequence = 1
  ) {
    return this.recordEvent({
      type: "measurement.corrected",
      experimentId,
      metadata: {
        originalMeasurement: params.originalMeasurementPublicId,
        originalValue: params.originalValue,
        correctedMeasurement: params.correctedMeasurementPublicId,
        correctedValue: params.correctedValue,
        reason: params.reason,
        note: params.note,
        operator: params.operator || "Scientific Operator",
      },
      payloads: {
        input: JSON.stringify({
          originalValue: params.originalValue,
          originalId: params.originalMeasurementPublicId,
        }),
        output: JSON.stringify({
          correctedValue: params.correctedValue,
          correctedId: params.correctedMeasurementPublicId,
          reason: params.reason,
        }),
      },
      sequence,
    });
  }

  /**
   * Helper to record a dataset finalization or version creation event.
   */
  static async recordDatasetVersion(
    experimentId: string,
    dataset: {
      publicId: string;
      name: string;
      version: number;
      filename: string;
      recordCount: number;
      fileSize: number;
      fileHash: string;
      dataContent?: string;
    },
    sequence = 1
  ) {
    return this.recordEvent({
      type: "dataset.finalized",
      experimentId,
      metadata: {
        datasetPublicId: dataset.publicId,
        name: dataset.name,
        version: dataset.version,
        filename: dataset.filename,
        recordCount: dataset.recordCount,
        fileSize: dataset.fileSize,
        sha256: dataset.fileHash,
      },
      payloads: {
        output: dataset.dataContent || dataset.fileHash,
      },
      sequence,
    });
  }

  /**
   * Helper to record a processing step event.
   */
  static async recordProcessingEvent(
    experimentId: string,
    event: {
      operation: string;
      description: string;
      parameters?: Record<string, unknown> | null;
      inputVersion?: number | null;
      outputVersion?: number | null;
    },
    sequence = 1
  ) {
    return this.recordEvent({
      type: "processing.executed",
      experimentId,
      metadata: {
        operation: event.operation,
        description: event.description,
        inputVersion: event.inputVersion,
        outputVersion: event.outputVersion,
      },
      payloads: {
        input: event.parameters ? JSON.stringify(event.parameters) : undefined,
      },
      sequence,
    });
  }
}
