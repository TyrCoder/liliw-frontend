import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

const STRAPI          = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const ADMIN_EMAIL     = process.env.STRAPI_ADMIN_EMAIL    || '';
const ADMIN_PASSWORD  = process.env.STRAPI_ADMIN_PASSWORD || '';

import { supabaseServer } from '@/lib/supabase-server';

const JWT_TTL_SECONDS = 18 * 60; // 18 minutes (Strapi tokens last 20 min)

async function getAdminJwt(): Promise<string | null> {
  // Check Supabase cache first (persists across serverless instances)
  const { data: cached } = await supabaseServer
    .from('kv_cache')
    .select('value, updated_at')
    .eq('key', 'strapi_admin_jwt')
    .single();

  if (cached?.value) {
    const age = (Date.now() - new Date(cached.updated_at).getTime()) / 1000;
    if (age < JWT_TTL_SECONDS) return cached.value;
  }

  try {
    const res = await fetch(`${STRAPI}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      cache: 'no-store',
    });
    if (!res.ok) { logger.error('[strapi-activity] admin login failed', res.status); return null; }
    const json = await res.json();
    const jwt  = json?.data?.token ?? null;
    if (jwt) {
      await supabaseServer.from('kv_cache').upsert(
        { key: 'strapi_admin_jwt', value: jwt, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    return jwt;
  } catch (err) {
    logger.error('[strapi-activity] admin login error', err);
    return null;
  }
}

// Strapi admin content-manager UIDs (singularName matches what Strapi generates)
const CONTENT_TYPES = [
  { uid: 'api::heritage-site.heritage-site',    label: 'Heritage Site',  nameField: 'name' },
  { uid: 'api::tourist-spot.tourist-spot',       label: 'Tourist Spot',   nameField: 'name' },
  { uid: 'api::dining-and-food.dining-and-food', label: 'Dining Place',   nameField: 'name' },
  { uid: 'api::event.event',                     label: 'Event',          nameField: 'title' },
  { uid: 'api::faq.faq',                         label: 'FAQ',            nameField: 'question' },
  { uid: 'api::itinerary.itinerary',             label: 'Itinerary',      nameField: 'title' },
  { uid: 'api::art-form.art-form',               label: 'Art Form',       nameField: 'title' },
  { uid: 'api::culture-aspect.culture-aspect',   label: 'Culture Aspect', nameField: 'title' },
  { uid: 'api::news.news',                       label: 'News',           nameField: 'title' },
  { uid: 'api::hero-slide.hero-slide',           label: 'Hero Slide',     nameField: 'title' },
];

function resolveRole(roles?: { name?: string; code?: string }[]): string {
  if (!roles || roles.length === 0) return 'Admin';
  const raw  = roles[0].name || roles[0].code || '';
  const norm = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (norm.includes('super'))                                          return 'Super Admin';
  if (norm.includes('chatoofficer') || norm.includes('officer'))       return 'CHATO Officer';
  if (norm.includes('chatoeditor')  || norm.includes('editor'))        return 'CHATO Editor';
  return raw || 'Admin';
}

export async function GET(request: NextRequest) {
  const ok = await requireStaffAuth(request);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jwt = await getAdminJwt();
  if (!jwt) return NextResponse.json({ success: true, data: [] });

  const results = await Promise.allSettled(
    CONTENT_TYPES.map(ct =>
      fetch(
        `${STRAPI}/admin/content-manager/collection-types/${ct.uid}?sort=updatedAt:DESC&pageSize=20`,
        { headers: { Authorization: `Bearer ${jwt}` }, cache: 'no-store' }
      )
        .then(r => r.ok ? r.json() : null)
        // Strapi 5 admin API returns { results: [...] }
        .then(json => ({ ct, items: (json?.results ?? json?.data ?? []) as any[] }))
        .catch(err => { logger.error(`[strapi-activity] ${ct.uid}:`, err); return { ct, items: [] }; })
    )
  );

  const activities: {
    id: string;
    contentType: string;
    entryName: string;
    action: string;
    at: string;
    performer: { name: string; email: string; role: string } | null;
  }[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { ct, items } = result.value;

    for (const item of items) {
      const entryName  = item[ct.nameField] || item.name || item.title || `#${item.id}`;
      const editorUser = item.updatedBy || item.createdBy;

      activities.push({
        id:          `${ct.uid}-${item.documentId || item.id}`,
        contentType: ct.label,
        entryName:   String(entryName).slice(0, 80),
        action:      item.updatedAt === item.createdAt ? 'created' : 'updated',
        at:          item.updatedAt,
        performer:   editorUser ? {
          name:  [editorUser.firstname, editorUser.lastname].filter(Boolean).join(' ')
                   || editorUser.username || editorUser.email || '—',
          email: editorUser.email || '',
          role:  resolveRole(editorUser.roles),
        } : null,
      });
    }
  }

  activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return NextResponse.json({ success: true, data: activities.slice(0, 100) });
}
