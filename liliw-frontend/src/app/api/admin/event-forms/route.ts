import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

async function getEditorEmail(req: NextRequest): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  try {
    const res = await fetch(`${STRAPI}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = await res.json();
    return user.email ?? null;
  } catch {
    return null;
  }
}

// GET — list all event forms (staff only)
export async function GET(req: NextRequest) {
  if (!await requireStaffAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('event_forms')
    .select('id, event_slug, event_title, is_active, created_by, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create or update a form for an event (editor/admin)
export async function POST(req: NextRequest) {
  if (!await requireStaffAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_slug, event_title, fields, is_active } = await req.json();
  if (!event_slug?.trim() || !event_title?.trim()) {
    return NextResponse.json({ error: 'event_slug and event_title are required' }, { status: 400 });
  }
  if (!Array.isArray(fields)) {
    return NextResponse.json({ error: 'fields must be an array' }, { status: 400 });
  }

  const email = await getEditorEmail(req);

  const { data, error } = await supabaseServer
    .from('event_forms')
    .upsert({
      event_slug: event_slug.trim(),
      event_title: event_title.trim(),
      fields,
      is_active: is_active ?? true,
      created_by: email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_slug' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
