import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSessionToken, getSessionUser } from "@/lib/auth/server";

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "New password must be different from the current password." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { passwordHash: true, salt: true },
    });
    if (!user?.passwordHash || !user.salt || !verifyPassword(currentPassword, user.passwordHash, user.salt)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const { hash, salt } = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash: hash, salt },
    });

    const currentToken = await getSessionToken(request);
    if (currentToken) {
      await prisma.session.deleteMany({
        where: { userId: sessionUser.id, token: { not: currentToken } },
      });
    }

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("PATCH /api/auth/password error:", error);
    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}