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

    const measurements = await prisma.measurement.findMany({
      where: { experimentId: experiment.id },
      orderBy: { trialNumber: "asc" },
      include: {
        evidenceRecord: true,
        correctionsAsOrig: {
          include: {
            correctedMeasurement: true,
          },
        },
        correctionsAsCorr: {
          include: {
            originalMeasurement: true,
          },
        },
      },
    });

    return NextResponse.json(measurements);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/measurements Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch measurements", details: error instanceof Error ? error.message : String(error) },
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

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
      include: { _count: { select: { measurements: true, evidenceRecords: true } } },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const { value, unit, trialNumber, metadata, instrumentName, sampleName } = body;

    if (value === undefined || !unit) {
      return NextResponse.json(
        { error: "Missing required measurement fields: 'value' and 'unit' are required." },
        { status: 400 }
      );
    }

    const nextTrial = trialNumber ?? (experiment._count.measurements + 1);
    const nextSeq = experiment._count.evidenceRecords + 1;
    
    // Generate a unique public ID scoped by experiment
    const expSuffix = (experiment.publicId || experiment.id).replace(/^EXP-/, "");
    let publicId = `MEAS-${expSuffix}-${String(nextTrial).padStart(3, "0")}`;
    const existing = await prisma.measurement.findUnique({ where: { publicId } });
    if (existing) {
      publicId = `MEAS-${expSuffix}-${String(nextTrial).padStart(3, "0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    }
    const timestamp = new Date();

    // Seal cryptographic receipt
    const evidence = await CooLEvidenceService.recordMeasurement(
      experiment.id,
      {
        publicId,
        trialNumber: nextTrial,
        timestamp,
        value: Number(value),
        unit,
        instrumentName: instrumentName || experiment.instrumentName,
        sampleName: sampleName || experiment.sampleName,
        metadata: metadata || null,
      },
      nextSeq
    );

    const measurement = await prisma.measurement.create({
      data: {
        publicId,
        experimentId: experiment.id,
        trialNumber: nextTrial,
        timestamp,
        value: Number(value),
        unit,
        instrumentName: instrumentName || experiment.instrumentName,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: "verified",
        evidenceRecordId: evidence.evidenceRecord.id,
      },
      include: {
        evidenceRecord: true,
      },
    });

    // Update experiment recordCount and evidenceCount
    await prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        recordCount: { increment: 1 },
        evidenceCount: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        measurement,
        evidenceRecord: evidence.evidenceRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/experiments/[id]/measurements Error:", error);
    return NextResponse.json(
      { error: "Failed to record measurement", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
