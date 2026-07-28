import { OtpEntry } from './otp';

// Shared in-memory store for registration email OTPs.
// Key: lowercased email. TTL and attempt limits enforced by consumeOtp().
export const regOtpStore = new Map<string, OtpEntry>();
