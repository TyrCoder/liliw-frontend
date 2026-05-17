import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

const CONTENT_TYPES = [
  { endpoint: 'heritage-sites',   label: 'Heritage Site',  nameField: 'name' },
  { endpoint: 'tourist-spots',    label: 'Tourist Spot',   nameField: 'name' },
  { endpoint: 'dining-and-foods', label: 'Dining Place',   nameField: 'name' },
  { endpoint: 'events',           label: 'Event',          nameField: 'title' },
  { endpoint: 'faqs',             label: 'FAQ',            nameField: 'question' },
  { endpoint: 'itineraries',      label: 'Itinerary',      nameField: 'title' },
  { endpoint: 'art-forms',        label: 'Art Form',       nameField: 'title' },
  { endpoint: 'culture-aspects',  label: 'Culture Aspect', nameField: 'title' },
  { endpoint: 'newses',           label: 'News',           nameField: 'title' },
  { endpoint: 'hero-slides',      label: 'Hero Slide',     nameField: 'title' },
];

function resolveRole(roles?: { name: string }[]): string {
  if (!roles || roles.length === 0) return 'Admin';
  const raw  = roles[0].name;
  const norm = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (norm.includes('super'))                                          return 'Super Admin';
  if (norm.includes('chatoofficer') || norm.includes('officer'))       return 'CHATO Officer';
  if (norm.includes('chatoeditor')  || norm.includes('editor'))        return 'CHATO Editor';
  return raw;
}

export async function GET(request: NextRequest) {
  const ok = await requireStaffAuth(request);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const qs = [
    'populate[updatedBy][fields][0]=firstname',
    'populate[updatedBy][fields][1]=lastname',
    'populate[updatedBy][fields][2]=email',
    'populate[updatedBy][fields][3]=username',
    'populate[updatedBy][populate][roles][fields][0]=name',
    'populate[createdBy][fields][0]=firstname',
    'populate[createdBy][fields][1]=lastname',
    'populate[createdBy][fields][2]=email',
    'populate[createdBy][fields][3]=username',
    'populate[createdBy][populate][roles][fields][0]=name',
    'sort=updatedAt:desc',
    'pagination[limit]=20',
  ].join('&');

  const results = await Promise.allSettled(
    CONTENT_TYPES.map(ct =>
      fetch(`${STRAPI}/api/${ct.endpoint}?${qs}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: 'no-store',
      })
        .then(r => r.ok ? r.json() : null)
        .then(json => ({ ct, items: (json?.data || []) as any[] }))
        .catch(err => { logger.error(`[strapi-activity] ${ct.endpoint}:`, err); return { ct, items: [] }; })
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
      const updatedBy  = item.updatedBy as any;
      const createdBy  = item.createdBy as any;
      const editorUser = updatedBy || createdBy;

      activities.push({
        id:          `${ct.endpoint}-${item.documentId || item.id}`,
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
