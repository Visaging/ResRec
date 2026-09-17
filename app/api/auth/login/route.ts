import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        institution: true,
      },
    });

    if (!user || !user.passwordHash || !user.salt) {
      return NextResponse.json(
        { error: "Invalid institutional email or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid institutional email or password." },
        { status: 401 }
      );
    }

    const { token, expiresAt } = await createSession(user.id);

    let avatarUrl: string | null = (user as any).avatarUrl || null;
    if (avatarUrl === null || avatarUrl === undefined) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          'SELECT "avatarUrl" FROM "User" WHERE "id" = $1',
          user.id
        );
        if (rows?.[0]?.avatarUrl) {
          avatarUrl = rows[0].avatarUrl;
        }
      } catch {}
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: avatarUrl || null,
        institutionId: user.institutionId,
        institutionName: user.institutionName || user.institution?.name || null,
        department: user.department,
        createdAt: user.createdAt,
      },
      token,
      message: "Authentication successful.",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during sign in.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
