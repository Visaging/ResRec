import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLEvidenceService } from "@/lib/cool/evidence-service";
import { sha256Hex } from "@/lib/cool/hash";
import { getSessionUser } from "@/lib/auth/server";

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
    const { filename, content, recordCount, createdBy, operation, description, parameters } = body;

    const dataset = await prisma.dataset.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        experiment: {
          include: { _count: { select: { evidenceRecords: true } } },
        },
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found or access denied" }, { status: 404 });
    }

    const nextVersion = dataset.currentVersion + 1;
    const prevVersionId = dataset.versions[0]?.id;
    const dataContent = content || `version,${nextVersion}`;
    const fileHash = sha256Hex(dataContent);
    const fileSize = Buffer.byteLength(dataContent);
    const newFilename = filename || `${dataset.filename.replace(/\.csv$/, "")}_v${nextVersion}.csv`;
    const nextSeq = dataset.experiment._count.evidenceRecords + 1;

    // Seal CooL receipt for new dataset version
    const evidence = await CooLEvidenceService.recordDatasetVersion(
      dataset.experimentId,
      {
        publicId: dataset.publicId,
        name: dataset.name,
        version: nextVersion,
        filename: newFilename,
        recordCount: recordCount || dataset.recordCount,
        fileSize,
        fileHash,
        dataContent,
      },
      nextSeq
    );

    const versionRecord = await prisma.datasetVersion.create({
      data: {
        datasetId: dataset.id,
        version: nextVersion,
        filename: newFilename,
        recordCount: recordCount || dataset.recordCount,
        fileSize,
        fileHash,
        commitment: evidence.digest,
        evidenceRecordId: evidence.evidenceRecord.id,
        status: "verified",
        filePath: dataContent,
        createdBy: createdBy || user.name || "Scientific Operator",
      },
    });

    // Update parent dataset currentVersion, hash, and commitment
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        currentVersion: nextVersion,
        filename: newFilename,
        recordCount: recordCount || dataset.recordCount,
        fileSize,
        sha256: fileHash,
        coolCommitment: evidence.digest,
        evidenceRecordId: evidence.evidenceRecord.id,
        status: "verified",
      },
    });

    // If a transformation operation was described, record a processing event linking previous version to new version
    let procEvent = null;
    if (operation && prevVersionId) {
      const procSeq = nextSeq + 1;
      const procEv = await CooLEvidenceService.recordProcessingEvent(
        dataset.experimentId,
        {
          operation,
          description: description || `Transformed dataset version ${dataset.currentVersion} to ${nextVersion}`,
          parameters: parameters || null,
          inputVersion: dataset.currentVersion,
          outputVersion: nextVersion,
        },
        procSeq
      );

      procEvent = await prisma.processingEvent.create({
        data: {
          experimentId: dataset.experimentId,
          operation,
          description: description || `Transformed dataset version ${dataset.currentVersion} to ${nextVersion}`,
          parameters: parameters ? JSON.stringify(parameters) : null,
          inputDatasetVersionId: prevVersionId,
          outputDatasetVersionId: versionRecord.id,
          evidenceRecordId: procEv.evidenceRecord.id,
        },
      });

      await prisma.experiment.update({
        where: { id: dataset.experimentId },
        data: { evidenceCount: { increment: 2 } },
      });
    } else {
      await prisma.experiment.update({
        where: { id: dataset.experimentId },
        data: { evidenceCount: { increment: 1 } },
      });
    }

    return NextResponse.json(
      {
        datasetVersion: versionRecord,
        evidenceRecord: evidence.evidenceRecord,
        processingEvent: procEvent,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/datasets/[id]/versions Error:", error);
    return NextResponse.json(
      { error: "Failed to create dataset version", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
