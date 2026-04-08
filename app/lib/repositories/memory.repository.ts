import type { D1Database } from "@cloudflare/workers-types";
import { memoryWithPhotosSchema } from "~/lib/schemas";
import type { MemoryWithPhotos } from "~/lib/schemas";

export class MemoryRepository {
  constructor(private readonly db: D1Database) {}

  async findByTripWithPhotos(
    tripId: string,
    limitPhotosPerMemory = 3,
  ): Promise<MemoryWithPhotos[]> {
    const { results: memoryRows } = await this.db
      .prepare(`SELECT * FROM "Memory" WHERE "tripId" = ?1 ORDER BY "date" DESC`)
      .bind(tripId)
      .all();

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
