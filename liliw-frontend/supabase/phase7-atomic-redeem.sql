-- Phase 7: Atomic reward redemption — Run in Supabase Dashboard SQL Editor
--
-- Closes three race conditions in POST /api/rewards/redeem that let a user
-- double-claim a "one-per-person" online badge, double-spend points, or
-- oversell a low-stock in-person reward via concurrent requests.

-- Backstop for the online-badge "one claim per person" rule at the DB level
-- (the function below also checks this, but a unique index removes the
-- last sliver of a race between the check and the insert).
CREATE UNIQUE INDEX IF NOT EXISTS reward_redemptions_online_once
  ON reward_redemptions (user_id, reward_id) WHERE claim_type = 'online';

-- p_code is generated in JS (src/lib/rewards.ts's generateRedemptionCode) and
-- passed in, so the human-friendly code format/alphabet stays defined in one
-- place. The route retries with a fresh code on the rare redemption_code
-- collision (see redemption_code's own UNIQUE constraint).
CREATE OR REPLACE FUNCTION redeem_reward(p_user_id uuid, p_reward_id uuid, p_code text)
RETURNS reward_redemptions
LANGUAGE plpgsql AS $$
DECLARE
  v_reward      rewards;
  v_total_pts   integer;
  v_redemption  reward_redemptions;
BEGIN
  -- Serialize all redemption attempts by this user so the balance/claim
  -- checks below can't race against another concurrent redemption of theirs.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'reward_unavailable';
  END IF;

  IF v_reward.claim_type = 'online' THEN
    IF EXISTS (
      SELECT 1 FROM reward_redemptions WHERE user_id = p_user_id AND reward_id = p_reward_id
    ) THEN
      RAISE EXCEPTION 'already_claimed';
    END IF;
  ELSIF v_reward.stock IS NOT NULL THEN
    IF v_reward.stock <= 0 THEN
      RAISE EXCEPTION 'out_of_stock';
    END IF;
    UPDATE rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  SELECT COALESCE(SUM(points), 0) INTO v_total_pts FROM user_points WHERE user_id = p_user_id;
  IF v_total_pts < v_reward.points_cost THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  INSERT INTO reward_redemptions (
    user_id, reward_id, reward_name, points_spent, redemption_code,
    claim_type, image_url, status, redeemed_at, redeemed_by
  )
  VALUES (
    p_user_id, v_reward.id, v_reward.name, v_reward.points_cost, p_code,
    v_reward.claim_type, v_reward.image_url,
    CASE WHEN v_reward.claim_type = 'online' THEN 'redeemed' ELSE 'pending' END,
    CASE WHEN v_reward.claim_type = 'online' THEN now() ELSE NULL END,
    CASE WHEN v_reward.claim_type = 'online' THEN 'online (self-claim)' ELSE NULL END
  )
  RETURNING * INTO v_redemption;

  INSERT INTO user_points (user_id, points, action, reference_id, reference_name)
  VALUES (p_user_id, -v_reward.points_cost, 'reward_redeem', v_redemption.id, v_reward.name);

  RETURN v_redemption;
END;
$$;
