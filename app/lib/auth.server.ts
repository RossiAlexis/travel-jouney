import { db } from "./db.server";
import { getSession, commitSession, destroySession } from "./session.server";
import bcrypt from "bcryptjs";
import type { SessionUser } from "~/types";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  });

  return user;
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
  redirectTo: string
): Promise<Response> {
  const session = await getSession();
  session.set("userId", userId);

  // Create session record in database
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
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

  // Delete all sessions for this user (optional: could delete just the current one)
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

/**
 * Register a new user with email and password
 */
export async function registerUser(data: {
  email: string;
  username: string;
  displayName: string;
  password: string;
}): Promise<{ user: SessionUser } | { error: string }> {
  // Check if email already exists
  const existingEmail = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  // Check if username already exists
  const existingUsername = await db.user.findUnique({
    where: { username: data.username },
  });

  if (existingUsername) {
    return { error: "This username is already taken" };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      passwordHash,
      accounts: {
        create: {
          provider: "credentials",
          providerAccountId: data.email,
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  });

  return { user };
}

/**
 * Login with email and password
 */
export async function loginWithPassword(data: {
  email: string;
  password: string;
}): Promise<{ user: SessionUser } | { error: string }> {
  const user = await db.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    return { error: "Invalid email or password" };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}
