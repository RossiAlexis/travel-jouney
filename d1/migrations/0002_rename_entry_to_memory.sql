-- Rename Entry table to Memory
ALTER TABLE "Entry" RENAME TO "Memory";

-- Rename entryId columns in related tables
ALTER TABLE "Photo" RENAME COLUMN "entryId" TO "memoryId";
ALTER TABLE "Expense" RENAME COLUMN "entryId" TO "memoryId";

-- Recreate indexes with new names
DROP INDEX IF EXISTS "Entry_tripId_idx";
CREATE INDEX "Memory_tripId_idx" ON "Memory"("tripId");

DROP INDEX IF EXISTS "Entry_userId_idx";
CREATE INDEX "Memory_userId_idx" ON "Memory"("userId");

DROP INDEX IF EXISTS "Entry_date_idx";
CREATE INDEX "Memory_date_idx" ON "Memory"("date");

DROP INDEX IF EXISTS "Entry_category_idx";
CREATE INDEX "Memory_category_idx" ON "Memory"("category");

DROP INDEX IF EXISTS "Entry_tripId_slug_key";
CREATE UNIQUE INDEX "Memory_tripId_slug_key" ON "Memory"("tripId", "slug");

DROP INDEX IF EXISTS "Photo_entryId_idx";
CREATE INDEX "Photo_memoryId_idx" ON "Photo"("memoryId");
