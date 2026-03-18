import { getUser } from "./auth.server";
import { verifyToken } from "./jwt.server";
import type { SessionUser } from "~/types";

/**
 * Dual-auth: tries Bearer JWT first (mobile), then cookie session (web).
 * Returns null if neither is valid.
 * Never throws.
 */
export async function resolveUser(request: Request): Promise<SessionUser | null> {
  const authorization = request.headers.get("Authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    const payload = await verifyToken(token);
    if (!payload) return null; // expired/invalid JWT → do not fall through to cookie
    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      displayName: payload.displayName,
      avatar: payload.avatar,
    };
  }

  return getUser(request);
}

/**
 * Like resolveUser, but throws a 401 JSON Response if not authenticated.
 * Use this in /api/* resource routes (not in web form routes — those use requireAuth).
 */
export async function requireApiAuth(request: Request): Promise<SessionUser> {
  const user = await resolveUser(request);
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="api"',
        },
      },
    );
  }
  return user;
}
