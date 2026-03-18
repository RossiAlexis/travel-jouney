import { verifyRefreshToken, rotateRefreshToken } from "@repo/db/auth";
import { RefreshTokenSchema, getProfile } from "@repo/services";
import { signToken } from "~/lib/jwt.server";
import { getClientIp, checkRefreshRateLimit } from "~/lib/rate-limit.server";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

// action: POST /api/auth/refresh
export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return apiResponse({ error: "Method not allowed" }, 405, request);
  }

  // Rate limit
  const ip = getClientIp(request);
  if (!checkRefreshRateLimit(ip)) {
    return apiResponse({ error: "Too many requests" }, 429, request);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }

  const parsed = RefreshTokenSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiResponse({ error: "Refresh token required" }, 400, request);
  }

  const userId = await verifyRefreshToken(parsed.data.refreshToken);
  if (!userId) return apiResponse({ error: "Invalid or expired refresh token" }, 401, request);

  const user = await getProfile(userId);
  if (!user) return apiResponse({ error: "User not found" }, 404, request);

  const newRefreshToken = await rotateRefreshToken(parsed.data.refreshToken, userId);
  const accessToken = await signToken(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    },
    "15m",
  );

  return apiResponse({ token: accessToken, refreshToken: newRefreshToken }, 200, request);
}
