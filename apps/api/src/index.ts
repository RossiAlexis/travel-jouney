import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./routes/auth.js";
import { trips } from "./routes/trips.js";
import { memories } from "./routes/memories.js";
import { expenses } from "./routes/expenses.js";
import { profile } from "./routes/profile.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", auth);
app.route("/trips", trips);
app.route("/trips/:tripId/memories", memories);
app.route("/trips/:tripId/expenses", expenses);
app.route("/me", profile);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on http://localhost:${port}`);
});
