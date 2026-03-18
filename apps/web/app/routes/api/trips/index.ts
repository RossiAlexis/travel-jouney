import { requireApiAuth } from "~/lib/resolve-user.server";
import { listTrips, createTrip, CreateTripSchema } from "@repo/services";
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }

  const parsed = CreateTripSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiResponse({ error: "Validation failed", details: parsed.error.flatten() }, 400, request);
  }

  const trip = await createTrip(user.id, parsed.data);
  return apiResponse(trip, 201, request);
}
