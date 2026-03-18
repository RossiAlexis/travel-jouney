import { requireApiAuth } from "~/lib/resolve-user.server";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

// loader: GET /api/auth/me
export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  return apiResponse({ user }, 200, request);
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;
  return apiResponse({ error: "Method not allowed" }, 405, request);
}
