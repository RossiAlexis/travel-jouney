import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const memories = new Hono<{ Variables: Variables }>();

memories.use("*", authMiddleware);

const createMemorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  category: z
    .enum([
      "ACCOMMODATION",
      "FOOD",
      "ACTIVITY",
      "TRANSPORT",
      "REFLECTION",
      "OTHER",
    ])
    .optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isPublic: z.boolean().optional(),
});

const updateMemorySchema = createMemorySchema.partial();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(tripId: string, base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (
    await db.memory.findUnique({ where: { tripId_slug: { tripId, slug } } })
  ) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// GET /trips/:tripId/memories/search?q=keyword
memories.get("/search", authMiddleware, async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();
  const q = c.req.query("q")?.trim();

  if (!q || q.length < 2) {
    return c.json({ results: [], query: q ?? "" });
  }

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  // Use Prisma raw query for full-text search
  // Falls back to ILIKE if search_vector column doesn't exist yet
  try {
    const results = await db.$queryRaw<Array<{
      id: string;
      title: string;
      content: string | null;
      date: Date;
      category: string;
      slug: string | null;
      "locationName": string | null;
    }>>`
      SELECT id, title, content, date, category, slug, "locationName"
      FROM "Memory"
      WHERE "tripId" = ${tripId}
        AND "userId" = ${user.id}
        AND (
          search_vector @@ plainto_tsquery('english', ${q})
          OR title ILIKE ${'%' + q + '%'}
        )
      ORDER BY
        CASE WHEN search_vector @@ plainto_tsquery('english', ${q}) THEN 0 ELSE 1 END,
        date DESC
      LIMIT 20
    `;
    return c.json({ results, query: q });
  } catch {
    // Fallback if search_vector column doesn't exist yet (migration not applied)
    const results = await db.memory.findMany({
      where: {
        tripId,
        userId: user.id,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, content: true, date: true, category: true, slug: true, locationName: true },
      orderBy: { date: 'desc' },
      take: 20,
    });
    return c.json({ results, query: q });
  }
});

memories.get("/", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const data = await db.memory.findMany({
    where: { tripId, userId: user.id },
    orderBy: { date: "desc" },
  });

  return c.json(data);
});

memories.post("/", zValidator("json", createMemorySchema), async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const body = c.req.valid("json");

  const slug = await uniqueSlug(tripId, generateSlug(body.title));

  const memory = await db.memory.create({
    data: {
      tripId,
      userId: user.id,
      title: body.title,
      content: body.content,
      date: new Date(body.date),
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      category: (body.category as never) ?? "OTHER",
      rating: body.rating,
      isPublic: body.isPublic ?? false,
      slug,
    },
  });

  return c.json(memory, 201);
});

memories.get("/:memoryId", async (c) => {
  const user = c.get("user");
  const { tripId, memoryId } = c.req.param();

  const memory = await db.memory.findFirst({
    where: { id: memoryId, tripId, userId: user.id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!memory) return c.json({ error: "Memory not found" }, 404);
  return c.json(memory);
});

memories.put(
  "/:memoryId",
  zValidator("json", updateMemorySchema),
  async (c) => {
    const user = c.get("user");
    const { tripId, memoryId } = c.req.param();

    const existing = await db.memory.findFirst({
      where: { id: memoryId, tripId, userId: user.id },
    });
    if (!existing) return c.json({ error: "Memory not found" }, 404);

    const body = c.req.valid("json");

    const memory = await db.memory.update({
      where: { id: memoryId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.locationName !== undefined && {
          locationName: body.locationName,
        }),
        ...(body.locationAddress !== undefined && {
          locationAddress: body.locationAddress,
        }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.category !== undefined && {
          category: body.category as never,
        }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });

    return c.json(memory);
  },
);

memories.delete("/:memoryId", async (c) => {
  const user = c.get("user");
  const { tripId, memoryId } = c.req.param();

  const existing = await db.memory.findFirst({
    where: { id: memoryId, tripId, userId: user.id },
  });
  if (!existing) return c.json({ error: "Memory not found" }, 404);

  await db.memory.delete({ where: { id: memoryId } });
  return c.json({ success: true });
});

export { memories };
