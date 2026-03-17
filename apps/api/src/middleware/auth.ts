import type { Context, Next } from "hono";
import { verifyToken, type TokenPayload } from "../lib/jwt.js";

type Variables = {
  user: TokenPayload;
};

export async function authMiddleware(
  c: Context<{ Variables: Variables }>,
  next: Next,
) {
  const authorization = c.req.header("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authorization.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", payload);
  await next();
}
