import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionToken, getSessionUser } from "@/lib/auth/server";
import { verifyPassword } from "@/lib/auth/password";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const institutionName = typeof body.institutionName === "string" ? body.institutionName.trim() : "";
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (name.length > 120 || institutionName.length > 200 || department.length > 160) {
      return NextResponse.json({ error: "One or more profile fields are too long." }, { status: 400 });
    }

    if (email !== sessionUser.email) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change your email." }, { status: 400 });
      }
      const credentials = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { passwordHash: true, salt: true },
      });
      if (!credentials?.passwordHash || !credentials.salt || !verifyPassword(currentPassword, credentials.passwordHash, credentials.salt)) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { email, NOT: { id: sessionUser.id } },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }

    let institutionId: string | null = null;
    if (institutionName) {
      const institution = await prisma.institution.findFirst({ where: { name: institutionName } });
      institutionId = institution?.id || null;
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name,
        email,
        institutionName: institutionName || null,
        institutionId,
        department: department || null,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/auth/profile error:", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}