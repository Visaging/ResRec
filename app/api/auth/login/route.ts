import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/server";

const DEMO_PROFILES: Record<string, {
  name: string;
  institutionName: string;
  department: string;
  role: string;
}> = {
  "akshat.agrawal@iitb.ac.in": {
    name: "Akshat Agrawal",
    institutionName: "Indian Institute of Technology Bombay",
    department: "Materials Science & Battery Storage",
    role: "RESEARCHER",
  },
  "armaan.singh@iisc.ac.in": {
    name: "Armaan Singh",
    institutionName: "Indian Institute of Science, Bengaluru",
    department: "Genomics & CRISPR Therapeutics",
    role: "RESEARCHER",
  },
  "ayush.roy@iitd.ac.in": {
    name: "Ayush Roy",
    institutionName: "Indian Institute of Technology Delhi",
    department: "High Pressure Condensed Matter",
    role: "RESEARCHER",
  },
  "abhinav.raturi@iitm.ac.in": {
    name: "Abhinav Raturi",
    institutionName: "Indian Institute of Technology Madras",
    department: "Materials Science & Review Board",
    role: "REVIEWER",
  },
};

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

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        institution: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid institutional email or password." },
        { status: 401 }
      );
    }

    const demoProfile = DEMO_PROFILES[normalizedEmail];
    if (demoProfile) {
      const demoInstitution = await prisma.institution.findFirst({
        where: { name: demoProfile.institutionName },
      });
      const demoAuth = hashPassword("password123");
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: demoProfile.name,
          institutionName: demoProfile.institutionName,
          department: demoProfile.department,
          role: demoProfile.role,
          passwordHash: demoAuth.hash,
          salt: demoAuth.salt,
          ...(demoInstitution ? { institutionId: demoInstitution.id } : {}),
        },
        include: { institution: true },
      });
    }

    if (!user.passwordHash || !user.salt) {
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

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
