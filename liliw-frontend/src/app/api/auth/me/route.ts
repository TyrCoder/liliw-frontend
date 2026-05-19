import { NextRequest, NextResponse } from 'next/server';
import { createSession, computeRole, sessionCookieHeader, verifySession, SESSION_COOKIE } from '@/lib/session';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json(null, { status: 401 });

  // Try Strapi — on cold start this may time out
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!meRes.ok) return NextResponse.json(null, { status: 401 });

    const user = await meRes.json();

    // Fall back to API token fetch if role not populated
    if (!user.role && user.id) {
      const byIdRes = await fetch(`${STRAPI}/api/users/${user.id}?populate=role`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (byIdRes.ok) {
        const full = await byIdRes.json();
        user.role = full.role ?? null;
      }
    }

    // Set / refresh the signed session cookie so subsequent API calls skip Strapi
    const sessionToken = createSession(user.email, computeRole(user));
    const res = NextResponse.json(user);
    if (sessionToken) res.headers.set('Set-Cookie', sessionCookieHeader(sessionToken));
    return res;
  } catch {
    clearTimeout(t);
    // Strapi cold start — fall back to existing signed cookie if present
    const existing = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (existing?.email) {
      return NextResponse.json({ email: existing.email, role: existing.role });
    }
    return NextResponse.json(null, { status: 503 });
  }
}
