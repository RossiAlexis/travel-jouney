import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
};

// Singleton pattern to avoid multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return client;
}

export const db = globalThis.__db ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
