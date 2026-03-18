import { requireApiAuth } from "~/lib/resolve-user.server";
import { listMemories, createMemory, CreateMemorySchema, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  try {
    const memories = await listMemories(params.tripId, user.id);
    return apiResponse(memories, 200, request);
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
  params: { tripId: string };
}): Promise<Response> {
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

  const parsed = CreateMemorySchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiResponse({ error: "Validation failed", details: parsed.error.flatten() }, 400, request);
  }

  try {
    const memory = await createMemory(params.tripId, user.id, parsed.data);
    return apiResponse(memory, 201, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}
