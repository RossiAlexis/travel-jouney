import { requireApiAuth } from "~/lib/resolve-user.server";
import { getProfile, updateProfile, UpdateProfileSchema, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

// GET /api/me — returns user profile
export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  const profile = await getProfile(user.id);
  if (!profile) return apiResponse({ error: "User not found" }, 404, request);
  return apiResponse({ user: profile }, 200, request);
}

// PUT /api/me — update profile
export async function action({ request }: { request: Request }): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "PUT" && request.method !== "PATCH") {
    return apiResponse({ error: "Method not allowed" }, 405, request);
  }
  const user = await requireApiAuth(request);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }

  const parsed = UpdateProfileSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiResponse({ error: "Validation failed", details: parsed.error.flatten() }, 400, request);
  }

  try {
    const updated = await updateProfile(user.id, parsed.data);
    return apiResponse({ user: updated }, 200, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}
