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
      include: {
        institution: true,
        measurements: {
          orderBy: { trialNumber: "asc" },
          include: {
            evidenceRecord: true,
            correctionsAsOrig: {
              include: {
                correctedMeasurement: true,
              },
            },
            correctionsAsCorr: {
              include: {
                originalMeasurement: true,
              },
            },
          },
        },
        datasets: {
          orderBy: { createdAt: "desc" },
          include: {
            versions: {
              orderBy: { version: "desc" },
            },
          },
        },
        processingEvents: {
          orderBy: { createdAt: "asc" },
          include: {
            inputVersion: true,
            outputVersion: true,
          },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          include: {
            results: true,
            inputDatasetVersion: true,
          },
        },
        results: {
          orderBy: { createdAt: "asc" },
        },
        evidenceRecords: {
          orderBy: { sequence: "asc" },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(experiment);
  } catch (error: unknown) {
    console.error("GET /api/experiments/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiment details", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const updated = await prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.objective !== undefined ? { objective: body.objective } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.integrityStatus !== undefined ? { integrityStatus: body.integrityStatus } : {}),
        ...(body.environment !== undefined ? { environment: body.environment } : {}),
        ...(body.protocol !== undefined ? { protocol: body.protocol } : {}),
      },
      include: { institution: true },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PATCH /api/experiments/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to update experiment", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.experiment.delete({
      where: { id: experiment.id },
    });

    return NextResponse.json({ success: true, message: `Experiment ${experiment.publicId} deleted.` });
  } catch (error: unknown) {
    console.error("DELETE /api/experiments/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete experiment", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
