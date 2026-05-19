import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'liliw-auth';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  email: string;
  role: string;  // 'admin' | 'chatoofficer' | 'chatoeditor' | 'authenticated' | ...
  exp: number;   // unix seconds
}

function secret(): string | null {
  return process.env.SESSION_SECRET || null;
}

export function createSession(email: string, role: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(
    JSON.stringify({ email, role, exp: Math.floor(Date.now() / 1000) + MAX_AGE })
  ).toString('base64');
  const sig = createHmac('sha256', key).update(payload).digest('base64');
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  const key = secret();
  if (!key || !token) return null;
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig     = token.slice(dot + 1);
    const expected = createHmac('sha256', key).update(payload).digest('base64');
    const aBuf = Buffer.from(sig,      'base64');
    const bBuf = Buffer.from(expected, 'base64');
    if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null;
    const data: SessionPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Server-side mirror of AuthContext staffCookieRole(). */
export function computeRole(user: { email?: string; role?: { name?: string; type?: string } }): string {
  const email    = (user.email || '').toLowerCase();
  const roleName = (user.role?.name || '').toLowerCase();
  const roleType = (user.role?.type || 'authenticated').toLowerCase();
  const norm     = (s: string) => s.replace(/[\s_-]/g, '');
  const hasChatoRole = norm(roleName).includes('chato');

  const adminEmails = [
    ...(process.env.ADMIN_EMAILS             || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
  ].map(e => e.trim().toLowerCase()).filter(Boolean);

  if (norm(roleType) === 'admin' || norm(roleName) === 'admin' ||
      (adminEmails.includes(email) && !hasChatoRole)) return 'admin';
  if (norm(roleType).includes('chatoofficer') || norm(roleName).includes('chatoofficer')) return 'chatoofficer';
  if (norm(roleType).includes('chatoeditor')  || norm(roleName).includes('chatoeditor'))  return 'chatoeditor';
  return roleType;
}
