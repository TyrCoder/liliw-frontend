import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';

const STRAPI          = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN           = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const ADMIN_EMAIL     = process.env.STRAPI_ADMIN_EMAIL || '';
const ADMIN_PASSWORD  = process.env.STRAPI_ADMIN_PASSWORD || '';

// Cache admin JWT within the same serverless instance (avoid re-login every request)
let adminTokenCache: { token: string; expiresAt: number } | null = null;

async function getStrapiAdminToken(): Promise<string | null> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  if (adminTokenCache && adminTokenCache.expiresAt > Date.now()) return adminTokenCache.token;

  try {
    const res = await fetch(`${STRAPI}/admin/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data?.data?.token || null;
    if (token) adminTokenCache = { token, expiresAt: Date.now() + 15 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // ── 1. Content API users (tourists / authenticated) ─────────────
    const contentRes = await fetch(
      `${STRAPI}/api/users?populate=role&pagination[pageSize]=200&sort=createdAt:desc`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 0 } }
    );
    const contentRaw: any[] = contentRes.ok ? await contentRes.json() : [];
    const contentUsers = (Array.isArray(contentRaw) ? contentRaw : []).map((u: any) => ({
      id: `c_${u.id}`,
      username: u.username || u.email,
      email: u.email,
      confirmed: u.confirmed ?? true,
      blocked: u.blocked ?? false,
      createdAt: u.createdAt,
      role: { name: u.role?.name || 'Authenticated' },
      source: 'content',
    }));

    // ── 2. Admin panel users (Super Admin, CHATO Officer, Editor) ────
    let adminUsers: any[] = [];
    const adminToken = await getStrapiAdminToken();
    if (adminToken) {
      const adminRes = await fetch(
        `${STRAPI}/admin/users?pageSize=100`,
        { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
      );
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        const results: any[] = adminData?.data?.results || adminData?.data || [];
        adminUsers = results.map((u: any) => ({
          id: `a_${u.id}`,
          username: u.firstname ? `${u.firstname} ${u.lastname || ''}`.trim() : u.email,
          email: u.email,
          confirmed: u.isActive ?? true,
          blocked: !(u.isActive ?? true),
          createdAt: u.createdAt,
          role: { name: u.roles?.[0]?.name || 'Admin' },
          source: 'admin',
        }));
      }
    }

    // Admin panel users first, then content users
    return NextResponse.json({ data: [...adminUsers, ...contentUsers] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
