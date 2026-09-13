import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get("experimentId");
    const eventType = searchParams.get("eventType");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      experiment: { userId: user.id },
    };

    if (experimentId) {
      const exp = await prisma.experiment.findFirst({
        where: {
          AND: [
            { OR: [{ id: experimentId }, { publicId: experimentId }] },
            { userId: user.id },
          ],
        },
      });
      if (exp) {
        where.experimentId = exp.id;
      } else {
        return NextResponse.json([]);
      }
    }

    if (eventType && eventType !== "all") {
      where.eventType = eventType;
    }

    if (search) {
      where.OR = [
        { publicId: { contains: search } },
        { recordId: { contains: search } },
        { eventType: { contains: search } },
        { digest: { contains: search } },
      ];
    }

    const records = await prisma.evidenceRecord.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: {
        experiment: {
          select: { publicId: true, title: true },
        },
      },
    });

    const formatted = records.map((r) => ({
      id: r.id,
      publicId: r.publicId,
      experimentId: r.experimentId,
      experimentPublicId: r.experiment?.publicId || "GLOBAL",
      experimentTitle: r.experiment?.title || "System Event",
      eventType: r.eventType,
      recordId: r.recordId,
      executionId: r.executionId,
      sequence: r.sequence,
      issuedAt: r.issuedAt.toISOString(),
      metadataCommitment: r.metadataCommitment,
      inputCommitment: r.inputCommitment,
      outputCommitment: r.outputCommitment,
      softwareIdentity: r.softwareIdentity,
      digest: r.digest,
      bindingVerification: r.bindingVerification,
      signatureVerification: r.signatureVerification,
      transparencyVerification: r.transparencyVerification,
      witnessVerification: r.witnessVerification,
      attestationVerification: r.attestationVerification,
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("GET /api/evidence Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence records", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
