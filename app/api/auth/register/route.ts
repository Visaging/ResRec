import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, institutionName, department, role } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Researcher name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid institutional email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters in length." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    let institutionId: string | null = null;
    const cleanInstName = typeof institutionName === "string" ? institutionName.trim() : "";
    if (cleanInstName) {
      const inst = await prisma.institution.findFirst({
        where: { name: cleanInstName },
      });
      if (inst) {
        institutionId = inst.id;
      } else {
        const newInst = await prisma.institution.create({
          data: { name: cleanInstName },
        });
        institutionId = newInst.id;
      }
    }

    const { hash, salt } = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hash,
        salt,
        role: role === "REVIEWER" || role === "ADMIN" ? role : "RESEARCHER",
        institutionName: cleanInstName || null,
        department: typeof department === "string" && department.trim() ? department.trim() : null,
        institutionId,
      },
      include: {
        institution: true,
      },
    });

    // Create session and set cookie
    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || null,
          institutionId: user.institutionId,
          institutionName: user.institutionName || user.institution?.name || null,
          department: user.department,
          createdAt: user.createdAt,
        },
        token,
        message: "Account registered successfully.",
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    const message = error instanceof Error ? error.message : "An error occurred during account creation.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
