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

/**
 * The role of whoever is making this request.
 *
 * The bearer token is consulted first and the session cookie only as a
 * fallback. It used to be the other way round, as a way of avoiding a Supabase
 * round-trip, and that is wrong whenever the two disagree — which happens
 * routinely on a shared machine. Sign in as a business, then sign in as an
 * editor: the cookie still carried the business's role, every staff endpoint
 * returned 401, and because those callers render `d.data || []` the dashboard
 * showed its tabs with every list empty. Three real change requests sat in the
 * table while the screen said "No change requests yet".
 *
 * The token is issued to the account making the call, so it is the authority.
 */
async function roleFromRequest(req: NextRequest): Promise<string | null> {
  const token = getToken(req);
  if (token) {
    try {
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (!error && user?.email) {
        const adminEmails = [
          ...(process.env.ADMIN_EMAILS || '').split(','),
          ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
        ].map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(user.email.toLowerCase())) return 'admin';

        const { data: profile } = await supabaseServer
          .from('profiles').select('role').eq('email', user.email).maybeSingle();
        return profile?.role ?? 'authenticated';
      }
    } catch {
      // Fall through to the cookie: a Supabase blip should not sign someone
      // out of a dashboard they are legitimately in.
    }
  }
  return getSessionRole(req);
}

const STAFF_ROLES = ['admin', 'chatoofficer', 'chatoeditor'];

export async function requireAdminAuth(req: NextRequest): Promise<boolean> {
  return (await roleFromRequest(req)) === 'admin';
}

export async function requireStaffAuth(req: NextRequest): Promise<boolean> {
  const role = await roleFromRequest(req);
  return !!role && STAFF_ROLES.includes(role);
}
