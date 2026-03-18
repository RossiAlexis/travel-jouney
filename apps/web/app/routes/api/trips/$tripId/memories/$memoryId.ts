import { requireApiAuth } from "~/lib/resolve-user.server";
import { getMemoryById, updateMemory, deleteMemory, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string; memoryId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  try {
    const memory = await getMemoryById(params.memoryId, params.tripId, user.id);
    if (!memory) return apiResponse({ error: "Memory not found" }, 404, request);
    return apiResponse(memory, 200, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string; memoryId: string };
}): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const user = await requireApiAuth(request);

  if (request.method === "DELETE") {
    try {
      await deleteMemory(params.memoryId, user.id);
      return apiResponse({ success: true }, 200, request);
    } catch (err) {
      if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
      throw err;
    }
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiResponse({ error: "Invalid JSON body" }, 400, request);
    }
    try {
      const memory = await updateMemory(params.memoryId, user.id, body as Parameters<typeof updateMemory>[2]);
      return apiResponse(memory, 200, request);
    } catch (err) {
      if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
      throw err;
    }
  }

  return apiResponse({ error: "Method not allowed" }, 405, request);
}
