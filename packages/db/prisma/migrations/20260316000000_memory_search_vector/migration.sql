-- Add full-text search vector to Memory table
ALTER TABLE "Memory"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS memory_search_vector_idx ON "Memory" USING GIN (search_vector);
