import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from './session';
import { supabaseServer } from './supabase-server';

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
  // Fast path: signed session cookie
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? verifySession(cookie) : null;
  if (session?.email) return { email: session.email };

  const token = getToken(req);
  if (!token) return false;
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user?.email) return false;
    return { email: user.email };
  } catch {
    return false;
  }
}

export async function requireAdminAuth(req: NextRequest): Promise<boolean> {
  const role = getSessionRole(req);
  if (role !== null) return role === 'admin';

  const user = await requireAuth(req);
  if (!user) return false;
  const adminEmails = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
  ].map(e => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.includes(user.email.toLowerCase())) return true;

  const { data: profile } = await supabaseServer.from('profiles').select('role').eq('email', user.email).single();
  return profile?.role === 'admin';
}

export async function requireStaffAuth(req: NextRequest): Promise<boolean> {
  const role = getSessionRole(req);
  if (role !== null) return role === 'admin' || role === 'chatoofficer' || role === 'chatoeditor';

  const token = getToken(req);
  if (!token) return false;
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user?.email) return false;

    const adminEmails = [
      ...(process.env.ADMIN_EMAILS || '').split(','),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email.toLowerCase())) return true;

    const { data: profile } = await supabaseServer.from('profiles').select('role').eq('email', user.email).single();
    const r = profile?.role ?? 'authenticated';
    return r === 'admin' || r === 'chatoofficer' || r === 'chatoeditor';
  } catch {
    return false;
  }
}
