import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLEvidenceService } from "@/lib/cool/evidence-service";
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

    const events = await prisma.processingEvent.findMany({
      where: { experimentId: experiment.id },
      orderBy: { createdAt: "asc" },
      include: {
        inputVersion: true,
        outputVersion: true,
      },
    });

    return NextResponse.json(events);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/processing Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing events", details: error instanceof Error ? error.message : String(error) },
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
    const { operation, description, parameters, inputDatasetVersionId, outputDatasetVersionId } = body;

    if (!operation || !description) {
      return NextResponse.json(
        { error: "Missing required fields: 'operation' and 'description' are required." },
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
      include: { _count: { select: { evidenceRecords: true } } },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const nextSeq = experiment._count.evidenceRecords + 1;

    // Seal cryptographic receipt
    const evidence = await CooLEvidenceService.recordProcessingEvent(
      experiment.id,
      {
        operation,
        description,
        parameters: parameters || null,
      },
      nextSeq
    );

    const procEvent = await prisma.processingEvent.create({
      data: {
        experimentId: experiment.id,
        operation,
        description,
        parameters: parameters ? JSON.stringify(parameters) : null,
        inputDatasetVersionId: inputDatasetVersionId || null,
        outputDatasetVersionId: outputDatasetVersionId || null,
        evidenceRecordId: evidence.evidenceRecord.id,
      },
      include: {
        inputVersion: true,
        outputVersion: true,
      },
    });

    await prisma.experiment.update({
      where: { id: experiment.id },
      data: { evidenceCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        processingEvent: procEvent,
        evidenceRecord: evidence.evidenceRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/experiments/[id]/processing Error:", error);
    return NextResponse.json(
      { error: "Failed to record processing event", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
