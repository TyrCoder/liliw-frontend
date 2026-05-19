import { NextRequest } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function requireAuth(req: NextRequest): Promise<false | { email: string }> {
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
    const role = (user.role?.name || '').toLowerCase().replace(/[\s_-]/g, '');
    return role.includes('chato') || role.includes('editor') || role.includes('officer') || role.includes('admin');
  } catch {
    return false;
  }
}
