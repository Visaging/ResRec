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

    const results = await prisma.result.findMany({
      where: { experimentId: experiment.id },
      orderBy: { createdAt: "asc" },
      include: {
        analysis: true,
      },
    });

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id]/results Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results", details: error instanceof Error ? error.message : String(error) },
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
    const { name, value, unit, description, analysisId } = body;

    if (!name || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: 'name' and 'value' are required." },
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

    const result = await prisma.result.create({
      data: {
        experimentId: experiment.id,
        analysisId: analysisId || null,
        name,
        value: String(value),
        unit: unit || null,
        description: description || null,
      },
      include: {
        analysis: true,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/experiments/[id]/results Error:", error);
    return NextResponse.json(
      { error: "Failed to record result", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
