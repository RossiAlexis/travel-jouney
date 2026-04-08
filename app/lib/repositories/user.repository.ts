import type { D1Database } from "@cloudflare/workers-types";
import { sessionUserSchema, userSchema } from "~/lib/schemas";
import type { SessionUser, User } from "~/lib/schemas";
import { createId } from "./id";

interface CreateUserInput {
  email: string;
  username: string;
  displayName: string;
  passwordHash?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

interface UpdateUserInput {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
}

interface UserStats {
  id: string;
  createdAt: Date;
  tripsCount: number;
  memoriesCount: number;
}

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "User" WHERE "id" = ?1`)
      .bind(id)
      .first();
    return row ? userSchema.parse(row) : null;
  }

  async findSessionUserById(id: string): Promise<SessionUser | null> {
    const row = await this.db
      .prepare(
        `SELECT "id", "email", "username", "displayName", "avatar"
         FROM "User" WHERE "id" = ?1`,
      )
      .bind(id)
      .first();
    return row ? sessionUserSchema.parse(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "User" WHERE "email" = ?1`)
      .bind(email)
      .first();
    return row ? userSchema.parse(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT * FROM "User" WHERE "username" = ?1`)
      .bind(username)
      .first();
    return row ? userSchema.parse(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = createId();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO "User"
          ("id", "email", "passwordHash", "username", "displayName", "avatar", "bio", "createdAt", "updatedAt")
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(
        id,
        input.email,
        input.passwordHash ?? null,
        input.username,
        input.displayName,
        input.avatar ?? null,
        input.bio ?? null,
        now,
        now,
      )
      .run();

    const user = await this.findById(id);
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      displayName: input.displayName ?? existing.displayName,
      avatar:
        input.avatar !== undefined ? input.avatar : (existing.avatar ?? null),
      bio: input.bio !== undefined ? input.bio : (existing.bio ?? null),
      updatedAt: new Date().toISOString(),
    };

    await this.db
      .prepare(
        `UPDATE "User"
         SET "displayName" = ?2, "avatar" = ?3, "bio" = ?4, "updatedAt" = ?5
         WHERE "id" = ?1`,
      )
      .bind(id, updated.displayName, updated.avatar, updated.bio, updated.updatedAt)
      .run();

    return this.findById(id);
  }

  async getStats(userId: string): Promise<UserStats | null> {
    const row = await this.db
      .prepare(
        `SELECT
          u."id" AS id,
          u."createdAt" AS createdAt,
          COUNT(DISTINCT t."id") AS tripsCount,
          COUNT(DISTINCT m."id") AS memoriesCount
        FROM "User" u
        LEFT JOIN "Trip" t ON t."userId" = u."id"
        LEFT JOIN "Memory" m ON m."userId" = u."id"
        WHERE u."id" = ?1
        GROUP BY u."id", u."createdAt"`,
      )
      .bind(userId)
      .first();

    if (!row) return null;

    return {
      id: String(row.id),
      createdAt: new Date(String(row.createdAt)),
      tripsCount: Number(row.tripsCount ?? 0),
      memoriesCount: Number(row.memoriesCount ?? 0),
    };
  }
}
