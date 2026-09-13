import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLEvidenceService } from "@/lib/cool/evidence-service";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const integrityStatus = searchParams.get("integrityStatus") || "";

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { publicId: { contains: search } },
            { principalInvestigator: { contains: search } },
            { researchGroup: { contains: search } },
          ],
        },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (integrityStatus && integrityStatus !== "all") {
      where.integrityStatus = integrityStatus;
    }

    const experiments = await prisma.experiment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        institution: true,
        _count: {
          select: {
            measurements: true,
            datasets: true,
            evidenceRecords: true,
            processingEvents: true,
          },
        },
      },
    });

    const formatted = experiments.map((exp) => ({
      id: exp.id,
      publicId: exp.publicId,
      title: exp.title,
      description: exp.description,
      objective: exp.objective,
      principalInvestigator: exp.principalInvestigator,
      researchGroup: exp.researchGroup,
      institution: exp.institution?.name || "Independent",
      instrumentName: exp.instrumentName,
      sampleName: exp.sampleName,
      protocol: exp.protocol,
      environment: exp.environment,
      status: exp.status,
      integrityStatus: exp.integrityStatus,
      recordCount: exp._count.measurements || exp.recordCount,
      datasetCount: exp._count.datasets,
      evidenceCount: exp._count.evidenceRecords || exp.evidenceCount,
      processingCount: exp._count.processingEvents,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("GET /api/experiments Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiments", details: error instanceof Error ? error.message : String(error) },
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
    const {
      title,
      description,
      objective,
      principalInvestigator,
      researchGroup,
      institutionName,
      protocol,
      environment,
      instrumentName,
      sampleName,
    } = body;

    if (!title || !objective) {
      return NextResponse.json(
        { error: "Missing required fields: title and objective are required." },
        { status: 400 }
      );
    }

    // Determine next publicId
    const count = await prisma.experiment.count();
    const publicId = `EXP-2026-${String(count + 43).padStart(4, "0")}`;

    // Institution lookup/creation
    let institutionId: string | null = user.institutionId || null;
    if (institutionName) {
      let inst = await prisma.institution.findFirst({ where: { name: institutionName } });
      if (!inst) {
        inst = await prisma.institution.create({ data: { name: institutionName } });
      }
      institutionId = inst.id;
    }

    const pi = (principalInvestigator && typeof principalInvestigator === "string" && principalInvestigator.trim())
      ? principalInvestigator.trim()
      : user.name;

    const experiment = await prisma.experiment.create({
      data: {
        publicId,
        userId: user.id,
        title: title.trim(),
        description: description || null,
        objective: objective.trim(),
        principalInvestigator: pi,
        researchGroup: researchGroup || "Scientific Investigation Group",
        institutionId,
        protocol: protocol || null,
        environment: environment || null,
        instrumentName: instrumentName || null,
        sampleName: sampleName || null,
        status: "active",
        integrityStatus: "verified",
      },
    });

    // Record cryptographic evidence with CooL SDK
    const evidence = await CooLEvidenceService.recordExperiment({
      id: experiment.id,
      publicId: experiment.publicId,
      title: experiment.title,
      objective: experiment.objective,
      principalInvestigator: experiment.principalInvestigator,
      researchGroup: experiment.researchGroup,
    });

    const updatedExperiment = await prisma.experiment.update({
      where: { id: experiment.id },
      data: { evidenceRecordId: evidence.evidenceRecord.id, evidenceCount: 1 },
      include: { institution: true },
    });

    return NextResponse.json({
      experiment: updatedExperiment,
      evidenceRecord: evidence.evidenceRecord,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/experiments Error:", error);
    return NextResponse.json(
      { error: "Failed to create experiment", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
