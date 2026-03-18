import { requireApiAuth } from "~/lib/resolve-user.server";
import { listExpenses, createExpense, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

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
    return apiResponse(result, 200, request); // { expenses, totals }
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
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
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "POST") return apiResponse({ error: "Method not allowed" }, 405, request);
  const user = await requireApiAuth(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiResponse({ error: "Invalid JSON body" }, 400, request);
  }
  if (!body.description) return apiResponse({ error: "description is required" }, 400, request);
  if (!body.amount) return apiResponse({ error: "amount is required" }, 400, request);
  if (!body.currency) return apiResponse({ error: "currency is required" }, 400, request);
  if (!body.date) return apiResponse({ error: "date is required" }, 400, request);
  try {
    const expense = await createExpense(params.tripId, user.id, body as Parameters<typeof createExpense>[2]);
    return apiResponse(expense, 201, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}
