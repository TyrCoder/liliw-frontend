import { NextResponse } from 'next/server';
import { clearSessionCookieHeader } from '@/lib/session';

/**
 * Ends the session on the server.
 *
 * Signing out cleared the two localStorage keys and the client-readable
 * cookie, but never the signed liliw-auth cookie — it is HttpOnly, so the
 * browser cannot remove it and nothing asked the server to. Middleware reads
 * exactly that cookie, so a signed-out browser was still admitted to /admin,
 * /cms and /lbo for the remaining seven days of its life.
 *
 * clearSessionCookieHeader has existed since the cookie was introduced and had
 * no caller.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', clearSessionCookieHeader());
  return res;
}
