import { requireApiAuth } from "~/lib/resolve-user.server";
import { getMemoryById, updateMemory, deleteMemory, UpdateMemorySchema, ServiceError } from "@repo/services";
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
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiResponse({ error: "Invalid JSON body" }, 400, request);
    }

    const parsed = UpdateMemorySchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiResponse({ error: "Validation failed", details: parsed.error.flatten() }, 400, request);
    }

    try {
      const memory = await updateMemory(params.memoryId, user.id, parsed.data);
      return apiResponse(memory, 200, request);
    } catch (err) {
      if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
      throw err;
    }
  }

  return apiResponse({ error: "Method not allowed" }, 405, request);
}
