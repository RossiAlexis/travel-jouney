import { requireApiAuth } from "~/lib/resolve-user.server";
import { getTripStats, ServiceError } from "@repo/services";

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
    const stats = await getTripStats(params.tripId, user.id);
    return json(stats);
  } catch (err: unknown) {
    if (err instanceof ServiceError) {
      return json({ error: err.message }, err.status);
    }
    throw err;
  }
}
