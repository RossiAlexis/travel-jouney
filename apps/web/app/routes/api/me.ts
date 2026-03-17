import { requireApiAuth } from "~/lib/resolve-user.server";
import { getProfile, updateProfile } from "@repo/services";
import { ServiceError } from "@repo/services";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/me — returns user profile
export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  const profile = await getProfile(user.id);
  if (!profile) return json({ error: "User not found" }, 404);
  return json({ user: profile });
}

// PUT /api/me — update profile
export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "PUT" && request.method !== "PATCH") {
    return json({ error: "Method not allowed" }, 405);
  }
  const user = await requireApiAuth(request);
  let body: { displayName?: string; bio?: string | null; avatar?: string | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  try {
    const updated = await updateProfile(user.id, body);
    return json({ user: updated });
  } catch (err) {
    if (err instanceof ServiceError) return json({ error: err.message }, err.status);
    throw err;
  }
}
