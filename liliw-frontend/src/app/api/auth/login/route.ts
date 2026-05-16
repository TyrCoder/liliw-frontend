import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

// Deterministic password derived from admin email + server secret.
// Same email always produces the same password so the auto-created
// frontend account can be re-authenticated on every login.
function derivedPassword(email: string): string {
  const secret = process.env.STRAPI_ADMIN_PASSWORD || 'liliw-admin-sync';
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

async function getAdminPanelUser(email: string): Promise<{ role: string | null; firstname: string } | null> {
  try {
    const authRes = await fetch(`${STRAPI}/admin/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    process.env.STRAPI_ADMIN_EMAIL,
        password: process.env.STRAPI_ADMIN_PASSWORD,
      }),
    });
    if (!authRes.ok) return null;

    const { data: authData } = await authRes.json();
    const adminJWT = authData?.token;
    if (!adminJWT) return null;

    const usersRes = await fetch(
      `${STRAPI}/admin/users?filters[email][$eq]=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${adminJWT}` } },
    );
    if (!usersRes.ok) return null;

    const { data } = await usersRes.json();
    const adminUser = data?.results?.[0] ?? data?.[0];
    if (!adminUser) return null;

    return {
      role:      adminUser.roles?.[0]?.name ?? null,
      firstname: adminUser.firstname || email.split('@')[0],
    };
  } catch {
    return null;
  }
}

// Get or create a Users & Permissions frontend account for an admin panel user.
// Uses a deterministic password so re-authentication always works.
async function syncAdminFrontendAccount(email: string, username: string): Promise<{ jwt: string; user: any } | null> {
  const password = derivedPassword(email);

  // Try logging in first (account may already exist from a previous sync)
  const loginRes = await fetch(`${STRAPI}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    return { jwt: data.jwt, user: await meRes.json() };
  }

  // Account doesn't exist — create it
  const regRes = await fetch(`${STRAPI}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!regRes.ok) return null;

  const regData = await regRes.json();
  const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${regData.jwt}` },
  });
  return { jwt: regData.jwt, user: await meRes.json() };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Try again in 1 minute.' } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    // ── Step 1: Try regular frontend (Users & Permissions) auth ──
    const res = await fetch(`${STRAPI}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Server is starting up, please try again in a moment.' } },
        { status: 503 },
      );
    }

    if (res.ok) {
      // Frontend auth succeeded — also check admin panel role
      const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${data.jwt}` },
      });
      const user = await meRes.json();
      const adminInfo = await getAdminPanelUser(user.email);
      if (adminInfo?.role) user.adminPanelRole = adminInfo.role;
      return NextResponse.json({ jwt: data.jwt, user });
    }

    // ── Step 2: Frontend auth failed — try Strapi admin panel auth ──
    const identifier = body.identifier as string;
    const password   = body.password  as string;

    const adminAuthRes = await fetch(`${STRAPI}/admin/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password }),
    });

    if (!adminAuthRes.ok) {
      // Both failed — return the original frontend error
      return NextResponse.json(data, { status: res.status });
    }

    const adminAuth     = await adminAuthRes.json();
    const adminUserInfo = adminAuth.data?.user;
    const adminRole     = adminUserInfo?.roles?.[0]?.name ?? null;
    const username      = adminUserInfo?.firstname || identifier.split('@')[0];

    // Auto-create (or reuse) a frontend account for this admin
    const synced = await syncAdminFrontendAccount(identifier, username);
    if (!synced) {
      return NextResponse.json(
        { error: { message: 'Admin account sync failed. Please contact support.' } },
        { status: 500 },
      );
    }

    if (adminRole) synced.user.adminPanelRole = adminRole;
    return NextResponse.json({ jwt: synced.jwt, user: synced.user });

  } catch {
    return NextResponse.json(
      { error: { message: 'Login failed. Please try again.' } },
      { status: 500 },
    );
  }
}
