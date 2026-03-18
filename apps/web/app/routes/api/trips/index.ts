import { requireApiAuth } from "~/lib/resolve-user.server";
import { listTrips, createTrip } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  const trips = await listTrips(user.id);
  return apiResponse(trips, 200, request);
}

export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") return apiResponse({ error: "Method not allowed" }, 405, request);
  const user = await requireApiAuth(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }
  if (!body.title) return apiResponse({ error: "title is required" }, 400, request);
  if (!body.startDate) return apiResponse({ error: "startDate is required" }, 400, request);
  const trip = await createTrip(user.id, body as Parameters<typeof createTrip>[1]);
  return apiResponse(trip, 201, request);
}
