import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "resrec_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string | null;
  institutionName?: string | null;
  department?: string | null;
  createdAt?: Date | string;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message = "Authentication required", statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Extracts session token from incoming request headers, token string, or Next.js cookies store.
 */
export async function getSessionToken(reqOrToken?: Request | string): Promise<string | null> {
  if (typeof reqOrToken === "string") {
    return reqOrToken;
  }

  const req = reqOrToken;
  // 1. Check Authorization header: Bearer <token>
  if (req && typeof req.headers?.get === "function") {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) return token;
    }

    // 2. Check Cookie header from Request if provided
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  // 3. Fallback to Next.js cookies() store
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return sessionCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Validates session token and returns the authenticated user, or null if unauthenticated.
 */
export async function getSessionUser(req?: Request): Promise<AuthenticatedUser | null> {
  try {
    const token = await getSessionToken(req);
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            institution: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session asynchronously
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      institutionId: session.user.institutionId,
      institutionName: session.user.institutionName || session.user.institution?.name || null,
      department: session.user.department || null,
      createdAt: session.user.createdAt,
    };
  } catch (error) {
    console.error("Error retrieving session user:", error);
    return null;
  }
}

/**
 * Enforces authentication. Throws AuthError if user is not authenticated.
 */
export async function requireAuth(req?: Request): Promise<AuthenticatedUser> {
  const user = await getSessionUser(req);
  if (!user) {
    throw new AuthError("Authentication required. Please sign in to access this resource.", 401);
  }
  return user;
}

/**
 * Creates a new session in DB and sets the secure httpOnly cookie.
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  } catch {
    // In contexts where cookies() is read-only (e.g. some middleware routes), caller can set header
  }

  return { token, expiresAt };
}

/**
 * Deletes current session from DB and clears the cookie.
 */
export async function destroySession(reqOrToken?: Request | string): Promise<void> {
  const token = await getSessionToken(reqOrToken);
  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    }).catch(() => {});
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // In contexts where cookies() is read-only
  }
}
