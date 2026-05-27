import type { D1Database } from "@cloudflare/workers-types";
import {
  destinationSchema,
  destinationWithMemoryCountSchema,
  type Destination,
  type DestinationWithMemoryCount,
} from "~/lib/schemas";
import { createId } from "./id";

interface CreateDestinationInput {
  tripId: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  order?: number;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}

interface UpdateDestinationInput {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}

export class DestinationRepository {
  constructor(private readonly db: D1Database) {}

  async findByTrip(tripId: string): Promise<DestinationWithMemoryCount[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
          d.*,
          COUNT(m."id") AS memoriesCount
        FROM "Destination" d
        LEFT JOIN "Memory" m ON m."destinationId" = d."id"
        WHERE d."tripId" = ?1
        GROUP BY d."id"
        ORDER BY d."order" ASC, d."createdAt" ASC`
      )
      .bind(tripId)
      .all();

    return results.map((row) =>
      destinationWithMemoryCountSchema.parse({
        ...row,
        memoriesCount: Number(row.memoriesCount ?? 0),
      })
    );
  }

  async findByIdForTrip(
    id: string,
    tripId: string
  ): Promise<Destination | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "Destination" WHERE "id" = ?1 AND "tripId" = ?2`)
      .bind(id, tripId)
      .first();

    return row ? destinationSchema.parse(row) : null;
  }

  async create(input: CreateDestinationInput): Promise<Destination> {
    const id = createId();
    const now = new Date().toISOString();

    // Determine order: place after the last destination
    const maxOrderRow = await this.db
      .prepare(
        `SELECT COALESCE(MAX("order"), -1) AS maxOrder FROM "Destination" WHERE "tripId" = ?1`
      )
      .bind(input.tripId)
      .first();

    const nextOrder =
      input.order !== undefined
        ? input.order
        : Number(maxOrderRow?.maxOrder ?? -1) + 1;

    await this.db
      .prepare(
        `INSERT INTO "Destination"
          ("id", "tripId", "name", "description", "startDate", "endDate", "order", "latitude", "longitude", "placeId", "updatedAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        id,
        input.tripId,
        input.name,
        input.description ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        nextOrder,
        input.latitude ?? null,
        input.longitude ?? null,
        input.placeId ?? null,
        now
      )
      .run();

    const destination = await this.findByIdForTrip(id, input.tripId);
    if (!destination) {
      throw new Error("Failed to create destination");
    }
    return destination;
  }

  async update(
    id: string,
    tripId: string,
    input: UpdateDestinationInput
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "Destination"
         SET
          "name" = ?3,
          "description" = ?4,
          "startDate" = ?5,
          "endDate" = ?6,
          "latitude" = ?7,
          "longitude" = ?8,
          "placeId" = ?9,
          "updatedAt" = ?10
         WHERE "id" = ?1 AND "tripId" = ?2`
      )
      .bind(
        id,
        tripId,
        input.name,
        input.description ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.latitude ?? null,
        input.longitude ?? null,
        input.placeId ?? null,
        new Date().toISOString()
      )
      .run();

    return Boolean(result.success);
  }

  async delete(id: string, tripId: string): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM "Destination" WHERE "id" = ?1 AND "tripId" = ?2`)
      .bind(id, tripId)
      .run();

    return Boolean(result.success);
  }

  /**
   * Reorder destinations by updating the `order` field for each id in the given array.
   * The position in the array determines the new order value.
   */
  async reorder(tripId: string, orderedIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    const stmts = orderedIds.map((id, index) =>
      this.db
        .prepare(
          `UPDATE "Destination" SET "order" = ?1, "updatedAt" = ?2 WHERE "id" = ?3 AND "tripId" = ?4`
        )
        .bind(index, now, id, tripId)
    );

    if (stmts.length > 0) {
      await this.db.batch(stmts);
    }
  }
}
