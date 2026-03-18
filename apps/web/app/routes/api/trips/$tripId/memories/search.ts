import { requireApiAuth } from "~/lib/resolve-user.server";
import { searchMemories, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return apiResponse({ results: [], query: q }, 200, request);
  try {
    const result = await searchMemories(params.tripId, user.id, q);
    return apiResponse(result, 200, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;
  return apiResponse({ error: "Method not allowed" }, 405, request);
}
