import type { D1Database } from "@cloudflare/workers-types";
import { sessionSchema } from "~/lib/schemas";
import type { Session } from "~/lib/schemas";
import { createId } from "./id";

interface CreateSessionInput {
  userId: string;
  expiresAt: Date;
}

export class SessionRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const id = createId();
    const createdAt = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO "Session" ("id", "userId", "expiresAt", "createdAt")
         VALUES (?1, ?2, ?3, ?4)`,
      )
      .bind(id, input.userId, input.expiresAt.toISOString(), createdAt)
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM "Session" WHERE "id" = ?1`)
      .bind(id)
      .first();

    if (!row) {
      throw new Error("Failed to create session");
    }

    return sessionSchema.parse(row);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM "Session" WHERE "userId" = ?1`)
      .bind(userId)
      .run();
  }
}
