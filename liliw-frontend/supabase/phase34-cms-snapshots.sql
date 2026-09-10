-- Phase 34: Snapshots of the last-approved content, so a reviewer can see what
-- changed in a pending edit.
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Editing overwrites the row and sends it back to review, so the previously
-- approved version was lost and there was nothing to diff against. This keeps a
-- copy of the content at the moment it was last approved. The Content Approvals
-- "View" panel compares a pending entry against its snapshot; an entry with no
-- snapshot is a brand-new submission (everything is new).
--
-- Only the API routes (service role) read or write this table.

CREATE TABLE IF NOT EXISTS cms_snapshots (
  content_type text NOT NULL,            -- 'attractions', 'stories', … (the app slug)
  content_id   text NOT NULL,            -- the entry id
  data         jsonb NOT NULL,           -- the whole row as it was when approved
  snapshot_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_type, content_id)
);

ALTER TABLE cms_snapshots ENABLE ROW LEVEL SECURITY;
-- No policy: only the service role touches it.

-- Backfill the current approved content so edits made from now on can be diffed
-- against what is live today. ON CONFLICT DO NOTHING keeps this re-runnable.
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'attractions', id::text, to_jsonb(t) FROM cms_attractions t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'events', id::text, to_jsonb(t) FROM cms_events t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'news', id::text, to_jsonb(t) FROM cms_news t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'art-forms', id::text, to_jsonb(t) FROM cms_art_forms t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'artisans', id::text, to_jsonb(t) FROM cms_artisans t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'stories', id::text, to_jsonb(t) FROM cms_stories t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'faqs', id::text, to_jsonb(t) FROM cms_faqs t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'itineraries', id::text, to_jsonb(t) FROM cms_itineraries t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;
INSERT INTO cms_snapshots (content_type, content_id, data)
  SELECT 'community-events', id::text, to_jsonb(t) FROM cms_community_events t WHERE status = 'approved'
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Verify
SELECT content_type, count(*) FROM cms_snapshots GROUP BY content_type ORDER BY content_type;
