import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLVerificationService } from "@/lib/cool/verification-service";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
    });

    const formatted = reports.map((r) => ({
      id: r.id,
      publicId: r.publicId,
      title: r.title,
      type: r.type,
      experimentId: r.experimentId,
      generatedBy: r.generatedBy,
      generatedAt: r.generatedAt.toISOString(),
      sizeBytes: r.sizeBytes,
      status: r.status,
      summary: r.summary,
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("GET /api/reports Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit reports", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { experimentId, title, type } = body;

    if (!experimentId) {
      return NextResponse.json(
        { error: "Missing required field: 'experimentId' is required." },
        { status: 400 }
      );
    }

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id: experimentId }, { publicId: experimentId }] },
          { userId: user.id },
        ],
      },
      include: {
        evidenceRecords: true,
        measurements: true,
        datasets: { include: { versions: true } },
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    // Run live verification
    const verResult = await CooLVerificationService.verifyExperiment(experiment.id);

    const totalReports = await prisma.report.count();
    const publicId = `REP-2026-${String(totalReports + 13).padStart(4, "0")}`;
    const reportTitle = title || `${experiment.title} - Audit Report`;
    const summary = verResult.overallStatus === "verified"
      ? `Cryptographic integrity audit for ${experiment.publicId} PASSED. Verified ${verResult.totalEvidenceRecords} evidence records, ML-DSA-65 signatures, and hash commitments.`
      : `Cryptographic integrity audit for ${experiment.publicId} FAILED with ${verResult.issues.length} detected integrity issues.`;

    const reportContent = JSON.stringify({
      experimentId: experiment.id,
      experimentPublicId: experiment.publicId,
      title: experiment.title,
      pi: experiment.principalInvestigator,
      verificationResult: verResult,
      measurementsCount: experiment.measurements.length,
      datasetsCount: experiment.datasets.length,
      evidenceRecordsCount: experiment.evidenceRecords.length,
    });

    const report = await prisma.report.create({
      data: {
        publicId,
        userId: user.id,
        title: reportTitle,
        type: type || "verification",
        experimentId: experiment.id,
        generatedBy: user.name || "ResRec Automated Verification Engine",
        generatedAt: new Date(),
        sizeBytes: Buffer.byteLength(reportContent),
        status: "ready",
        summary,
        content: reportContent,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/reports Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
