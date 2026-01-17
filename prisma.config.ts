// Prisma configuration for Travel Journal
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses connection pooler)
    // Use DATABASE_URL for regular operations (uses connection pooler)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
