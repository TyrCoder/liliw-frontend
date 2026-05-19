import { supabaseServer } from '@/lib/supabase-server';

const STRAPI         = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const ADMIN_EMAIL    = process.env.STRAPI_ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD || '';
const JWT_TTL        = 18 * 60; // seconds

export async function getStrapiAdminJwt(): Promise<string | null> {
  const { data: cached } = await supabaseServer
    .from('kv_cache')
    .select('value, updated_at')
    .eq('key', 'strapi_admin_jwt')
    .single();

  if (cached?.value) {
    const age = (Date.now() - new Date(cached.updated_at).getTime()) / 1000;
    if (age < JWT_TTL) return cached.value;
  }

  try {
    const res = await fetch(`${STRAPI}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const jwt  = json?.data?.token ?? null;
    if (jwt) {
      await supabaseServer.from('kv_cache').upsert(
        { key: 'strapi_admin_jwt', value: jwt, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    return jwt;
  } catch { return null; }
}

export async function getStrapiUserByEmail(email: string, jwt: string): Promise<{ documentId: string; id: number } | null> {
  const res = await fetch(
    `${STRAPI}/admin/content-manager/collection-types/plugin::users-permissions.user?filters[email][$eq]=${encodeURIComponent(email)}&pageSize=1`,
    { headers: { Authorization: `Bearer ${jwt}` }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const user = (data?.results ?? data?.data ?? [])[0];
  if (!user) return null;
  return { documentId: user.documentId ?? String(user.id), id: user.id };
}

export async function updateStrapiUser(documentId: string, fields: Record<string, unknown>, jwt: string): Promise<boolean> {
  const res = await fetch(
    `${STRAPI}/admin/content-manager/collection-types/plugin::users-permissions.user/${documentId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(fields),
      cache: 'no-store',
    }
  );
  return res.ok;
}
