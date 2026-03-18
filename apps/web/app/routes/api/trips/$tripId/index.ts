import { requireApiAuth } from "~/lib/resolve-user.server";
import { getTripById, updateTrip, deleteTrip, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  const trip = await getTripById(params.tripId, user.id);
  if (!trip) return apiResponse({ error: "Trip not found" }, 404, request);
  return apiResponse(trip, 200, request);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const user = await requireApiAuth(request);

  if (request.method === "DELETE") {
    try {
      await deleteTrip(params.tripId, user.id);
    } catch (err: unknown) {
      if (err instanceof ServiceError) {
        return apiResponse({ error: err.message }, err.status, request);
      }
      throw err;
    }
    return apiResponse({ success: true }, 200, request);
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiResponse({ error: "Invalid JSON body" }, 400, request);
    }
    try {
      const trip = await updateTrip(params.tripId, user.id, body as Parameters<typeof updateTrip>[2]);
      return apiResponse(trip, 200, request);
    } catch (err: unknown) {
      if (err instanceof ServiceError) {
        return apiResponse({ error: err.message }, err.status, request);
      }
      throw err;
    }
  }

  return apiResponse({ error: "Method not allowed" }, 405, request);
}
