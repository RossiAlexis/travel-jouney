/*
 * Token Strategy:
 * - Access token (JWT): 15-minute lifetime, returned as JSON for mobile (stored in expo-secure-store)
 * - Refresh token: 30-day lifetime, returned as JSON for mobile clients
 * - Web clients: For web sessions, cookies are used (httpOnly, sameSite=lax)
 * - Mobile clients: Tokens stored in expo-secure-store (platform-encrypted secure storage)
 * - Refresh token rotation: each refresh issues a new refresh token and revokes the old one
 */
import { loginWithPassword, createRefreshToken } from "@repo/db/auth";
import { LoginSchema } from "@repo/services";
import { signToken } from "~/lib/jwt.server";
import { getClientIp, checkAuthRateLimit } from "~/lib/rate-limit.server";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return apiResponse({ error: "Method not allowed" }, 405, request);
  }

  // Rate limit
  const ip = getClientIp(request);
  if (!checkAuthRateLimit(ip)) {
    return apiResponse({ error: "Too many requests" }, 429, request);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }

  const parsed = LoginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiResponse({ error: "Validation failed", details: parsed.error.flatten() }, 400, request);
  }

  const result = await loginWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if ("error" in result) {
    return apiResponse({ error: result.error }, 401, request);
  }

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return apiResponse({ token, refreshToken, user: result.user }, 200, request);
}
