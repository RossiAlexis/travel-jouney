import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "@repo/db";
import { auth } from "./routes/auth.js";
import { trips } from "./routes/trips.js";
import { memories } from "./routes/memories.js";
import { expenses } from "./routes/expenses.js";
import { profile } from "./routes/profile.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8081',
      process.env.ALLOWED_ORIGIN,
    ].filter(Boolean) as string[];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
}));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", auth);
app.route("/trips", trips);
app.route("/trips/:tripId/memories", memories);
app.route("/trips/:tripId/expenses", expenses);
app.route("/me", profile);

// Internal cleanup — call from a cron job
app.post("/internal/cleanup", async (c) => {
  if (c.req.header("X-Internal-Key") !== process.env.INTERNAL_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const [sessions, refreshTokens] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  return c.json({ sessions: sessions.count, refreshTokens: refreshTokens.count });
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on http://localhost:${port}`);
});
