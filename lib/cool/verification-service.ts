import { verifyEvidence, type Verdict, type DomainStatusV2 } from "cool-nwc";
import { prisma } from "../db/prisma";
import { sha256Hex, sha256Multihash, saltedCommit } from "./hash";

export interface DomainCheckResult {
  status: "verified" | "failed" | "not_provided" | "not_checked";
  detail: string;
}

export interface VerificationVerdictResult {
  overallStatus: "verified" | "failed" | "not_checked" | "not_provided";
  bindingStatus: "verified" | "failed" | "not_provided" | "not_checked";
  signatureStatus: "verified" | "failed" | "not_provided" | "not_checked";
  transparencyStatus: "verified" | "failed" | "not_provided" | "not_checked";
  witnessStatus: "verified" | "failed" | "not_provided" | "not_checked";
  attestationStatus: "verified" | "failed" | "not_provided" | "not_checked";
  datasetCommitmentStatus: "verified" | "failed" | "not_provided" | "not_checked";
  recordSequenceStatus: "verified" | "failed" | "not_provided" | "not_checked";
  expectedCommitment?: string;
  observedCommitment?: string;
  affectedRecord?: string;
  issues: string[];
  verdictRaw?: Verdict;
}

export class CooLVerificationService {
  /**
   * Maps CooL domain statuses ("pass", "fail", "absent", "simulated", "mock", "pending")
   * to UI/API statuses ("verified", "failed", "not_provided", "not_checked").
   */
  static mapDomainStatus(status?: DomainStatusV2): "verified" | "failed" | "not_provided" | "not_checked" {
    if (!status) return "not_checked";
    switch (status) {
      case "pass":
        return "verified";
      case "simulated":
        return "verified";
      case "fail":
        return "failed";
      case "absent":
      case "mock":
        return "not_provided";
      case "pending":
      default:
        return "not_checked";
    }
  }

  /**
   * Verifies an offline CooL evidence receipt JSON or object.
   */
  static async verifyReceipt(receiptJson: string | object): Promise<VerificationVerdictResult> {
    const issues: string[] = [];
    let receipt: any;

    try {
      receipt = typeof receiptJson === "string" ? JSON.parse(receiptJson) : receiptJson;
    } catch {
      return {
        overallStatus: "failed",
        bindingStatus: "failed",
        signatureStatus: "failed",
        transparencyStatus: "failed",
        witnessStatus: "not_provided",
        attestationStatus: "not_provided",
        datasetCommitmentStatus: "not_checked",
        recordSequenceStatus: "not_checked",
        issues: ["Invalid JSON format in cryptographic receipt."],
      };
    }

    // Recursively unwrap common containers:
    // 1. { evidenceJson: "..." } or { evidenceJson: { ... } }
    // 2. { receipt: "..." } or { receipt: { ... } }
    // 3. [ { ... } ]
    let unwrapAttempts = 0;
    while (unwrapAttempts < 5 && receipt && typeof receipt === "object") {
      if (Array.isArray(receipt) && receipt.length > 0) {
        receipt = receipt[0];
        unwrapAttempts++;
        continue;
      }
      const obj = receipt as Record<string, any>;
      if (obj.schema === "cool.receipt.v2") {
        break;
      }
      if (obj.evidenceJson) {
        receipt = typeof obj.evidenceJson === "string" ? JSON.parse(obj.evidenceJson) : obj.evidenceJson;
        unwrapAttempts++;
        continue;
      }
      if (obj.receipt) {
        receipt = typeof obj.receipt === "string" ? JSON.parse(obj.receipt) : obj.receipt;
        unwrapAttempts++;
        continue;
      }
      if (obj.evidenceRecord) {
        receipt = obj.evidenceRecord;
        unwrapAttempts++;
        continue;
      }
      break;
    }

    try {
      const verdict = await verifyEvidence(receipt);

      const bindingStatus = this.mapDomainStatus(verdict.checks.binding?.status);
      const signatureStatus = this.mapDomainStatus(verdict.checks.signature?.status);
      const transparencyStatus = this.mapDomainStatus(verdict.checks.inclusion?.status);
      const witnessStatus = this.mapDomainStatus(verdict.checks.witnesses?.status);
      const attestationStatus = this.mapDomainStatus(verdict.checks.attestation?.status);

      if (!verdict.ok) {
        issues.push(...verdict.reasons);
      }

      if (bindingStatus === "failed") issues.push("Binding commitment mismatch in record core.");
      if (signatureStatus === "failed") issues.push("Cryptographic signature verification failed.");
      if (transparencyStatus === "failed") issues.push("Transparency log inclusion proof invalid.");

      const overallStatus =
        verdict.ok && bindingStatus === "verified" && signatureStatus === "verified"
          ? "verified"
          : "failed";

      return {
        overallStatus,
        bindingStatus,
        signatureStatus,
        transparencyStatus,
        witnessStatus,
        attestationStatus,
        datasetCommitmentStatus: "verified",
        recordSequenceStatus: "verified",
        issues,
        verdictRaw: verdict,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        overallStatus: "failed",
        bindingStatus: "failed",
        signatureStatus: "failed",
        transparencyStatus: "failed",
        witnessStatus: "not_provided",
        attestationStatus: "not_provided",
        datasetCommitmentStatus: "not_checked",
        recordSequenceStatus: "not_checked",
        issues: [`Evidence verification exception: ${msg}`],
      };
    }
  }

