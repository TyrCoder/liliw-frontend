import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase-server';
import { verifySession, SESSION_COOKIE } from './session';

/**
 * The email of whoever is calling an LBO endpoint.
 *
 * Token first, cookie second — the order matters and used to be the other way
 * round in five separate copies of this function. On a shared browser the
 * cookie can still hold the previous account: sign in as an admin and then as
 * a business, and the business's own dashboard resolved to the admin's
 * address. That is not only a listing that fails to load, it is a change
 * request filed against the wrong business.
 *
 * The cookie stays as the fallback for callers that send no token, and for a
 * Supabase outage, which should not lock an owner out of their own dashboard.
 */
export async function lboEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (token) {
    try {
      const { data: { user } } = await supabaseServer.auth.getUser(token);
      if (user?.email) return user.email;
    } catch {
      // Fall through to the cookie.
    }
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  return (cookie ? verifySession(cookie) : null)?.email ?? null;
}
