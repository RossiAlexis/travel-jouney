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

trips.get("/:tripId/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
    include: {
      memories: {
        select: {
          id: true,
          date: true,
          category: true,
          latitude: true,
          longitude: true,
          locationName: true,
          photos: { select: { id: true } },
        },
      },
      expenses: {
        select: {
          amount: true,
          currency: true,
          category: true,
        },
      },
    },
  });

  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const totalMemories = trip.memories.length;
  const memoriesWithPhotos = trip.memories.filter((m) => m.photos.length > 0).length;
  const memoriesWithCoords = trip.memories.filter((m) => m.latitude && m.longitude).length;

  // Days traveled
  const totalDays = trip.endDate
    ? Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : Math.ceil((new Date().getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));

  // Expense totals by category
  const expensesByCategory = trip.expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) acc[expense.category] = 0;
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);

  // Memories by category
  const memoriesByCategory = trip.memories.reduce((acc, memory) => {
    if (!acc[memory.category]) acc[memory.category] = 0;
    acc[memory.category]++;
    return acc;
  }, {} as Record<string, number>);

  // Unique locations
  const uniqueLocations = new Set(
    trip.memories
      .map((m) => m.locationName)
      .filter(Boolean)
  ).size;

  return c.json({
    totalMemories,
    memoriesWithPhotos,
    memoriesWithCoords,
    totalDays: Math.max(1, totalDays),
    totalExpenses,
    expensesByCategory,
    memoriesByCategory,
    uniqueLocations,
    currency: trip.currency,
  });
});

// GET /trips/:tripId/export/json — download trip as JSON
trips.get("/:tripId/export/json", authMiddleware, async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
    include: {
      memories: {
        include: { photos: true },
        orderBy: { date: "asc" },
      },
      expenses: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const exportData = {
    exportedAt: new Date().toISOString(),
    trip: {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      currency: trip.currency,
      budget: trip.budget,
      coverImage: trip.coverImage,
      memoriesCount: trip.memories.length,
      expensesCount: trip.expenses.length,
    },
    memories: trip.memories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      date: m.date,
      category: m.category,
      rating: m.rating,
      locationName: m.locationName,
      locationAddress: m.locationAddress,
      latitude: m.latitude,
      longitude: m.longitude,
      isPublic: m.isPublic,
      photos: m.photos.map((p) => ({ url: p.url, thumbnail: p.thumbnail, caption: p.caption })),
      createdAt: m.createdAt,
    })),
    expenses: trip.expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      currency: e.currency,
      category: e.category,
      description: e.description,
      date: e.date,
    })),
  };

  const filename = `${trip.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-export.json`;

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});

export { trips };
