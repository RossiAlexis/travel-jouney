import type { D1Database } from "@cloudflare/workers-types";
import { accountSchema, userSchema } from "~/lib/schemas";
import type { Account, User } from "~/lib/schemas";
import { createId } from "./id";

interface CreateAccountInput {
  userId: string;
  provider: string;
  providerAccountId: string;
}

interface AccountWithUser {
  account: Account;
  user: User;
}

export class AccountRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: CreateAccountInput): Promise<Account> {
    const id = createId();
    const createdAt = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO "Account"
          ("id", "userId", "provider", "providerAccountId", "createdAt")
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
      .bind(id, input.userId, input.provider, input.providerAccountId, createdAt)
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM "Account" WHERE "id" = ?1`)
      .bind(id)
      .first();

    if (!row) {
      throw new Error("Failed to create account");
    }

    return accountSchema.parse(row);
  }

  async findByProvider(
    provider: string,
    providerAccountId: string,
  ): Promise<AccountWithUser | null> {
    const row = await this.db
      .prepare(
        `SELECT
          a."id" AS account_id,
          a."userId" AS account_userId,
          a."provider" AS account_provider,
          a."providerAccountId" AS account_providerAccountId,
          a."createdAt" AS account_createdAt,
          u."id" AS user_id,
          u."email" AS user_email,
          u."passwordHash" AS user_passwordHash,
          u."username" AS user_username,
          u."displayName" AS user_displayName,
          u."avatar" AS user_avatar,
          u."bio" AS user_bio,
          u."createdAt" AS user_createdAt,
          u."updatedAt" AS user_updatedAt
        FROM "Account" a
        JOIN "User" u ON u."id" = a."userId"
        WHERE a."provider" = ?1 AND a."providerAccountId" = ?2`,
      )
      .bind(provider, providerAccountId)
      .first();

    if (!row) return null;

    const account = accountSchema.parse({
      id: row.account_id,
      userId: row.account_userId,
      provider: row.account_provider,
      providerAccountId: row.account_providerAccountId,
      createdAt: row.account_createdAt,
    });

    const user = userSchema.parse({
      id: row.user_id,
      email: row.user_email,
      passwordHash: row.user_passwordHash,
      username: row.user_username,
      displayName: row.user_displayName,
      avatar: row.user_avatar,
      bio: row.user_bio,
      createdAt: row.user_createdAt,
      updatedAt: row.user_updatedAt,
    });

    return { account, user };
  }
}
