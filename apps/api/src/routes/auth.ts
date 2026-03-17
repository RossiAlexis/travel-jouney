import { Hono } from "hono";
import { loginWithPassword, registerUser } from "@repo/db/auth";
import { signToken } from "../lib/jwt.js";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const auth = new Hono<{ Variables: Variables }>();

auth.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const result = await loginWithPassword({
    email: body.email,
    password: body.password,
  });

  if ("error" in result) {
    return c.json({ error: result.error }, 401);
  }

  const token = await signToken(result.user);
  return c.json({ token, user: result.user });
});

auth.post("/register", async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    username: string;
    displayName: string;
  }>();

  if (!body.email || !body.password || !body.username || !body.displayName) {
    return c.json(
      { error: "Email, password, username, and displayName are required" },
      400,
    );
  }

  const result = await registerUser({
    email: body.email,
    password: body.password,
    username: body.username,
    displayName: body.displayName,
  });

  if ("error" in result) {
    return c.json({ error: result.error }, 409);
  }

  const token = await signToken(result.user);
  return c.json({ token, user: result.user }, 201);
});

auth.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export { auth };
