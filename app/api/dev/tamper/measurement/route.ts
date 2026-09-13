import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { measurementId, experimentId, tamperedValue } = body;

    // Default to EXP-2026-0042 Trial 14 or first measurement if not specified
    let target = null;
    if (measurementId) {
      target = await prisma.measurement.findFirst({
        where: { OR: [{ id: measurementId }, { publicId: measurementId }] },
        include: { experiment: true },
      });
    } else {
      const exp = await prisma.experiment.findFirst({
        where: { publicId: experimentId || "EXP-2026-0042" },
      });
      if (exp) {
        target = await prisma.measurement.findFirst({
          where: { experimentId: exp.id, trialNumber: 14, correctionOf: null },
          include: { experiment: true },
        });
      }
    }

    if (!target) {
      return NextResponse.json({ error: "Target measurement for tampering not found" }, { status: 404 });
    }

    const newVal = tamperedValue !== undefined ? Number(tamperedValue) : 82.5;

    // Tamper the value directly in the DB WITHOUT sealing a valid CooL correction receipt
    const tampered = await prisma.measurement.update({
      where: { id: target.id },
      data: {
        value: newVal,
        status: "failed", // Flagged as altered outside the sealed cryptographic ledger
      },
    });

    // Update parent experiment integrity status to failed
    await prisma.experiment.update({
      where: { id: target.experimentId },
      data: {
        integrityStatus: "failed",
        status: "integrity_issue",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Simulated unauthorized tamper on ${target.publicId}. Value modified from ${target.value} to ${newVal} without an attested CooL correction envelope.`,
      tamperedMeasurement: tampered,
    });
  } catch (error: unknown) {
    console.error("POST /api/dev/tamper/measurement Error:", error);
    return NextResponse.json(
      { error: "Failed to tamper measurement", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
