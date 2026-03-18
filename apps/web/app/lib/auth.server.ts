import { db } from "./db.server";
import { getSession, commitSession, destroySession } from "./session.server";
import type { SessionUser } from "~/types";

export { hashPassword, verifyPassword, loginWithPassword, registerUser } from "@repo/db/auth";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches cookie maxAge

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getUser(request: Request): Promise<SessionUser | null> {
  const cookieSession = await getSession(request.headers.get("Cookie"));
  const userId = cookieSession.get("userId");

  if (!userId) {
    return null;
  }

  // Check session validity in DB and fetch user in a single query
  const sessionWithUser = await db.session.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
  });
  if (!sessionWithUser) return null;

  return sessionWithUser.user;
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in loaders for protected routes
 */
export async function requireAuth(request: Request): Promise<SessionUser> {
  const user = await getUser(request);

  if (!user) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }

  return user;
}

/**
 * Create a session for a user after login
 */
export async function createUserSession(
  userId: string,
  redirectTo: string,
): Promise<Response> {
  const session = await getSession();
  session.set("userId", userId);

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await commitSession(session),
    },
  });
}

/**
 * Log out - destroy session and redirect
 */
export async function logout(request: Request): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (userId) {
    await db.session.deleteMany({
      where: { userId },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": await destroySession(session),
    },
  });
}
