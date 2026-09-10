-- Phase 33: Gat Tayaw speech-bubble text per story
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- A short line the storyteller "says" in a speech bubble on the stories page,
-- edited in the CMS. Optional — a story with none simply shows no bubble.

ALTER TABLE cms_stories
  ADD COLUMN IF NOT EXISTS storyteller_text text;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cms_stories'
  AND column_name = 'storyteller_text';
