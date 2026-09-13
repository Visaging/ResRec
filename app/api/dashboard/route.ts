import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [
      totalExperiments,
      verifiedRecords,
      totalDatasets,
      totalEvidenceRecords,
      pendingSubmissions,
      failedVerifications,
      recentExperiments,
      recentEvidence,
    ] = await Promise.all([
      prisma.experiment.count({
        where: { userId: user.id },
      }),
      prisma.measurement.count({
        where: {
          experiment: { userId: user.id },
          status: "verified",
        },
      }),
      prisma.dataset.count({
        where: {
          experiment: { userId: user.id },
        },
      }),
      prisma.evidenceRecord.count({
        where: {
          experiment: { userId: user.id },
        },
      }),
      prisma.submission.count({
        where: {
          userId: user.id,
          status: "under_review",
        },
      }),
      prisma.experiment.count({
        where: {
          userId: user.id,
          integrityStatus: "failed",
        },
      }),
      prisma.experiment.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          institution: true,
          _count: {
            select: {
              measurements: true,
              datasets: true,
              evidenceRecords: true,
            },
          },
        },
      }),
      prisma.evidenceRecord.findMany({
        where: {
          experiment: { userId: user.id },
        },
        take: 6,
        orderBy: { issuedAt: "desc" },
        include: {
          experiment: {
            select: { publicId: true, title: true },
          },
        },
      }),
    ]);

    // Format recent experiments
    const formattedExperiments = recentExperiments.map((exp) => ({
      id: exp.id,
      publicId: exp.publicId,
      title: exp.title,
      description: exp.description,
      objective: exp.objective,
      principalInvestigator: exp.principalInvestigator,
      researchGroup: exp.researchGroup,
      institution: exp.institution?.name || "Independent",
      status: exp.status,
      integrityStatus: exp.integrityStatus,
      recordCount: exp._count.measurements || exp.recordCount,
      evidenceCount: exp._count.evidenceRecords || exp.evidenceCount,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
    }));

    // Format recent evidence
    const formattedEvidence = recentEvidence.map((ev) => ({
      id: ev.id,
      publicId: ev.publicId,
      experimentPublicId: ev.experiment?.publicId || "SYSTEM",
      experimentTitle: ev.experiment?.title || "System Event",
      eventType: ev.eventType,
      recordId: ev.recordId,
      sequence: ev.sequence,
      digest: ev.digest,
      issuedAt: ev.issuedAt.toISOString(),
      bindingVerification: ev.bindingVerification,
      signatureVerification: ev.signatureVerification,
      transparencyVerification: ev.transparencyVerification,
      softwareIdentity: ev.softwareIdentity,
    }));

    // Compute real 7-day activity chart for user
    const now = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityChart: { name: string; verified: number; pending: number; failed: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayRecords = await prisma.evidenceRecord.findMany({
        where: {
          experiment: { userId: user.id },
          issuedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          signatureVerification: true,
          bindingVerification: true,
        },
      });

      let verified = 0;
      let pending = 0;
      let failed = 0;

      for (const rec of dayRecords) {
        if (rec.signatureVerification === "failed" || rec.bindingVerification === "failed") {
          failed++;
        } else if (rec.signatureVerification === "pending" || rec.bindingVerification === "pending") {
          pending++;
        } else {
          verified++;
        }
      }

      activityChart.push({
        name: dayNames[dayStart.getDay()],
        verified,
        pending,
        failed,
      });
    }

    return NextResponse.json({
      metrics: {
        totalExperiments,
        verifiedRecords,
        totalDatasets,
        totalEvidenceRecords,
        pendingSubmissions,
        activeAlerts: failedVerifications,
        activityChart,
      },
      recentExperiments: formattedExperiments,
      recentEvidence: formattedEvidence,
    });
  } catch (error: unknown) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
