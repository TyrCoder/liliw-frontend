// Shared in-memory store for registration email OTPs.
// Key: lowercased email. TTL enforced at read time.
export const regOtpStore = new Map<string, { otp: string; expiry: number }>();
