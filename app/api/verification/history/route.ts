import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const history = await prisma.verificationRecord.findMany({
      orderBy: { verifiedAt: "desc" },
      take: 20,
    });

    const formatted = history.map((h) => {
      let issues: string[] = [];
      try {
        issues = h.issues ? JSON.parse(h.issues) : [];
      } catch {
        issues = h.issues ? [h.issues] : [];
      }

      return {
        id: h.id,
        targetType: h.targetType,
        targetId: h.targetId,
        overallStatus: h.overallStatus,
        bindingStatus: h.bindingStatus,
        signatureStatus: h.signatureStatus,
        transparencyStatus: h.transparencyStatus,
        witnessStatus: h.witnessStatus,
        attestationStatus: h.attestationStatus,
        datasetCommitmentStatus: h.datasetCommitmentStatus,
        recordSequenceStatus: h.recordSequenceStatus,
        expectedCommitment: h.expectedCommitment,
        observedCommitment: h.observedCommitment,
        affectedRecord: h.affectedRecord,
        issues,
        verifiedAt: h.verifiedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("GET /api/verification/history Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification history", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
