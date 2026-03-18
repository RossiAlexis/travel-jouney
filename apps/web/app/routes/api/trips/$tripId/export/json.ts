import { requireApiAuth } from "~/lib/resolve-user.server";
import { exportTripAsJson, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";
import { getCorsHeaders } from "~/lib/cors.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  try {
    const data = await exportTripAsJson(params.tripId, user.id);
    const filename = `trip-${params.tripId}.json`;
    const corsHeaders = getCorsHeaders(request);
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...corsHeaders,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ServiceError) {
      return apiResponse({ error: err.message }, err.status, request);
    }
    throw err;
  }
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;
  return apiResponse({ error: "Method not allowed" }, 405, request);
}
