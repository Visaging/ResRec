import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: user.id,
    };
    if (status && status !== "all") {
      where.status = status;
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        experiment: {
          select: {
            publicId: true,
            title: true,
            integrityStatus: true,
            recordCount: true,
          },
        },
      },
    });

    const formatted = submissions.map((sub) => {
      let authors: string[] = [];
      try {
        authors = JSON.parse(sub.authors);
      } catch {
        authors = [sub.authors];
      }

      return {
        id: sub.id,
        publicId: sub.publicId,
        experimentId: sub.experimentId,
        experimentPublicId: sub.experiment?.publicId,
        title: sub.title,
        abstract: sub.abstract,
        authors,
        institution: sub.institution,
        status: sub.status,
        totalRecords: sub.totalRecords,
        verifiedRecords: sub.verifiedRecords,
        integrityStatus: sub.integrityStatus,
        submittedAt: sub.submittedAt?.toISOString() || sub.createdAt.toISOString(),
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("GET /api/submissions Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { experimentId, title, abstract, authors, institution } = body;

    if (!title || !authors) {
      return NextResponse.json(
        { error: "Missing required fields: 'title' and 'authors' are required." },
        { status: 400 }
      );
    }

    let experiment = null;
    if (experimentId) {
      experiment = await prisma.experiment.findFirst({
        where: {
          AND: [
            { OR: [{ id: experimentId }, { publicId: experimentId }] },
            { userId: user.id },
          ],
        },
        include: {
          _count: { select: { measurements: true } },
        },
      });

      if (!experiment) {
        return NextResponse.json({ error: "Selected experiment not found or access denied" }, { status: 404 });
      }
    }

    const totalSubmissions = await prisma.submission.count();
    const publicId = `SUB-2026-${String(totalSubmissions + 1043).padStart(4, "0")}`;
    const totalRecords = experiment?._count.measurements || 0;
    const verifiedRecords = experiment?.integrityStatus === "verified" ? totalRecords : 0;

    const submission = await prisma.submission.create({
      data: {
        publicId,
        userId: user.id,
        experimentId: experiment?.id || null,
        title,
        abstract: abstract || null,
        authors: Array.isArray(authors) ? JSON.stringify(authors) : JSON.stringify([authors]),
        institution: institution || user.institutionName || "Independent Research Institute",
        status: "under_review",
        totalRecords,
        verifiedRecords,
        integrityStatus: experiment?.integrityStatus || "verified",
        submittedAt: new Date(),
      },
      include: {
        experiment: true,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/submissions Error:", error);
    return NextResponse.json(
      { error: "Failed to create submission", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
