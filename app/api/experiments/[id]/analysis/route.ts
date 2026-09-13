import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const analyses = await prisma.analysis.findMany({
      where: { experimentId: experiment.id },
      orderBy: { createdAt: "desc" },
      include: {
        results: true,
        inputDatasetVersion: true,
      },
    });

    return NextResponse.json(analyses);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

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
    const { analysisType, parameters, software, softwareVersion, output, inputDatasetVersionId } = body;

    if (!analysisType) {
      return NextResponse.json(
        { error: "Missing required field: 'analysisType' is required." },
        { status: 400 }
      );
    }

    const experiment = await prisma.experiment.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const analysis = await prisma.analysis.create({
      data: {
        experimentId: experiment.id,
        analysisType,
        parameters: parameters ? JSON.stringify(parameters) : null,
        software: software || "Python Scientific Stack",
        softwareVersion: softwareVersion || "3.12",
        status: "completed",
        output: output ? JSON.stringify(output) : null,
        inputDatasetVersionId: inputDatasetVersionId || null,
      },
      include: {
        results: true,
        inputDatasetVersion: true,
      },
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/experiments/[id]/analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to record analysis", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
