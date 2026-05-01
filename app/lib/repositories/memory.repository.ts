import type { D1Database } from "@cloudflare/workers-types";
import { memoryWithPhotosSchema } from "~/lib/schemas";
import type { MemoryWithPhotos } from "~/lib/schemas";
import { createId } from "./id";

interface CreateMemoryInput {
  tripId: string;
  userId: string;
  destinationId?: string | null;
  title: string;
  content: string;
  date: Date;
  category: string;
  rating?: number | null;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export class MemoryRepository {
  constructor(private readonly db: D1Database) {}

  /**
   * Fetch all memories for a trip (both trip-level and destination-level),
   * ordered by date descending. Each memory includes up to `limitPhotosPerMemory` photos.
   */
  async findByTripWithPhotos(
    tripId: string,
    limitPhotosPerMemory = 3,
  ): Promise<MemoryWithPhotos[]> {
    const { results: memoryRows } = await this.db
      .prepare(`SELECT * FROM "Memory" WHERE "tripId" = ?1 ORDER BY "date" DESC`)
      .bind(tripId)
      .all();

    return this.attachPhotos(memoryRows, limitPhotosPerMemory);
  }

  /**
   * Fetch memories belonging to a specific destination.
   */
  async findByDestinationWithPhotos(
    destinationId: string,
    limitPhotosPerMemory = 3,
  ): Promise<MemoryWithPhotos[]> {
    const { results: memoryRows } = await this.db
      .prepare(
        `SELECT * FROM "Memory" WHERE "destinationId" = ?1 ORDER BY "date" DESC`,
      )
      .bind(destinationId)
      .all();

    return this.attachPhotos(memoryRows, limitPhotosPerMemory);
  }

  /**
   * Fetch trip-level memories (those not assigned to any destination).
   */
  async findTripLevelMemories(tripId: string): Promise<MemoryWithPhotos[]> {
    const { results: memoryRows } = await this.db
      .prepare(
        `SELECT * FROM "Memory"
         WHERE "tripId" = ?1 AND "destinationId" IS NULL
         ORDER BY "date" DESC`,
      )
      .bind(tripId)
      .all();

    return this.attachPhotos(memoryRows, 3);
  }

  async create(input: CreateMemoryInput): Promise<MemoryWithPhotos> {
    const id = createId();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO "Memory"
          ("id", "tripId", "userId", "destinationId", "title", "content", "date",
           "category", "rating", "locationName", "locationAddress", "latitude", "longitude", "updatedAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
      )
      .bind(
        id,
        input.tripId,
        input.userId,
        input.destinationId ?? null,
        input.title,
        input.content,
        input.date.toISOString(),
        input.category,
        input.rating ?? null,
        input.locationName ?? null,
        input.locationAddress ?? null,
        input.latitude ?? null,
        input.longitude ?? null,
        now,
      )
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM "Memory" WHERE "id" = ?1`)
      .bind(id)
      .first();

    if (!row) {
      throw new Error("Failed to create memory");
    }

    return memoryWithPhotosSchema.parse({ ...row, photos: [] });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async attachPhotos(
    memoryRows: Record<string, unknown>[],
    limitPhotosPerMemory: number,
  ): Promise<MemoryWithPhotos[]> {
    const memories: MemoryWithPhotos[] = [];

    for (const memoryRow of memoryRows) {
      const { results: photoRows } = await this.db
        .prepare(
          `SELECT "id", "url", "thumbnail"
           FROM "Photo"
           WHERE "memoryId" = ?1
           ORDER BY "order" ASC
           LIMIT ?2`,
        )
        .bind(memoryRow.id, limitPhotosPerMemory)
        .all();

      memories.push(
        memoryWithPhotosSchema.parse({
          ...memoryRow,
          photos: photoRows,
        }),
      );
    }

    return memories;
  }
}
