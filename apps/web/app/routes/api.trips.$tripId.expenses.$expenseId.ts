import { requireApiAuth } from "~/lib/resolve-user.server";
import { deleteExpense, ServiceError } from "@repo/services";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string; expenseId: string };
}): Promise<Response> {
  if (request.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
  const user = await requireApiAuth(request);
  try {
    await deleteExpense(params.expenseId, params.tripId, user.id);
    return json({ success: true });
  } catch (err) {
    if (err instanceof ServiceError) return json({ error: err.message }, err.status);
    throw err;
  }
}
