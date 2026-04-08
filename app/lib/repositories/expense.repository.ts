import type { D1Database } from "@cloudflare/workers-types";
import { expenseSchema } from "~/lib/schemas";
import type { Expense } from "~/lib/schemas";
import { createId } from "./id";

interface CreateExpenseInput {
  tripId: string;
  userId: string;
  memoryId?: string | null;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
}

export class ExpenseRepository {
  constructor(private readonly db: D1Database) {}

  async sumByTrip(tripId: string): Promise<number> {
    const row = await this.db
      .prepare(`SELECT COALESCE(SUM("amount"), 0) AS total FROM "Expense" WHERE "tripId" = ?1`)
      .bind(tripId)
      .first();

    return Number(row?.total ?? 0);
  }

  async create(input: CreateExpenseInput): Promise<Expense> {
    const id = createId();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO "Expense"
          ("id", "tripId", "userId", "memoryId", "amount", "currency", "category", "description", "date", "createdAt", "updatedAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
      )
      .bind(
        id,
        input.tripId,
        input.userId,
        input.memoryId ?? null,
        input.amount,
        input.currency,
        input.category,
        input.description,
        input.date.toISOString(),
        now,
        now,
      )
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM "Expense" WHERE "id" = ?1`)
      .bind(id)
      .first();

    if (!row) {
      throw new Error("Failed to create expense");
    }

    return expenseSchema.parse(row);
  }
}
