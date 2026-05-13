import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(
      `${STRAPI}/api/users?populate=role&pagination[pageSize]=200&sort=createdAt:desc`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('Strapi error');
    const data = await res.json();
    return NextResponse.json({ data: Array.isArray(data) ? data : [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
