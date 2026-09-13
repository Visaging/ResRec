import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
      include: {
        institution: true,
        measurements: {
          orderBy: { trialNumber: "asc" },
          include: {
            evidenceRecord: true,
            correctionsAsOrig: { include: { correctedMeasurement: true } },
            correctionsAsCorr: { include: { originalMeasurement: true } },
          },
        },
        datasets: {
          include: {
            versions: {
              orderBy: { version: "asc" },
              include: { inputEvents: true, outputEvents: true },
            },
          },
        },
        processingEvents: {
          orderBy: { createdAt: "asc" },
          include: { inputVersion: true, outputVersion: true },
        },
        analyses: {
          include: { results: true, inputDatasetVersion: true },
        },
        results: true,
        submissions: true,
        evidenceRecords: { orderBy: { sequence: "asc" } },
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    interface ProvenanceNode {
      id: string;
      type: "experiment" | "sample" | "instrument" | "measurement" | "correction" | "dataset_version" | "processing" | "analysis" | "result" | "submission";
      label: string;
      sublabel?: string;
      status: string;
      timestamp: string;
      evidenceRecordId?: string | null;
      metadata?: Record<string, unknown>;
    }

    interface ProvenanceEdge {
      id: string;
      source: string;
      target: string;
      label?: string;
      type?: string;
      status: string;
    }

    const nodes: ProvenanceNode[] = [];
    const edges: ProvenanceEdge[] = [];

    // 1. Experiment Root Node
    const expNodeId = `node-exp-${experiment.id}`;
    nodes.push({
      id: expNodeId,
      type: "experiment",
      label: experiment.publicId,
      sublabel: experiment.title,
      status: experiment.integrityStatus,
      timestamp: experiment.createdAt.toISOString(),
      evidenceRecordId: experiment.evidenceRecordId,
      metadata: {
        pi: experiment.principalInvestigator,
        group: experiment.researchGroup,
        protocol: experiment.protocol,
      },
    });

    // 2. Instrument & Sample Nodes
    const instruments = new Map<string, { measurementCount: number; fromExperiment: boolean }>();
    if (experiment.instrumentName) {
      instruments.set(experiment.instrumentName, {
        measurementCount: 0,
        fromExperiment: true,
      });
    }
    for (const measurement of experiment.measurements) {
      if (!measurement.instrumentName) continue;
      const existing = instruments.get(measurement.instrumentName);
      instruments.set(measurement.instrumentName, {
        measurementCount: (existing?.measurementCount || 0) + 1,
        fromExperiment: existing?.fromExperiment || false,
      });
    }

    Array.from(instruments.entries()).forEach(([instrumentName, details], index) => {
      const instNodeId = `node-inst-${experiment.id}-${index}`;
      nodes.push({
        id: instNodeId,
        type: "instrument",
        label: instrumentName,
        sublabel: "Calibrated Acquisition Sensor",
        status: "verified",
        timestamp: experiment.createdAt.toISOString(),
        metadata: {
          usedFor: details.measurementCount > 0
            ? `${details.measurementCount} measurement${details.measurementCount === 1 ? "" : "s"}`
            : "Experiment configuration",
          source: details.fromExperiment ? "Experiment and measurement records" : "Measurement records",
        },
      });
      edges.push({
        id: `edge-${instNodeId}-${expNodeId}`,
        source: instNodeId,
        target: expNodeId,
        label: "used for",
        status: "verified",
      });
    });

    // 3. Representative Measurements (show initial, corrections, and key milestones)
    const sampledMeasurements = experiment.measurements.filter(
      (m, idx) =>
        idx < 5 ||
        m.correctionOf ||
        m.correctionsAsOrig.length > 0 ||
        idx === experiment.measurements.length - 1
    );

    for (const m of sampledMeasurements) {
      const mNodeId = `node-meas-${m.id}`;
      const isCorrection = Boolean(m.correctionOf);
      nodes.push({
        id: mNodeId,
        type: isCorrection ? "correction" : "measurement",
        label: m.publicId,
        sublabel: `${m.value} ${m.unit} (Trial #${m.trialNumber})`,
        status: m.status,
        timestamp: m.timestamp.toISOString(),
        evidenceRecordId: m.evidenceRecordId,
        metadata: {
          value: m.value,
          unit: m.unit,
          correctionReason: m.correctionReason,
        },
      });

      if (isCorrection && m.correctionOf) {
        const origNodeId = `node-meas-${m.correctionOf}`;
        edges.push({
          id: `edge-${origNodeId}-${mNodeId}`,
          source: origNodeId,
          target: mNodeId,
          label: "recalibrated to",
          type: "correction",
          status: m.status,
        });
      } else {
        edges.push({
          id: `edge-${expNodeId}-${mNodeId}`,
          source: expNodeId,
          target: mNodeId,
          label: "recorded",
          status: m.status,
        });
      }
    }

    // 4. Dataset Versions
    for (const ds of experiment.datasets) {
      for (const ver of ds.versions) {
        const verNodeId = `node-dsver-${ver.id}`;
        nodes.push({
          id: verNodeId,
          type: "dataset_version",
          label: `${ds.publicId} v${ver.version}`,
          sublabel: ver.filename,
          status: ver.status,
          timestamp: ver.createdAt.toISOString(),
          evidenceRecordId: ver.evidenceRecordId,
          metadata: {
            recordCount: ver.recordCount,
            sha256: ver.fileHash,
            commitment: ver.commitment,
          },
        });

        // If version 1, link from experiment/measurements
        if (ver.version === 1) {
          edges.push({
            id: `edge-${expNodeId}-${verNodeId}`,
            source: expNodeId,
            target: verNodeId,
            label: "assembled into raw dataset",
            status: ver.status,
          });
        }
      }
    }

    // 5. Processing Events
    for (const proc of experiment.processingEvents) {
      const procNodeId = `node-proc-${proc.id}`;
      nodes.push({
        id: procNodeId,
        type: "processing",
        label: proc.operation.replace(/_/g, " ").toUpperCase(),
        sublabel: proc.description,
        status: "verified",
        timestamp: proc.createdAt.toISOString(),
        evidenceRecordId: proc.evidenceRecordId,
        metadata: {
          operation: proc.operation,
          parameters: proc.parameters,
        },
      });

      if (proc.inputDatasetVersionId) {
        const inNodeId = `node-dsver-${proc.inputDatasetVersionId}`;
        edges.push({
          id: `edge-${inNodeId}-${procNodeId}`,
          source: inNodeId,
          target: procNodeId,
          label: "input",
          status: "verified",
        });
      }

      if (proc.outputDatasetVersionId) {
        const outNodeId = `node-dsver-${proc.outputDatasetVersionId}`;
        edges.push({
          id: `edge-${procNodeId}-${outNodeId}`,
          source: procNodeId,
          target: outNodeId,
          label: "produced",
          status: "verified",
        });
      }
    }

    // 6. Analysis Nodes
    for (const an of experiment.analyses) {
      const anNodeId = `node-an-${an.id}`;
      nodes.push({
        id: anNodeId,
        type: "analysis",
        label: an.analysisType.replace(/_/g, " ").toUpperCase(),
        sublabel: `${an.software || "Analytical Engine"} (${an.softwareVersion || "v1.0"})`,
        status: an.status === "completed" ? "verified" : "not_checked",
        timestamp: an.createdAt.toISOString(),
        metadata: {
          analysisType: an.analysisType,
          software: an.software,
        },
      });

      if (an.inputDatasetVersionId) {
        const dsVerId = `node-dsver-${an.inputDatasetVersionId}`;
        edges.push({
          id: `edge-${dsVerId}-${anNodeId}`,
          source: dsVerId,
          target: anNodeId,
          label: "analyzed",
          status: "verified",
        });
      } else {
        // Link to latest dataset version
        const latestVer = experiment.datasets[0]?.versions.slice(-1)[0];
        if (latestVer) {
          edges.push({
            id: `edge-dsver-${latestVer.id}-${anNodeId}`,
            source: `node-dsver-${latestVer.id}`,
            target: anNodeId,
            label: "analyzed",
            status: "verified",
          });
        }
      }

      // 7. Results
      for (const res of an.results) {
        const resNodeId = `node-res-${res.id}`;
        nodes.push({
          id: resNodeId,
          type: "result",
          label: res.name,
          sublabel: `${res.value}`,
          status: "verified",
          timestamp: res.createdAt.toISOString(),
        });
        edges.push({
          id: `edge-${anNodeId}-${resNodeId}`,
          source: anNodeId,
          target: resNodeId,
          label: "yielded",
          status: "verified",
        });
      }
    }

    // 8. Submissions
    for (const sub of experiment.submissions) {
      const subNodeId = `node-sub-${sub.id}`;
      nodes.push({
        id: subNodeId,
        type: "submission",
        label: sub.publicId,
        sublabel: sub.title,
        status: sub.integrityStatus,
        timestamp: sub.createdAt.toISOString(),
        metadata: {
          institution: sub.institution,
          totalRecords: sub.totalRecords,
          verifiedRecords: sub.verifiedRecords,
        },
      });

      edges.push({
        id: `edge-${expNodeId}-${subNodeId}`,
        source: expNodeId,
        target: subNodeId,
        label: "published package",
        status: sub.integrityStatus,
      });
    }

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        publicId: experiment.publicId,
        title: experiment.title,
        integrityStatus: experiment.integrityStatus,
      },
      nodes,
      edges,
    });
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/provenance Error:", error);
    return NextResponse.json(
      { error: "Failed to generate provenance graph", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
