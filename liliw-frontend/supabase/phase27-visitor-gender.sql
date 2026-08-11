-- Phase 27 — Gender on a visitor's profile
--
-- lbo_visitor_records splits every count by male and female, and by where the
-- visitor travelled from. The origin half is already known — tourist_profiles
-- carries user_type, which maps onto the four categories exactly — but gender
-- was never recorded anywhere, so a QR check-in could tell a business someone
-- had arrived and nothing about which box on the monthly form they belonged
-- in. That is the gap this closes.
--
-- Optional on purpose. Nobody is blocked from using the site for declining to
-- state it, and a blank simply does not contribute to the split — a business
-- reading its own figures would rather see two visitors and one unstated than
-- be handed a guess.

ALTER TABLE tourist_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say'));

-- Read constantly when a business opens its Visitor Records for a month:
-- every check-in in that period is joined back to its visitor's profile.
CREATE INDEX IF NOT EXISTS tourist_profiles_gender_idx
  ON tourist_profiles (gender) WHERE gender IS NOT NULL;
