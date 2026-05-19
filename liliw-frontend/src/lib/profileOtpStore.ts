export const profileOtpStore = new Map<string, { otp: string; expiry: number }>();
// Tracks old-email verified state during email-change flow (keyed by userId)
export const emailChangeVerified = new Map<string, { expiry: number }>();

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
