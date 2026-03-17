import { loginWithPassword, createRefreshToken } from "@repo/db/auth";
import { signToken } from "~/lib/jwt.server";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email || !body.password) {
    return json({ error: "Email and password are required" }, 400);
  }

  const result = await loginWithPassword({ email: body.email, password: body.password });
  if ("error" in result) {
    return json({ error: result.error }, 401);
  }

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return json({ token, refreshToken, user: result.user }, 200);
}
