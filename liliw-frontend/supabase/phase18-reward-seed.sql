-- Phase 18: Starter rewards catalog
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- The rewards system has been fully built since phase 6/7 — catalog table,
-- atomic redeem_reward() RPC, admin CRUD, public shop, staff code
-- verification — but the catalog is empty, so /rewards shows nothing and the
-- points visitors earn have nowhere to go.
--
-- Pricing is set against the actual points economy in src/lib/achievements.ts:
--   attraction_visit = 5   review = 20   event_signup = 15   share = 5
-- plus achievement bonuses (10-100). A tourist doing a normal day out — a few
-- spots, a review, a share — lands around 40-80 points, so the cheap tier is
-- reachable on a single visit and the top tier is a genuine goal.
--
-- claim_type:
--   'online' — granted instantly, one per person (enforced by the partial
--              unique index from phase 7). Use for digital-only items.
--   'irl'    — issues a redemption code + QR the visitor shows at the Tourism
--              Office; staff verify it under Admin → Redeem Code.
--
-- Idempotent: skips any reward whose name already exists, so re-running will
-- not create duplicates or overwrite prices you have since adjusted.

INSERT INTO rewards (name, description, icon, badge_color, points_cost, stock, claim_type, is_active, sort_order)
SELECT * FROM (VALUES
  ('Liliw Sticker Pack',
   'A digital sticker pack celebrating Liliw''s tsinelas heritage — yours instantly. Show this badge at the Tourism Office to also claim a physical set while supplies last.',
   'sparkles',       '#0EA5E9',  20, NULL::INTEGER, 'online', TRUE, 10),

  ('Liliw Postcard Set',
   'Three collectible postcards featuring the Parish Church, the tsinelas district and Kilangin Falls. Pick them up at the Tourism Office.',
   'message-square', '#8B5CF6',  30,   50,  'irl',    TRUE, 20),

  ('Tsinelas Keychain',
   'A miniature handcrafted slipper keychain made by local artisans — the town''s signature craft in pocket size.',
   'star',           '#F97316',  50,   40,  'irl',    TRUE, 30),

  ('Free Local Coffee',
   'One free brewed coffee at a participating Liliw cafe. Present your redemption code at the counter.',
   'award',          '#A16207',  60,   30,  'irl',    TRUE, 40),

  ('Liliw Tourism Tote Bag',
   'A sturdy canvas tote printed with the Liliw Tourism mark — handy for a day of shopping along the tsinelas strip.',
   'trophy',         '#0D9488', 100,   25,  'irl',    TRUE, 50),

  ('Tourist Spot Explorer Certificate',
   'A personalised digital certificate recognising your exploration of Liliw''s attractions. Granted instantly and yours to keep.',
   'compass',        '#1565C0', 120, NULL::INTEGER, 'online', TRUE, 60),

  ('Liliw Heritage T-Shirt',
   'Limited-run shirt featuring Liliw heritage artwork. Sizes S-XXL, subject to availability — mention your size when you collect it at the Tourism Office.',
   'party-popper',   '#EF4444', 180,   15,  'irl',    TRUE, 70),

  ('Guided Heritage Walk for Two',
   'A guided walking tour of Liliw''s heritage sites for you and one companion, led by a local guide. Your redemption code doubles as your booking reference — bring it to the Tourism Office to schedule.',
   'map-pin',        '#0B3D91', 250,    8,  'irl',    TRUE, 80)
) AS seed(name, description, icon, badge_color, points_cost, stock, claim_type, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM rewards r WHERE r.name = seed.name);

-- Verify — expect 8 rows (plus anything you had already)
SELECT name, points_cost, claim_type, stock, is_active
FROM rewards
ORDER BY sort_order, points_cost;
