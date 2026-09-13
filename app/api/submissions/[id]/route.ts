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

    const submission = await prisma.submission.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
      include: {
        experiment: {
          include: {
            datasets: { include: { versions: true } },
            measurements: { take: 10 },
            analyses: { include: { results: true } },
            evidenceRecords: { take: 10 },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    let authors: string[] = [];
    try {
      authors = JSON.parse(submission.authors);
    } catch {
      authors = [submission.authors];
    }

    return NextResponse.json({
      ...submission,
      authors,
    });
  } catch (error: unknown) {
    console.error("GET /api/submissions/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission", details: error instanceof Error ? error.message : String(error) },
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

    const submission = await prisma.submission.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { publicId: id }] },
          { userId: user.id },
        ],
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.integrityStatus !== undefined ? { integrityStatus: body.integrityStatus } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PATCH /api/submissions/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to update submission", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
