import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Singleton pattern to avoid multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  });

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
