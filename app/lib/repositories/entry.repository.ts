import type { D1Database } from "@cloudflare/workers-types";
import { entryWithPhotosSchema } from "~/lib/schemas";
import type { EntryWithPhotos } from "~/lib/schemas";

export class EntryRepository {
  constructor(private readonly db: D1Database) {}

  async findByTripWithPhotos(
    tripId: string,
    limitPhotosPerEntry = 3,
  ): Promise<EntryWithPhotos[]> {
    const { results: entryRows } = await this.db
      .prepare(`SELECT * FROM "Entry" WHERE "tripId" = ?1 ORDER BY "date" DESC`)
      .bind(tripId)
      .all();

    const entries: EntryWithPhotos[] = [];

    for (const entryRow of entryRows) {
      const { results: photoRows } = await this.db
        .prepare(
          `SELECT "id", "url", "thumbnail"
           FROM "Photo"
           WHERE "entryId" = ?1
           ORDER BY "order" ASC
           LIMIT ?2`,
        )
        .bind(entryRow.id, limitPhotosPerEntry)
        .all();

      entries.push(
        entryWithPhotosSchema.parse({
          ...entryRow,
          photos: photoRows,
        }),
      );
    }

    return entries;
  }
}
