import { requireApiAuth } from "~/lib/resolve-user.server";
import { exportTripAsJson, ServiceError } from "@repo/services";

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
    const data = await exportTripAsJson(params.tripId, user.id);
    const filename = `trip-${params.tripId}.json`;
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ServiceError) {
      return json({ error: err.message }, err.status);
    }
    throw err;
  }
}
