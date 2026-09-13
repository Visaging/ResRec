import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { datasetId, experimentId } = body;

    let targetVer = null;
    if (datasetId) {
      targetVer = await prisma.datasetVersion.findFirst({
        where: { OR: [{ id: datasetId }, { dataset: { publicId: datasetId } }] },
        include: { dataset: true },
      });
    } else {
      const exp = await prisma.experiment.findFirst({
        where: { publicId: experimentId || "EXP-2026-0042" },
      });
      if (exp) {
        targetVer = await prisma.datasetVersion.findFirst({
          where: { dataset: { experimentId: exp.id }, version: 1 },
          include: { dataset: true },
        });
      }
    }

    if (!targetVer) {
      return NextResponse.json({ error: "Target dataset version not found" }, { status: 404 });
    }

    // Tamper the fileHash / content in the DB
    const tamperedHash = `tampered_${targetVer.fileHash.slice(0, 32)}`;
    const tamperedVer = await prisma.datasetVersion.update({
      where: { id: targetVer.id },
      data: {
        fileHash: tamperedHash,
        status: "failed",
      },
    });

    await prisma.dataset.update({
      where: { id: targetVer.datasetId },
      data: {
        sha256: tamperedHash,
        status: "failed",
      },
    });

    await prisma.experiment.update({
      where: { id: targetVer.dataset.experimentId },
      data: {
        integrityStatus: "failed",
        status: "integrity_issue",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Simulated unauthorized dataset alteration on ${targetVer.filename} (Version ${targetVer.version}). Stored hash diverged from sealed CooL commitment.`,
      tamperedVersion: tamperedVer,
    });
  } catch (error: unknown) {
    console.error("POST /api/dev/tamper/dataset Error:", error);
    return NextResponse.json(
      { error: "Failed to tamper dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
