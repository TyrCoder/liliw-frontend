-- Phase 16: Give "Good to Know" its own fields instead of one text blob
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Editors have been typing labels by hand into the single `features` rich-text
-- box — "Best time: …", "Entrance fee: …", "Hours: …", "Tips for Visitors".
-- That renders as one wall of text and can't be styled, sorted or filtered.
--
-- Hours and entrance fee already got their own columns in phase 15. This adds
-- the remaining two so each piece has its own box in the CMS.
--
-- No data is migrated: of the 38 attractions with `features` filled in, only 8
-- use the "Best time:" convention and 7 mention tips, so parsing the blob would
-- mangle the majority. `features` stays as the free-form highlights field and
-- keeps rendering, so nothing that is written today disappears.

ALTER TABLE cms_attractions
  ADD COLUMN IF NOT EXISTS best_time    TEXT,  -- e.g. "Early morning or late afternoon"
  ADD COLUMN IF NOT EXISTS visitor_tips TEXT;  -- rich text: what to bring, how to behave

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cms_attractions'
  AND column_name IN ('best_time','visitor_tips','opening_hours','entrance_fee','price_level','best_for')
ORDER BY column_name;
