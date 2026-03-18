import { registerUser, createRefreshToken } from "@repo/db/auth";
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

  let body: { email?: string; password?: string; username?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }

  if (!body.email || !body.password || !body.username || !body.displayName) {
    return apiResponse({ error: "Email, password, username, and displayName are required" }, 400, request);
  }

  const result = await registerUser({
    email: body.email,
    password: body.password,
    username: body.username,
    displayName: body.displayName,
  });
  if ("error" in result) return apiResponse({ error: result.error }, 409, request);

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return apiResponse({ token, refreshToken, user: result.user }, 201, request);
}
