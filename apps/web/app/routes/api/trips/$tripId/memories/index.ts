import { requireApiAuth } from "~/lib/resolve-user.server";
import { listMemories, createMemory, ServiceError } from "@repo/services";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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
    return json(memories);
  } catch (err) {
    if (err instanceof ServiceError) return json({ error: err.message }, err.status);
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
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const user = await requireApiAuth(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.title) return json({ error: "title is required" }, 400);
  if (!body.content) return json({ error: "content is required" }, 400);
  if (!body.date) return json({ error: "date is required" }, 400);
  try {
    const memory = await createMemory(params.tripId, user.id, body as any);
    return json(memory, 201);
  } catch (err) {
    if (err instanceof ServiceError) return json({ error: err.message }, err.status);
    throw err;
  }
}
