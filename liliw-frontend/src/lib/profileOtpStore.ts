import { OtpEntry } from './otp';

export const profileOtpStore = new Map<string, OtpEntry>();
// Tracks old-email verified state during email-change flow (keyed by userId)
export const emailChangeVerified = new Map<string, { expiry: number }>();

// Re-exported so existing callers keep working. Generation now comes from the
// shared module, which uses a cryptographically secure source instead of
// Math.random().
export { generateOtp } from './otp';
