import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CooLVerificationService } from "@/lib/cool/verification-service";
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

    const record = await prisma.evidenceRecord.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }, { recordId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        experiment: { select: { publicId: true, title: true, userId: true } },
        measurements: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Evidence record not found or access denied" }, { status: 404 });
    }

    let parsedReceipt: unknown = null;
    try {
      parsedReceipt = JSON.parse(record.evidenceJson);
    } catch {
      parsedReceipt = record.evidenceJson;
    }

    // Verify receipt live using CooL SDK
    const verification = await CooLVerificationService.verifyReceipt(record.evidenceJson);

    return NextResponse.json({
      ...record,
      receipt: parsedReceipt,
      verification,
    });
  } catch (error: unknown) {
    console.error("GET /api/evidence/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
