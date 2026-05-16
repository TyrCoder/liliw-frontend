import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

async function getAdminPanelRole(email: string): Promise<string | null> {
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
    return adminUser?.roles?.[0]?.name ?? null;
  } catch {
    return null;
  }
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

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const user = await meRes.json();

    // Check if this email belongs to a Strapi admin panel user and attach their role
    const adminPanelRole = await getAdminPanelRole(user.email);
    if (adminPanelRole) user.adminPanelRole = adminPanelRole;

    return NextResponse.json({ jwt: data.jwt, user });
  } catch {
    return NextResponse.json(
      { error: { message: 'Login failed. Please try again.' } },
      { status: 500 },
    );
  }
}
