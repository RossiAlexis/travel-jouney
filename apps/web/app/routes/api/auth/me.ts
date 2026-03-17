import { requireApiAuth } from "~/lib/resolve-user.server";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// loader: GET /api/auth/me
export async function loader({ request }: { request: Request }): Promise<Response> {
  const user = await requireApiAuth(request);
  return json({ user });
}
