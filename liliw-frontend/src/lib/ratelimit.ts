const attempts = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
