import { randomInt, timingSafeEqual } from 'crypto';

// Shared one-time-code handling for every OTP flow (password reset, registration,
// profile email/password changes).
//
// Codes were previously generated with Math.random() and checked with a plain
// `entry.otp !== otp` that neither counted nor invalidated failed guesses. A
// six-digit code is only 900k possibilities, so on an unthrottled endpoint an
// attacker could simply keep guessing until one landed. Verification now runs
// through consumeOtp(), which caps attempts, burns the code once that cap is
// hit, and compares in constant time.

export interface OtpEntry {
  otp: string;
  expiry: number;
  attempts?: number;
}

export type OtpStore = Map<string, OtpEntry>;

/** Wrong guesses allowed before the code is thrown away and must be re-requested. */
export const MAX_OTP_ATTEMPTS = 5;

/** Cryptographically secure 6-digit code (Math.random is not suitable for secrets). */
export function generateOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}

function sameCode(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export type OtpResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Validates a submitted code and consumes it on success. On the final allowed
 * failure the code is deleted, so a fresh one must be requested — this is what
 * bounds brute force even if the endpoint itself is hammered.
 */
export function consumeOtp(store: OtpStore, key: string, submitted: unknown): OtpResult {
  const entry = store.get(key);
  if (!entry) {
    return { ok: false, error: 'No valid code found. Please request a new one.', status: 400 };
  }
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return { ok: false, error: 'Code expired. Please request a new one.', status: 400 };
  }
  if (typeof submitted !== 'string' || !sameCode(entry.otp, submitted)) {
    entry.attempts = (entry.attempts ?? 0) + 1;
    if (entry.attempts >= MAX_OTP_ATTEMPTS) {
      store.delete(key);
      return { ok: false, error: 'Too many incorrect attempts. Please request a new code.', status: 429 };
    }
    return { ok: false, error: 'Incorrect code. Please try again.', status: 400 };
  }
  store.delete(key);
  return { ok: true };
}
