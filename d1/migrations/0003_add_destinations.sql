-- CreateTable
CREATE TABLE "Destination" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tripId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "coverImage" TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "latitude" REAL,
  "longitude" REAL,
  "placeId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Destination_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Destination_tripId_idx" ON "Destination"("tripId");

-- Add destinationId column to Memory
ALTER TABLE "Memory" ADD COLUMN "destinationId" TEXT REFERENCES "Destination"("id") ON DELETE SET NULL;

-- CreateIndex
CREATE INDEX "Memory_destinationId_idx" ON "Memory"("destinationId");
