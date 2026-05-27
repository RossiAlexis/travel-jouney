import type { D1Database } from "@cloudflare/workers-types";
import { photoSchema } from "~/lib/schemas";
import type { Photo } from "~/lib/schemas";
import { createId } from "./id";

interface CreatePhotoInput {
  memoryId: string;
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
  order?: number;
}

export class PhotoRepository {
  constructor(private readonly db: D1Database) {}

  async findByMemory(memoryId: string): Promise<Photo[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM "Photo" WHERE "memoryId" = ?1 ORDER BY "order" ASC`
      )
      .bind(memoryId)
      .all();
    return results.map((row) => photoSchema.parse(row));
  }

  async findById(id: string): Promise<Photo | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "Photo" WHERE "id" = ?1`)
      .bind(id)
      .first();
    return row ? photoSchema.parse(row) : null;
  }

  async create(input: CreatePhotoInput): Promise<Photo> {
    const id = createId();
    const now = new Date().toISOString();

    const maxOrderRow = await this.db
      .prepare(
        `SELECT COALESCE(MAX("order"), -1) AS maxOrder FROM "Photo" WHERE "memoryId" = ?1`
      )
      .bind(input.memoryId)
      .first();

    const nextOrder =
      input.order !== undefined
        ? input.order
        : Number(maxOrderRow?.maxOrder ?? -1) + 1;

    await this.db
      .prepare(
        `INSERT INTO "Photo"
          ("id", "memoryId", "url", "thumbnail", "caption", "order", "createdAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
      .bind(
        id,
        input.memoryId,
        input.url,
        input.thumbnail ?? null,
        input.caption ?? null,
        nextOrder,
        now
      )
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM "Photo" WHERE "id" = ?1`)
      .bind(id)
      .first();

    if (!row) throw new Error("Failed to create photo");
    return photoSchema.parse(row);
  }

  async deleteById(id: string, memoryId: string): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM "Photo" WHERE "id" = ?1 AND "memoryId" = ?2`)
      .bind(id, memoryId)
      .run();
    return Boolean(result.success);
  }
}
