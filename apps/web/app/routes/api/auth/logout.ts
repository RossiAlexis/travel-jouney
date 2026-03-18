import { revokeRefreshToken } from "@repo/db/auth";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

// action: POST /api/auth/logout
export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") return apiResponse({ error: "Method not allowed" }, 405, request);

  let body: { refreshToken?: string };
  try {
    body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  } catch {
    body = {};
  }

  if (body.refreshToken) await revokeRefreshToken(body.refreshToken);
  return apiResponse({ success: true }, 200, request);
}
