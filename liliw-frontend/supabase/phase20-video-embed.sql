-- Phase 20: Facebook video link on news and events
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Videos could already be embedded by pasting a Facebook link into the body
-- text, and that still works. But nothing in the CMS said so — an editor
-- opening "New Article" saw Title, Category, Content and Photos, and no reason
-- to think a video was possible at all. A hint in the placeholder is not a
-- feature anyone can find.
--
-- So the link gets a field of its own. The body-text route stays as a
-- fallback, which also means nothing already written needs revisiting.
--
-- Only facebook.com, its subdomains and fb.watch are ever turned into a
-- player; the check lives in src/lib/facebook.ts and runs wherever the value
-- is rendered, so a bad value stored here can never become an iframe pointing
-- somewhere else.

ALTER TABLE cms_news
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE cms_events
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Verify — expect one row per table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'video_url'
  AND table_name IN ('cms_news', 'cms_events')
ORDER BY table_name;