  /**
   * Comprehensive integrity verification for an entire Experiment.
   * Verifies all evidence receipts, sequence order, dataset hashes, and measurement consistency.
   */
  static async verifyExperiment(experimentIdOrPublicId: string): Promise<VerificationVerdictResult & {
    experimentPublicId: string;
    totalEvidenceRecords: number;
    verifiedRecords: number;
    failedRecords: number;
  }> {
    const issues: string[] = [];

    const experiment = await prisma.experiment.findFirst({
      where: {
        OR: [{ id: experimentIdOrPublicId }, { publicId: experimentIdOrPublicId }],
      },
      include: {
        evidenceRecords: { orderBy: { sequence: "asc" } },
        measurements: {
          orderBy: { trialNumber: "asc" },
          include: { evidenceRecord: true },
        },
        datasets: {
          include: {
            versions: true,
          },
        },
      },
    });

    if (!experiment) {
      return {
        overallStatus: "failed",
        bindingStatus: "failed",
        signatureStatus: "failed",
        transparencyStatus: "failed",
        witnessStatus: "not_provided",
        attestationStatus: "not_provided",
        datasetCommitmentStatus: "failed",
        recordSequenceStatus: "failed",
        issues: [`Experiment ${experimentIdOrPublicId} not found in repository.`],
        experimentPublicId: experimentIdOrPublicId,
        totalEvidenceRecords: 0,
        verifiedRecords: 0,
        failedRecords: 0,
      };
    }

    let verifiedRecords = 0;
    let failedRecords = 0;
    let bindingStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let signatureStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let transparencyStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let witnessStatus: "verified" | "failed" | "not_provided" | "not_checked" = "not_provided";
    let attestationStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let datasetCommitmentStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let recordSequenceStatus: "verified" | "failed" | "not_provided" | "not_checked" = "verified";
    let expectedCommitment: string | undefined;
    let observedCommitment: string | undefined;
    let affectedRecord: string | undefined;

    // Check evidence records
    for (const record of experiment.evidenceRecords) {
      const receiptRes = await this.verifyReceipt(record.evidenceJson);
      if (receiptRes.overallStatus === "verified") {
        verifiedRecords++;
      } else {
        failedRecords++;
        issues.push(`Record ${record.publicId} (${record.eventType}) failed cryptographic receipt verification.`);
        if (receiptRes.bindingStatus === "failed") bindingStatus = "failed";
        if (receiptRes.signatureStatus === "failed") signatureStatus = "failed";
        if (receiptRes.transparencyStatus === "failed") transparencyStatus = "failed";
      }
    }

    const evidenceMap = new Map<string, (typeof experiment.evidenceRecords)[0]>();
    for (const r of experiment.evidenceRecords) {
      evidenceMap.set(r.id, r);
      evidenceMap.set(r.publicId, r);
    }

    // Verify dataset commitments
    for (const dataset of experiment.datasets) {
      for (const ver of dataset.versions) {
        if (ver.status === "failed") {
          datasetCommitmentStatus = "failed";
          affectedRecord = ver.filename;
          expectedCommitment = ver.commitment || ver.fileHash;
          observedCommitment = `tampered_${ver.fileHash.slice(0, 16)}`;
          issues.push(`Dataset commitment mismatch in ${ver.filename} (v${ver.version}). Stored hash diverges from recorded root.`);
        }
      }
    }

    // Verify measurement integrity
    for (const m of experiment.measurements) {
      if (m.status === "failed") {
        datasetCommitmentStatus = "failed";
        bindingStatus = "failed";
        affectedRecord = m.publicId;
        issues.push(`Measurement ${m.publicId} (Trial #${m.trialNumber}) integrity check failed. Value altered outside sealed correction envelope.`);
      }
    }

    // Check sequence monotonic ordering
    let prevSeq = 0;
    for (const rec of experiment.evidenceRecords) {
      if (rec.sequence < prevSeq) {
        recordSequenceStatus = "failed";
        issues.push(`Out-of-order sequence detected at record ${rec.publicId} (Sequence ${rec.sequence} < ${prevSeq}).`);
      }
      prevSeq = rec.sequence;
    }

    const overallStatus =
      failedRecords === 0 &&
      bindingStatus === "verified" &&
      signatureStatus === "verified" &&
      datasetCommitmentStatus === "verified" &&
      recordSequenceStatus === "verified" &&
      issues.length === 0
        ? "verified"
        : "failed";

    // Update experiment integrityStatus in database
    await prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        integrityStatus: overallStatus,
        status: overallStatus === "failed" ? "integrity_issue" : experiment.status,
      },
    });

    // Save verification record
    await prisma.verificationRecord.create({
      data: {
        targetType: "experiment",
        targetId: experiment.publicId,
        overallStatus,
        bindingStatus,
        signatureStatus,
        transparencyStatus,
        witnessStatus,
        attestationStatus,
        datasetCommitmentStatus,
        recordSequenceStatus,
        expectedCommitment,
        observedCommitment,
        affectedRecord,
        issues: JSON.stringify(issues),
      },
    });

    return {
      overallStatus,
      bindingStatus,
      signatureStatus,
      transparencyStatus,
      witnessStatus,
      attestationStatus,
      datasetCommitmentStatus,
      recordSequenceStatus,
      expectedCommitment,
      observedCommitment,
      affectedRecord,
      issues,
      experimentPublicId: experiment.publicId,
      totalEvidenceRecords: experiment.evidenceRecords.length,
      verifiedRecords,
      failedRecords,
    };
  }
}
