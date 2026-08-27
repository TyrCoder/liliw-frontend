import { timingSafeEqual } from 'crypto';
import { supabaseServer } from './supabase-server';
import { MAX_OTP_ATTEMPTS, type OtpResult } from './otp';

// Database-backed OTP store. Replaces the in-memory Maps, which did not survive
// across Vercel serverless instances — the send and verify requests land on
// different instances, so an in-memory code was routinely gone by verify time.
// The table (email_otps, see supabase/phase29-email-otps.sql) is shared by all
// instances, so any of them can read a code another one wrote.

const TABLE = 'email_otps';

function sameCode(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Store (or replace) a code for a flow. `purpose` namespaces the flows so a
 * registration code and a password-reset code for the same email can't collide.
 * ttlMs mirrors the old `expiry: Date.now() + ttl`.
 */
export async function storeOtp(purpose: string, key: string, otp: string, ttlMs: number): Promise<void> {
  const { error } = await supabaseServer.from(TABLE).upsert(
    { purpose, key, otp, expiry: Date.now() + ttlMs, attempts: 0 },
    { onConflict: 'purpose,key' },
  );
  if (error) {
    // Surfaced here because a silent failure would send the email and then fail
    // verification for a reason that looks like a wrong code.
    console.error('[otpDb.storeOtp]', error.message);
    throw new Error('Could not store verification code');
  }
}

/**
 * Async, DB-backed mirror of consumeOtp(): validates a submitted code and burns
 * it on success. On the final allowed failure the code is deleted so a fresh one
 * must be requested — the same brute-force bound the in-memory version had.
 */
export async function consumeOtpDb(purpose: string, key: string, submitted: unknown): Promise<OtpResult> {
  const { data: entry } = await supabaseServer
    .from(TABLE)
    .select('otp, expiry, attempts')
    .eq('purpose', purpose)
    .eq('key', key)
    .maybeSingle();

  if (!entry) return { ok: false, error: 'No valid code found. Please request a new one.', status: 400 };

  const del = () => supabaseServer.from(TABLE).delete().eq('purpose', purpose).eq('key', key);

  if (Date.now() > Number(entry.expiry)) {
    await del();
    return { ok: false, error: 'Code expired. Please request a new one.', status: 400 };
  }

  if (typeof submitted !== 'string' || !sameCode(entry.otp, submitted)) {
    const attempts = (entry.attempts ?? 0) + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await del();
      return { ok: false, error: 'Too many incorrect attempts. Please request a new code.', status: 429 };
    }
    await supabaseServer.from(TABLE).update({ attempts }).eq('purpose', purpose).eq('key', key);
    return { ok: false, error: 'Incorrect code. Please try again.', status: 400 };
  }

  await del();
  return { ok: true };
}

/**
 * Existence check that does NOT consume. Used for the email-change "old email
 * verified" flag that gates the second phase — it is a time-boxed marker, not a
 * code the user re-enters. Returns false (and cleans up) once expired.
 */
export async function peekOtp(purpose: string, key: string): Promise<boolean> {
  const { data: entry } = await supabaseServer
    .from(TABLE)
    .select('expiry')
    .eq('purpose', purpose)
    .eq('key', key)
    .maybeSingle();
  if (!entry) return false;
  if (Date.now() > Number(entry.expiry)) {
    await clearOtp(purpose, key);
    return false;
  }
  return true;
}

/** Delete a stored code/flag without validating it. */
export async function clearOtp(purpose: string, key: string): Promise<void> {
  await supabaseServer.from(TABLE).delete().eq('purpose', purpose).eq('key', key);
}
