import { Hono } from "hono";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const memories = new Hono<{ Variables: Variables }>();

memories.use("*", authMiddleware);

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

memories.post("/", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const body = await c.req.json<{
    title: string;
    content: string;
    date: string;
    locationName?: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    rating?: number;
    isPublic?: boolean;
  }>();

  if (!body.title || !body.content || !body.date) {
    return c.json({ error: "title, content, and date are required" }, 400);
  }

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

memories.put("/:memoryId", async (c) => {
  const user = c.get("user");
  const { tripId, memoryId } = c.req.param();

  const existing = await db.memory.findFirst({
    where: { id: memoryId, tripId, userId: user.id },
  });
  if (!existing) return c.json({ error: "Memory not found" }, 404);

  const body = await c.req.json<{
    title?: string;
    content?: string;
    date?: string;
    locationName?: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    rating?: number;
    isPublic?: boolean;
  }>();

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
});

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
