import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from './session';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

function getSessionRole(req: NextRequest): string | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return verifySession(cookie)?.role ?? null;
}

export async function requireAuth(req: NextRequest): Promise<false | { email: string }> {
  // Fast path: signed session cookie (no Strapi call)
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? verifySession(cookie) : null;
  if (session?.email) return { email: session.email };

  const token = getToken(req);
  if (!token) return false;
  try {
    const res = await fetch(`${STRAPI}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return { email: user.email };
  } catch {
    return false;
  }
}

export async function requireAdminAuth(req: NextRequest): Promise<boolean> {
  // Fast path: signed session cookie
  const role = getSessionRole(req);
  if (role !== null) return role === 'admin';

  const user = await requireAuth(req);
  if (!user) return false;
  const adminEmails = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
  ].map(e => e.trim().toLowerCase()).filter(Boolean);
  return adminEmails.includes(user.email.toLowerCase());
}

// Allows admin emails OR any user whose Strapi role contains 'chato', 'editor', or 'officer'
export async function requireStaffAuth(req: NextRequest): Promise<boolean> {
  // Fast path: signed session cookie
  const role = getSessionRole(req);
  if (role !== null) return role === 'admin' || role === 'chatoofficer' || role === 'chatoeditor';

  const token = getToken(req);
  if (!token) return false;
  try {
    const res = await fetch(`${STRAPI}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const user = await res.json();
    // Accept both ADMIN_EMAILS and NEXT_PUBLIC_ADMIN_EMAILS so only one needs to be set
    const adminEmails = [
      ...(process.env.ADMIN_EMAILS || '').split(','),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes((user.email || '').toLowerCase())) return true;
    const roleName = (user.role?.name || '').toLowerCase().replace(/[\s_-]/g, '');
    return roleName.includes('chato') || roleName.includes('editor') || roleName.includes('officer') || roleName.includes('admin');
  } catch {
    return false;
  }
}
