import { requireApiAuth } from "~/lib/resolve-user.server";
import { getMemoryById, updateMemory, deleteMemory, ServiceError } from "@repo/services";

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
  params: { tripId: string; memoryId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);
  try {
    const memory = await getMemoryById(params.memoryId, params.tripId, user.id);
    if (!memory) return json({ error: "Memory not found" }, 404);
    return json(memory);
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
  params: { tripId: string; memoryId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);

  if (request.method === "DELETE") {
    try {
      await deleteMemory(params.memoryId, user.id);
      return json({ success: true });
    } catch (err) {
      if (err instanceof ServiceError) return json({ error: err.message }, err.status);
      throw err;
    }
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    try {
      const memory = await updateMemory(params.memoryId, user.id, body as any);
      return json(memory);
    } catch (err) {
      if (err instanceof ServiceError) return json({ error: err.message }, err.status);
      throw err;
    }
  }

  return json({ error: "Method not allowed" }, 405);
}
