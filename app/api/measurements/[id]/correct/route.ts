import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLEvidenceService } from "@/lib/cool/evidence-service";
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
    const { correctedValue, reason, note, operator } = body;

    if (correctedValue === undefined || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: 'correctedValue' and 'reason' are required." },
        { status: 400 }
      );
    }

    const orig = await prisma.measurement.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        experiment: {
          include: {
            _count: { select: { evidenceRecords: true } },
          },
        },
      },
    });

    if (!orig) {
      return NextResponse.json({ error: "Original measurement not found or access denied" }, { status: 404 });
    }

    const nextSeq = orig.experiment._count.evidenceRecords + 1;
    const corrCount = await prisma.correction.count({
      where: { originalMeasurementId: orig.id },
    });
    const correctedPublicId = `${orig.publicId}-C${corrCount + 1}`;

    // Seal cryptographic evidence for the correction
    const evidence = await CooLEvidenceService.recordCorrection(
      orig.experimentId,
      {
        originalMeasurementPublicId: orig.publicId,
        originalValue: orig.value,
        correctedMeasurementPublicId: correctedPublicId,
        correctedValue: Number(correctedValue),
        reason,
        note: note || null,
        operator: operator || user.name || "Scientific Operator",
      },
      nextSeq
    );

    // Create the new corrected measurement row
    const correctedMeasurement = await prisma.measurement.create({
      data: {
        publicId: correctedPublicId,
        experimentId: orig.experimentId,
        trialNumber: orig.trialNumber,
        timestamp: orig.timestamp,
        value: Number(correctedValue),
        unit: orig.unit,
        instrumentName: orig.instrumentName,
        instrumentId: orig.instrumentId,
        sampleId: orig.sampleId,
        metadata: orig.metadata,
        status: "verified",
        evidenceRecordId: evidence.evidenceRecord.id,
        correctionOf: orig.id,
        correctionReason: reason,
        correctionNote: note || null,
      },
      include: {
        evidenceRecord: true,
      },
    });

    // Create the formal audit correction record
    const correctionAudit = await prisma.correction.create({
      data: {
        originalMeasurementId: orig.id,
        correctedMeasurementId: correctedMeasurement.id,
        originalValue: orig.value,
        correctedValue: Number(correctedValue),
        reason,
        note: note || null,
        operator: operator || user.name || "Scientific Operator",
        evidenceRecordId: evidence.evidenceRecord.id,
      },
    });

    // Increment experiment evidenceCount
    await prisma.experiment.update({
      where: { id: orig.experimentId },
      data: { evidenceCount: { increment: 1 } },
    });

    return NextResponse.json({
      correctedMeasurement,
      correctionAudit,
      evidenceRecord: evidence.evidenceRecord,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/measurements/[id]/correct Error:", error);
    return NextResponse.json(
      { error: "Failed to record correction", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
