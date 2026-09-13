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

    const dataset = await prisma.dataset.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        experiment: { select: { publicId: true, title: true, userId: true } },
        versions: {
          orderBy: { version: "desc" },
          include: {
            inputEvents: true,
            outputEvents: true,
          },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(dataset);
  } catch (error: unknown) {
    console.error("GET /api/datasets/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
