import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

// GET /api/health — used by load balancers and uptime monitoring
export async function loader({ request }: { request: Request }): Promise<Response> {
  return apiResponse({ status: "ok", timestamp: new Date().toISOString() }, 200, request);
}

// Support OPTIONS preflight for CORS-aware health checks
export async function action({ request }: { request: Request }): Promise<Response> {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;
  return apiResponse({ error: "Method not allowed" }, 405, request);
}
