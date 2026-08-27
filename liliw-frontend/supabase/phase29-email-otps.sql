-- Phase 29: Durable email OTP store
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- OTP codes were held in an in-memory Map (lib/regOtpStore.ts etc.). On Vercel
-- the request that sends the code and the request that verifies it often run on
-- different serverless instances, so the verify instance's Map was empty and
-- every check failed with "No valid code found" — a 400 on /verify-reg-otp.
--
-- Storing the code in one shared table fixes that: any instance can read it.
-- Only the API routes (service role) touch this table, so RLS is on with no
-- policy — browsers get no direct access.

CREATE TABLE IF NOT EXISTS email_otps (
  purpose    text   NOT NULL,           -- 'register', 'reset', 'change-email', …
  key        text   NOT NULL,           -- lowercased email (or userId)
  otp        text   NOT NULL,
  expiry     bigint NOT NULL,           -- unix milliseconds
  attempts   int    NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (purpose, key)
);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
-- No policy on purpose: only the service role writes/reads these codes.

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_otps'
ORDER BY ordinal_position;
1