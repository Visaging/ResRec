import { NextResponse } from "next/server";
import { CooLVerificationService } from "@/lib/cool/verification-service";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { experimentId } = body;

    if (!experimentId) {
      return NextResponse.json(
        { error: "Missing 'experimentId' parameter" },
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
    });

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found or access denied" }, { status: 404 });
    }

    const result = await CooLVerificationService.verifyExperiment(experiment.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/verification/verify-experiment Error:", error);
    return NextResponse.json(
      { error: "Failed to execute experiment verification", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
