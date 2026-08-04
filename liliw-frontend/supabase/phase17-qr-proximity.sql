-- Phase 17: Record how close a QR scan actually was
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Until now ?src=qr only set via='qr' as a label — nothing checked where the
-- phone was, so anyone with the link could claim a visit from home and collect
-- points. The check-in route now compares the phone's coordinates against the
-- attraction's and records the distance, so a "visited" badge means something.
--
-- via values after this change:
--   'web'           browsed to the page normally
--   'qr'            scanned the QR and was within 150m of the attraction
--   'qr_unverified' scanned the QR but location was refused, unavailable, too
--                   far away, or the attraction has no coordinates set

ALTER TABLE attraction_visit_checkins
  ADD COLUMN IF NOT EXISTS distance_m INTEGER;   -- metres from the attraction, NULL if unknown

COMMENT ON COLUMN attraction_visit_checkins.distance_m IS
  'Metres between the visitor and the attraction at check-in. NULL when location was not shared or the attraction has no coordinates.';

-- Existing rows predate the check and were never distance-checked. They keep
-- whatever via they had; only new scans can earn the verified 'qr' value.

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attraction_visit_checkins'
ORDER BY ordinal_position;
