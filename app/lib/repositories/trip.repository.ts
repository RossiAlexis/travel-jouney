import type { D1Database } from "@cloudflare/workers-types";
import {
  type DashboardTrip,
  type Trip,
  type TripStatus,
  type TripWithCounts,
  dashboardTripSchema,
  tripSchema,
  tripWithCountsSchema,
} from "~/lib/schemas";
import { createId } from "./id";

interface CreateTripInput {
  userId: string;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status: TripStatus;
  budget?: number | null;
  currency: string;
}

interface UpdateTripInput {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status: TripStatus;
  budget?: number | null;
  currency: string;
}

export class TripRepository {
  constructor(private readonly db: D1Database) {}

  async findManyByUser(userId: string): Promise<DashboardTrip[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
          t.*,
          COUNT(m."id") AS memoriesCount
        FROM "Trip" t
        LEFT JOIN "Memory" m ON m."tripId" = t."id"
        WHERE t."userId" = ?1
        GROUP BY t."id"
        ORDER BY
          CASE t."status"
            WHEN 'ONGOING' THEN 1
            WHEN 'PLANNED' THEN 2
            WHEN 'COMPLETED' THEN 3
            ELSE 4
          END ASC,
          t."startDate" DESC`,
      )
      .bind(userId)
      .all();

    return results.map((row) =>
      dashboardTripSchema.parse({
        ...row,
        memoriesCount: Number(row.memoriesCount ?? 0),
      }),
    );
  }

  async findByIdForUser(tripId: string, userId: string): Promise<Trip | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "Trip" WHERE "id" = ?1 AND "userId" = ?2`)
      .bind(tripId, userId)
      .first();
    return row ? tripSchema.parse(row) : null;
  }

  async findByIdWithCountsForUser(
    tripId: string,
    userId: string,
  ): Promise<TripWithCounts | null> {
    const row = await this.db
      .prepare(
        `SELECT
          t.*,
          COUNT(DISTINCT m."id") AS memoriesCount,
          COUNT(DISTINCT ex."id") AS expensesCount
        FROM "Trip" t
        LEFT JOIN "Memory" m ON m."tripId" = t."id"
        LEFT JOIN "Expense" ex ON ex."tripId" = t."id"
        WHERE t."id" = ?1 AND t."userId" = ?2
        GROUP BY t."id"`,
      )
      .bind(tripId, userId)
      .first();

    if (!row) return null;
    return tripWithCountsSchema.parse({
      ...row,
      memoriesCount: Number(row.memoriesCount ?? 0),
      expensesCount: Number(row.expensesCount ?? 0),
    });
  }

  async create(input: CreateTripInput): Promise<Trip> {
    const id = createId();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO "Trip"
          ("id", "userId", "title", "description", "startDate", "endDate", "status", "budget", "currency", "updatedAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      )
      .bind(
        id,
        input.userId,
        input.title,
        input.description ?? null,
        input.startDate.toISOString(),
        input.endDate ? input.endDate.toISOString() : null,
        input.status,
        input.budget ?? null,
        input.currency,
        now,
      )
      .run();

    const trip = await this.findByIdForUser(id, input.userId);
    if (!trip) {
      throw new Error("Failed to create trip");
    }
    return trip;
  }

  async updateForUser(
    tripId: string,
    userId: string,
    input: UpdateTripInput,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "Trip"
         SET
          "title" = ?3,
          "description" = ?4,
          "startDate" = ?5,
          "endDate" = ?6,
          "status" = ?7,
          "budget" = ?8,
          "currency" = ?9,
          "updatedAt" = ?10
         WHERE "id" = ?1 AND "userId" = ?2`,
      )
      .bind(
        tripId,
        userId,
        input.title,
        input.description ?? null,
        input.startDate.toISOString(),
        input.endDate ? input.endDate.toISOString() : null,
        input.status,
        input.budget ?? null,
        input.currency,
        new Date().toISOString(),
      )
      .run();

    return Boolean(result.success);
  }

  async deleteForUser(tripId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM "Trip" WHERE "id" = ?1 AND "userId" = ?2`)
      .bind(tripId, userId)
      .run();

    return Boolean(result.success);
  }
}
