import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const trips = new Hono<{ Variables: Variables }>();

trips.use("*", authMiddleware);

const createTripSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" })
    .optional(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});

const updateTripSchema = createTripSchema.partial().extend({
  isPublic: z.boolean().optional(),
});

trips.get("/", async (c) => {
  const user = c.get("user");

  const data = await db.trip.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { memories: true, expenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(data);
});

trips.post("/", zValidator("json", createTripSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const trip = await db.trip.create({
    data: {
      userId: user.id,
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: body.status ?? "PLANNED",
      budget: body.budget,
      currency: body.currency ?? "USD",
    },
  });

  return c.json(trip, 201);
});

trips.get("/:tripId", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
    include: {
      memories: {
        include: { photos: { take: 3, orderBy: { order: "asc" } } },
        orderBy: { date: "desc" },
      },
      _count: { select: { expenses: true } },
    },
  });

  if (!trip) return c.json({ error: "Trip not found" }, 404);
  return c.json(trip);
});

trips.put("/:tripId", zValidator("json", updateTripSchema), async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();
  const body = c.req.valid("json");

  const existing = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });

  if (!existing) return c.json({ error: "Trip not found" }, 404);

  const trip = await db.trip.update({
    where: { id: tripId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.startDate !== undefined && {
        startDate: new Date(body.startDate),
      }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.budget !== undefined && { budget: body.budget }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  });

  return c.json(trip);
});

trips.delete("/:tripId", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const existing = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });

  if (!existing) return c.json({ error: "Trip not found" }, 404);

  await db.trip.delete({ where: { id: tripId } });
  return c.json({ success: true });
});

export { trips };
