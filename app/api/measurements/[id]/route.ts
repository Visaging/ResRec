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

    const measurement = await prisma.measurement.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        evidenceRecord: true,
        experiment: { select: { publicId: true, title: true } },
        correctionsAsOrig: {
          include: {
            correctedMeasurement: {
              include: { evidenceRecord: true },
            },
          },
        },
        correctionsAsCorr: {
          include: {
            originalMeasurement: {
              include: { evidenceRecord: true },
            },
          },
        },
      },
    });

    if (!measurement) {
      return NextResponse.json({ error: "Measurement not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(measurement);
  } catch (error: unknown) {
    console.error("GET /api/measurements/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch measurement", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
