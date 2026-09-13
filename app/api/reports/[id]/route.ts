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

    const report = await prisma.report.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error("GET /api/reports/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
