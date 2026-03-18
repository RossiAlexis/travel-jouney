import { requireApiAuth } from "~/lib/resolve-user.server";
import { getTripStats, ServiceError } from "@repo/services";
import { apiResponse } from "~/lib/response.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  try {
    const stats = await getTripStats(params.tripId, user.id);
    return apiResponse(stats, 200, request);
  } catch (err: unknown) {
    if (err instanceof ServiceError) {
      return apiResponse({ error: err.message }, err.status, request);
    }
    throw err;
  }
}
