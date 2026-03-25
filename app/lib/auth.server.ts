import { getSession, commitSession, destroySession } from "./session.server";
import type { PrismaClient } from "../generated/prisma";
import type { SessionUser } from "~/types";

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

/**
 * Hash a password using Web Crypto PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return `pbkdf2:${saltB64}:${hashB64}`;
}

/**
 * Verify a password against a PBKDF2 hash
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [prefix, saltB64, storedHashB64] = stored.split(":");
  if (prefix !== "pbkdf2") return false;
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return hashB64 === storedHashB64;
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getUser(
  db: PrismaClient,
  request: Request
): Promise<SessionUser | null> {
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
export async function requireAuth(
  db: PrismaClient,
  request: Request
): Promise<SessionUser> {
  const user = await getUser(db, request);

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
  db: PrismaClient,
  userId: string,
  redirectTo: string
): Promise<Response> {
  const session = await getSession();
  session.set("userId", userId);

  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
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
export async function logout(
  db: PrismaClient,
  request: Request
): Promise<Response> {
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

/**
 * Register a new user with email and password
 */
export async function registerUser(
  db: PrismaClient,
  data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }
): Promise<{ user: SessionUser } | { error: string }> {
  const existingEmail = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  const existingUsername = await db.user.findUnique({
    where: { username: data.username },
  });

  if (existingUsername) {
    return { error: "This username is already taken" };
  }

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
export async function loginWithPassword(
  db: PrismaClient,
  data: {
    email: string;
    password: string;
  }
): Promise<{ user: SessionUser } | { error: string }> {
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
