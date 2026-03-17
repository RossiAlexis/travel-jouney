import { db } from "@repo/db";
import type { MemoryCategory } from "@prisma/client";
import { ServiceError } from "./api.js";

type CreateMemoryInput = {
  title: string;
  content: string;
  date: string;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  category?: string;
  rating?: number | null;
  isPublic?: boolean;
};

type UpdateMemoryInput = Partial<CreateMemoryInput>;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(tripId: string, base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await db.memory.findUnique({ where: { tripId_slug: { tripId, slug } } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function listMemories(tripId: string, userId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new ServiceError(404, "Trip not found");

  return db.memory.findMany({
    where: { tripId, userId },
    include: { photos: { orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  });
}

export async function getMemoryById(memoryId: string, tripId: string, userId: string) {
  return db.memory.findFirst({
    where: { id: memoryId, tripId, userId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}

export async function createMemory(tripId: string, userId: string, data: CreateMemoryInput) {
  const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new ServiceError(404, "Trip not found");

  const base = generateSlug(data.title);
  const slug = await uniqueSlug(tripId, base);

  return db.memory.create({
    data: {
      tripId,
      userId,
      title: data.title,
      content: data.content,
      date: new Date(data.date),
      locationName: data.locationName ?? null,
      locationAddress: data.locationAddress ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      placeId: data.placeId ?? null,
      category: (data.category ?? "REFLECTION") as MemoryCategory,
      rating: data.rating ?? null,
      isPublic: data.isPublic ?? false,
      slug,
    },
  });
}

export async function updateMemory(memoryId: string, userId: string, data: UpdateMemoryInput) {
  const memory = await db.memory.findFirst({ where: { id: memoryId, userId } });
  if (!memory) throw new ServiceError(404, "Memory not found");

  return db.memory.update({
    where: { id: memoryId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.locationName !== undefined && { locationName: data.locationName }),
      ...(data.locationAddress !== undefined && { locationAddress: data.locationAddress }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.placeId !== undefined && { placeId: data.placeId }),
      ...(data.category !== undefined && { category: data.category as MemoryCategory }),
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });
}

export async function deleteMemory(memoryId: string, userId: string) {
  const memory = await db.memory.findFirst({ where: { id: memoryId, userId } });
  if (!memory) throw new ServiceError(404, "Memory not found");
  return db.memory.delete({ where: { id: memoryId } });
}

export async function searchMemories(tripId: string, userId: string, query: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new ServiceError(404, "Trip not found");

  try {
    const results = await db.$queryRaw<
      Array<{
        id: string;
        title: string;
        content: string | null;
        date: Date;
        category: string;
        slug: string | null;
        locationName: string | null;
      }>
    >`
      SELECT id, title, content, date, category, slug, "locationName"
      FROM "Memory"
      WHERE "tripId" = ${tripId}
        AND "userId" = ${userId}
        AND (
          search_vector @@ plainto_tsquery('english', ${query})
          OR title ILIKE ${"%" + query + "%"}
        )
      ORDER BY
        CASE WHEN search_vector @@ plainto_tsquery('english', ${query}) THEN 0 ELSE 1 END,
        date DESC
      LIMIT 20
    `;
    return { results, query };
  } catch {
    const results = await db.memory.findMany({
      where: {
        tripId,
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        category: true,
        slug: true,
        locationName: true,
      },
      orderBy: { date: "desc" },
      take: 20,
    });
    return { results, query };
  }
}
