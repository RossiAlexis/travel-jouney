import { revokeRefreshToken } from "@repo/db/auth";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// action: POST /api/auth/logout
export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { refreshToken?: string };
  try {
    body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  } catch {
    body = {};
  }

  if (body.refreshToken) await revokeRefreshToken(body.refreshToken);
  return json({ success: true });
}
