import { getSession, commitSession, destroySession } from "./session.server";
import { err, ok, type Result } from "~/lib/result";
import type { Repositories } from "~/lib/repositories";
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
  const storedBuffer = Uint8Array.from(atob(storedHashB64), (c) =>
    c.charCodeAt(0)
  );
  // timingSafeEqual is a Cloudflare Workers extension on SubtleCrypto
  const subtle = crypto.subtle as unknown as {
    timingSafeEqual(
      a: ArrayBuffer | ArrayBufferView,
      b: ArrayBuffer | ArrayBufferView
    ): boolean;
  };
  return subtle.timingSafeEqual(hashBuffer, storedBuffer);
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getUser(
  repos: Pick<Repositories, "users">,
  request: Request
): Promise<SessionUser | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return null;
  }

  return repos.users.findSessionUserById(userId);
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in loaders for protected routes
 */
export async function requireAuth(
  repos: Pick<Repositories, "users">,
  request: Request
): Promise<SessionUser> {
  const user = await getUser(repos, request);

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
  repos: Pick<Repositories, "sessions">,
  userId: string,
  redirectTo: string
): Promise<Response> {
  const session = await getSession();
  session.set("userId", userId);

  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await repos.sessions.create({ userId, expiresAt });

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
  repos: Pick<Repositories, "sessions">,
  request: Request
): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (userId) {
    await repos.sessions.deleteByUserId(userId);
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
  repos: Pick<Repositories, "users" | "accounts">,
  data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }
): Promise<Result<SessionUser>> {
  const existingEmail = await repos.users.findByEmail(data.email);

  if (existingEmail) {
    return err("An account with this email already exists");
  }

  const existingUsername = await repos.users.findByUsername(data.username);

  if (existingUsername) {
    return err("This username is already taken");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await repos.users.create({
    email: data.email,
    username: data.username,
    displayName: data.displayName,
    passwordHash,
  });

  await repos.accounts.create({
    userId: user.id,
    provider: "credentials",
    providerAccountId: data.email,
  });

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  });
}

/**
 * Login with email and password
 */
export async function loginWithPassword(
  repos: Pick<Repositories, "users">,
  data: {
    email: string;
    password: string;
  }
): Promise<Result<SessionUser>> {
  const user = await repos.users.findByEmail(data.email);

  if (!user || !user.passwordHash) {
    return err("Invalid email or password");
  }

  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    return err("Invalid email or password");
  }

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  });
}
