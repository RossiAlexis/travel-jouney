import { PrismaClient } from "../generated/prisma";
import { PrismaD1 } from "@prisma/adapter-d1";

export function getDb(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
}

// Re-export PrismaClient type for convenience
export type { PrismaClient };
