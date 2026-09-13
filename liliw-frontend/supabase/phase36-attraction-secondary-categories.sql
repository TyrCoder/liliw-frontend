-- Phase 36: Let an attraction belong to more than one category
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- `category` stays as the one value an attraction's public id and URL are
-- built from (publicAttractionId in src/lib/content.ts) — changing that
-- would rewrite links every review, favorite and check-in already points at.
-- This adds a second, purely additive field: which OTHER listings (Dining,
-- Tourist Spots, etc.) the place should also appear under, without touching
-- what it fundamentally is.

ALTER TABLE cms_attractions
  ADD COLUMN IF NOT EXISTS secondary_categories text[] NOT NULL DEFAULT '{}';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cms_attractions'
  AND column_name = 'secondary_categories';
