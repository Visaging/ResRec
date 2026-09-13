import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    // Reset any failed experiment statuses back to verified if receipts match,
    // or restore default state for EXP-2026-0042
    const exp42 = await prisma.experiment.findFirst({
      where: { publicId: "EXP-2026-0042" },
      include: {
        measurements: { where: { trialNumber: 14, correctionOf: null } },
        datasets: { include: { versions: true } },
      },
    });

    if (exp42) {
      // Restore measurement 14 original value
      if (exp42.measurements[0]) {
        await prisma.measurement.update({
          where: { id: exp42.measurements[0].id },
          data: {
            value: 98.42,
            status: "verified",
          },
        });
      }

      // Restore datasets
      for (const ds of exp42.datasets) {
        await prisma.dataset.update({
          where: { id: ds.id },
          data: { status: "verified" },
        });
        for (const ver of ds.versions) {
          await prisma.datasetVersion.update({
            where: { id: ver.id },
            data: { status: "verified" },
          });
        }
      }

      // Restore experiment status
      await prisma.experiment.update({
        where: { id: exp42.id },
        data: {
          integrityStatus: "verified",
          status: "under_review",
        },
      });
    }

    // Reset any other experiments flagged
    await prisma.experiment.updateMany({
      where: { integrityStatus: "failed" },
      data: { integrityStatus: "verified", status: "completed" },
    });

    await prisma.measurement.updateMany({
      where: { status: "failed" },
      data: { status: "verified" },
    });

    return NextResponse.json({
      success: true,
      message: "Ledger integrity state restored to verified baseline.",
    });
  } catch (error: unknown) {
    console.error("POST /api/dev/restore Error:", error);
    return NextResponse.json(
      { error: "Failed to restore baseline", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
