import { verifyRefreshToken, revokeRefreshToken, createRefreshToken } from "@repo/db/auth";
import { db } from "~/lib/db.server";
import { signToken } from "~/lib/jwt.server";

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// action: POST /api/auth/refresh
export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { refreshToken?: string };
  try {
    body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  } catch {
    body = {};
  }

  if (!body.refreshToken) return json({ error: "Refresh token required" }, 400);

  const userId = await verifyRefreshToken(body.refreshToken);
  if (!userId) return json({ error: "Invalid or expired refresh token" }, 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return json({ error: "User not found" }, 404);

  await revokeRefreshToken(body.refreshToken);
  const newRefreshToken = await createRefreshToken(userId);
  const accessToken = await signToken(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    },
    "15m",
  );

  return json({ token: accessToken, refreshToken: newRefreshToken });
}
