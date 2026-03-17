import { requireApiAuth } from "~/lib/resolve-user.server";
import { listExpenses, createExpense, ServiceError } from "@repo/services";

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
    const result = await listExpenses(params.tripId, user.id);
    return json(result); // { expenses, totals }
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
  if (!body.description) return json({ error: "description is required" }, 400);
  if (!body.amount) return json({ error: "amount is required" }, 400);
  if (!body.currency) return json({ error: "currency is required" }, 400);
  if (!body.date) return json({ error: "date is required" }, 400);
  try {
    const expense = await createExpense(params.tripId, user.id, body as any);
    return json(expense, 201);
  } catch (err) {
    if (err instanceof ServiceError) return json({ error: err.message }, err.status);
    throw err;
  }
}
