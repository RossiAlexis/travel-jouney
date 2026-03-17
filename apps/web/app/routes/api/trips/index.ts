import { requireApiAuth } from "~/lib/resolve-user.server";
import { listTrips, createTrip } from "@repo/services";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  const trips = await listTrips(user.id);
  return json(trips);
}

export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const user = await requireApiAuth(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.title) return json({ error: "title is required" }, 400);
  if (!body.startDate) return json({ error: "startDate is required" }, 400);
  const trip = await createTrip(user.id, body as any);
  return json(trip, 201);
}
