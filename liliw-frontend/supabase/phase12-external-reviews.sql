-- Phase 12: Create the external_reviews table (Google reviews cache)
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- The Google-reviews block never appears on attraction pages because the table
-- it reads from does not exist. Production returns:
--   {"error":"Could not find the table 'public.external_reviews' in the schema cache"}
--
-- It was a Strapi-era table that the Supabase migration never recreated, so:
--   • Admin → Online Reviews scraping fails on save (logged, then discarded)
--   • The attraction page's fetch 500s, and its .catch(() => {}) hides it —
--     which is why this failed silently rather than showing an error.
--
-- Written to match exactly what src/app/api/admin/scrape-reviews/route.ts
-- upserts and what src/app/attractions/[id]/page.tsx reads back.

CREATE TABLE IF NOT EXISTS external_reviews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The CMS row id of the attraction. Named strapi_id for continuity with the
  -- code; it now holds the Supabase cms_attractions UUID, not a Strapi id.
  strapi_id       TEXT        NOT NULL UNIQUE,
  attraction_name TEXT        NOT NULL DEFAULT '',
  google_rating   NUMERIC(2,1),
  review_count    INTEGER     NOT NULL DEFAULT 0,
  -- Array of { author, rating, text, published }
  reviews         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The scraper upserts with onConflict: 'strapi_id'; that needs this unique
-- index (the UNIQUE above provides it, this is just explicit and idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS external_reviews_strapi_id_uniq
  ON external_reviews (strapi_id);

-- Server-only, like the rest: both the scraper and the page read through API
-- routes on the service role, which bypasses RLS. No anon policy is needed.
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'external_reviews'
ORDER BY ordinal_position;

-- Afterwards: Admin → Online Reviews → scrape an attraction, then open that
-- attraction's public page. The Google rating and review list should appear.
-- The table starts empty, so nothing shows until you run a scrape.
