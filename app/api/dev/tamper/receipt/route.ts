import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { recordId, experimentId } = body;

    let target = null;
    if (recordId) {
      target = await prisma.evidenceRecord.findFirst({
        where: { OR: [{ id: recordId }, { publicId: recordId }, { recordId }] },
      });
    } else {
      const exp = await prisma.experiment.findFirst({
        where: { publicId: experimentId || "EXP-2026-0042" },
      });
      if (exp) {
        target = await prisma.evidenceRecord.findFirst({
          where: { experimentId: exp.id },
          orderBy: { sequence: "asc" },
        });
      }
    }

    if (!target) {
      return NextResponse.json({ error: "Target evidence record not found" }, { status: 404 });
    }

    // Tamper the raw cryptographic receipt JSON (corrupt signature and binding hash)
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(target.evidenceJson);
      if (parsed.binding_hash) {
        parsed.binding_hash = "mh:sha256:0000000000000000000000000000000000000000000000000000000000000000";
      }
    } catch {
      parsed = { corrupted: true };
    }

    const tamperedJson = JSON.stringify(parsed);

    const updatedRecord = await prisma.evidenceRecord.update({
      where: { id: target.id },
      data: {
        evidenceJson: tamperedJson,
        bindingVerification: "failed",
        signatureVerification: "failed",
      },
    });

    if (target.experimentId) {
      await prisma.experiment.update({
        where: { id: target.experimentId },
        data: {
          integrityStatus: "failed",
          status: "integrity_issue",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Simulated receipt corruption on ${target.publicId}. Cryptographic binding hash and ML-DSA signature intentionally invalidated.`,
      tamperedRecord: updatedRecord,
    });
  } catch (error: unknown) {
    console.error("POST /api/dev/tamper/receipt Error:", error);
    return NextResponse.json(
      { error: "Failed to tamper receipt", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
