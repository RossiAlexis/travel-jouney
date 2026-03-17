import { Hono } from "hono";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const profile = new Hono<{ Variables: Variables }>();

profile.use("*", authMiddleware);

profile.get("/", (c) => {
  const user = c.get("user");
  return c.json({ user });
});

profile.put("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    displayName?: string;
    bio?: string;
    avatar?: string;
  }>();

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(body.displayName !== undefined && { displayName: body.displayName }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.avatar !== undefined && { avatar: body.avatar }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
    },
  });

  return c.json({ user: updated });
});

export { profile };
