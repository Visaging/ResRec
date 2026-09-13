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
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get("version");

    const dataset = await prisma.dataset.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { experiment: { userId: user.id } },
        ],
      },
      include: {
        versions: { orderBy: { version: "desc" } },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found or access denied" }, { status: 404 });
    }

    let targetVersion = dataset.versions[0];
    if (versionParam) {
      const vNum = parseInt(versionParam, 10);
      const found = dataset.versions.find((v) => v.version === vNum);
      if (found) targetVersion = found;
    }

    const content = targetVersion?.filePath || `trial,cycle,capacity_pct\n1,1,100.0\n`;
    const filename = targetVersion?.filename || `${dataset.publicId}_v${dataset.currentVersion}.csv`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Dataset-SHA256": targetVersion?.fileHash || dataset.sha256,
        "X-CooL-Commitment": targetVersion?.commitment || dataset.coolCommitment,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/datasets/[id]/download Error:", error);
    return NextResponse.json(
      { error: "Failed to download dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
