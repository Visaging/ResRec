import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { avatarUrl } = body;

    // Allow clearing the avatar
    if (avatarUrl === null || avatarUrl === "") {
      let user: any;
      try {
        user = await prisma.user.update({
          where: { id: sessionUser.id },
          data: { avatarUrl: null } as any,
        });
      } catch {
        await prisma.$executeRawUnsafe(
          'UPDATE "User" SET "avatarUrl" = NULL WHERE "id" = $1',
          sessionUser.id
        );
        user = {
          ...sessionUser,
          avatarUrl: null,
        };
      }
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: null,
          institutionId: user.institutionId,
          institutionName: user.institutionName,
          department: user.department,
          createdAt: user.createdAt,
        },
      });
    }

    if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid avatar data. Must be a data URL of an image." },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeMatch = avatarUrl.match(/^data:(image\/\w+);base64,/);
    if (!mimeMatch || !ALLOWED_TYPES.includes(mimeMatch[1])) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    // Check decoded size
    const base64Data = avatarUrl.split(",")[1];
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
    }
    const byteLength = Math.ceil((base64Data.length * 3) / 4);
    if (byteLength > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 2 MB." },
        { status: 400 }
      );
    }

    // Try Prisma update first; fall back to raw query if client was generated without avatarUrl
    let user: any;
    try {
      user = await prisma.user.update({
        where: { id: sessionUser.id },
        data: { avatarUrl: avatarUrl || null } as any,
      });
    } catch {
      await prisma.$executeRawUnsafe(
        'UPDATE "User" SET "avatarUrl" = $1 WHERE "id" = $2',
        avatarUrl || null,
        sessionUser.id
      );
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT "id", "name", "email", "role", "avatarUrl", "institutionId", "institutionName", "department", "createdAt" FROM "User" WHERE "id" = $1',
        sessionUser.id
      );
      user = rows[0] || {
        ...sessionUser,
        avatarUrl: avatarUrl || null,
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? (avatarUrl || null),
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/auth/avatar error:", error);
    return NextResponse.json({ error: "Unable to update avatar." }, { status: 500 });
  }
}
