import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLEvidenceService } from "@/lib/cool/evidence-service";
import { sha256Hex } from "@/lib/cool/hash";
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
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const datasets = await prisma.dataset.findMany({
      where: { experimentId: experiment.id },
      orderBy: { createdAt: "desc" },
      include: {
        versions: {
          orderBy: { version: "desc" },
          include: {
            inputEvents: true,
            outputEvents: true,
          },
        },
      },
    });

    return NextResponse.json(datasets);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/datasets Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch datasets", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, filename, description, content, recordCount, createdBy } = body;

    if (!name || !filename) {
      return NextResponse.json(
        { error: "Missing required fields: 'name' and 'filename' are required." },
        { status: 400 }
      );
    }

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
      include: { _count: { select: { datasets: true, evidenceRecords: true } } },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const totalDatasets = await prisma.dataset.count();
    const publicId = `DS-2026-${String(totalDatasets + 82).padStart(4, "0")}`;
    const dataContent = content || `sample,trial,value\n1,1,100.0`;
    const fileHash = sha256Hex(dataContent);
    const fileSize = Buffer.byteLength(dataContent);
    const nextSeq = experiment._count.evidenceRecords + 1;

    // Seal cryptographic receipt for Dataset Version 1
    const evidence = await CooLEvidenceService.recordDatasetVersion(
      experiment.id,
      {
        publicId,
        name,
        version: 1,
        filename,
        recordCount: recordCount || 1,
        fileSize,
        fileHash,
        dataContent,
      },
      nextSeq
    );

    const dataset = await prisma.dataset.create({
      data: {
        publicId,
        experimentId: experiment.id,
        name,
        filename,
        description: description || null,
        currentVersion: 1,
        recordCount: recordCount || 1,
        fileSize,
        sha256: fileHash,
        coolCommitment: evidence.evidenceRecord.outputCommitment || `mh:sha256:${fileHash}`,
        evidenceRecordId: evidence.evidenceRecord.id,
        status: "verified",
        versions: {
          create: {
            version: 1,
            filename,
            recordCount: recordCount || 1,
            fileSize,
            fileHash,
            commitment: evidence.evidenceRecord.outputCommitment || `mh:sha256:${fileHash}`,
            evidenceRecordId: evidence.evidenceRecord.id,
            status: "verified",
            createdBy: createdBy || user.name || "Scientific Operator",
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Update experiment counts
    await prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        evidenceCount: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        dataset,
        evidenceRecord: evidence.evidenceRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/experiments/[id]/datasets Error:", error);
    return NextResponse.json(
      { error: "Failed to upload dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
