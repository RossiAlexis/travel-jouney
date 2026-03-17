import { Hono } from "hono";
import {
  loginWithPassword,
  registerUser,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "@repo/db/auth";
import { db } from "@repo/db";
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

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return c.json({ token, refreshToken, user: result.user });
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

  const token = await signToken(result.user, "15m");
  const refreshToken = await createRefreshToken(result.user.id);
  return c.json({ token, refreshToken, user: result.user }, 201);
});

auth.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

auth.post("/refresh", async (c) => {
  const body = (await c
    .req
    .json<{ refreshToken?: string }>()
    .catch(() => ({}))) as { refreshToken?: string };
  if (!body.refreshToken)
    return c.json({ error: "Refresh token required" }, 400);

  const userId = await verifyRefreshToken(body.refreshToken);
  if (!userId) return c.json({ error: "Invalid or expired refresh token" }, 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return c.json({ error: "User not found" }, 404);

  // Rotate refresh token
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

  return c.json({ token: accessToken, refreshToken: newRefreshToken });
});

auth.post("/logout", async (c) => {
  const body = (await c
    .req
    .json<{ refreshToken?: string }>()
    .catch(() => ({}))) as { refreshToken?: string };
  if (body.refreshToken) {
    await revokeRefreshToken(body.refreshToken);
  }
  return c.json({ success: true });
});

export { auth };
