import { registerUser, createRefreshToken } from "@repo/db/auth";
import { signToken } from "~/lib/jwt.server";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { email?: string; password?: string; username?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email || !body.password || !body.username || !body.displayName) {
    return json({ error: "Email, password, username, and displayName are required" }, 400);
  }

  const result = await registerUser({
    email: body.email,
    password: body.password,
    username: body.username,
    displayName: body.displayName,
  });
  if ("error" in result) return json({ error: result.error }, 409);

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return json({ token, refreshToken, user: result.user }, 201);
}
