import { db } from "@repo/db";
import { ServiceError } from "./api.js";
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
async function uniqueSlug(tripId, base) {
    let slug = base;
    let counter = 1;
    while (await db.memory.findUnique({ where: { tripId_slug: { tripId, slug } } })) {
        slug = `${base}-${counter++}`;
    }
    return slug;
}
export async function listMemories(tripId, userId) {
    const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip)
        throw new ServiceError(404, "Trip not found");
    return db.memory.findMany({
        where: { tripId, userId },
        include: { photos: { orderBy: { order: "asc" } } },
        orderBy: { date: "desc" },
    });
}
export async function getMemoryById(memoryId, tripId, userId) {
    return db.memory.findFirst({
        where: { id: memoryId, tripId, userId },
        include: { photos: { orderBy: { order: "asc" } } },
    });
}
export async function createMemory(tripId, userId, data) {
    const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip)
        throw new ServiceError(404, "Trip not found");
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
            category: (data.category ?? "REFLECTION"),
            rating: data.rating ?? null,
            isPublic: data.isPublic ?? false,
            slug,
        },
    });
}
export async function updateMemory(memoryId, userId, data) {
    const memory = await db.memory.findFirst({ where: { id: memoryId, userId } });
    if (!memory)
        throw new ServiceError(404, "Memory not found");
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
            ...(data.category !== undefined && { category: data.category }),
            ...(data.rating !== undefined && { rating: data.rating }),
            ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        },
    });
}
export async function deleteMemory(memoryId, userId) {
    const memory = await db.memory.findFirst({ where: { id: memoryId, userId } });
    if (!memory)
        throw new ServiceError(404, "Memory not found");
    return db.memory.delete({ where: { id: memoryId } });
}
export async function searchMemories(tripId, userId, query) {
    const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip)
        throw new ServiceError(404, "Trip not found");
    try {
        const results = await db.$queryRaw `
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
    }
    catch {
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
