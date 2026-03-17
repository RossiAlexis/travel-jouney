import { requireApiAuth } from "~/lib/resolve-user.server";
import { getTripById, updateTrip, deleteTrip, ServiceError } from "@repo/services";

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
  const trip = await getTripById(params.tripId, user.id);
  if (!trip) return json({ error: "Trip not found" }, 404);
  return json(trip);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string };
}): Promise<Response> {
  const user = await requireApiAuth(request);

  if (request.method === "DELETE") {
    try {
      await deleteTrip(params.tripId, user.id);
    } catch (err: unknown) {
      if (err instanceof ServiceError) {
        return json({ error: err.message }, err.status);
      }
      throw err;
    }
    return json({ success: true });
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    try {
      const trip = await updateTrip(params.tripId, user.id, body as any);
      return json(trip);
    } catch (err: unknown) {
      if (err instanceof ServiceError) {
        return json({ error: err.message }, err.status);
      }
      throw err;
    }
  }

  return json({ error: "Method not allowed" }, 405);
}
