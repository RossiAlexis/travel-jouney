import { requireApiAuth } from "~/lib/resolve-user.server";
import { deleteExpense, ServiceError } from "@repo/services";
import { apiResponse, handleCorsPreflightRequest } from "~/lib/response.server";

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { tripId: string; expenseId: string };
}): Promise<Response> {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== "DELETE") return apiResponse({ error: "Method not allowed" }, 405, request);
  const user = await requireApiAuth(request);
  try {
    await deleteExpense(params.expenseId, params.tripId, user.id);
    return apiResponse({ success: true }, 200, request);
  } catch (err) {
    if (err instanceof ServiceError) return apiResponse({ error: err.message }, err.status, request);
    throw err;
  }
}
