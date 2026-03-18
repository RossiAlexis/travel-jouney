import { revokeRefreshToken } from "@repo/db/auth";
import { z } from "zod";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// action: POST /api/auth/logout
export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") return apiResponse({ error: "Method not allowed" }, 405, request);

  let rawBody: unknown;
  try {
    rawBody = await request.json().catch(() => ({}));
  } catch {
    rawBody = {};
  }

  const parsed = LogoutSchema.safeParse(rawBody);
  const refreshToken = parsed.success ? parsed.data.refreshToken : undefined;

  if (refreshToken) await revokeRefreshToken(refreshToken);
  return apiResponse({ success: true }, 200, request);
}
