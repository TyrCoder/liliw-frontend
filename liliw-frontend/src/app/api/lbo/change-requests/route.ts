import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

async function getUser(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const res = await fetch(`${STRAPI}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : null;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('lbo_change_requests')
    .select('*')
    .eq('lbo_email', user.email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attraction_name, field_to_change, current_value, requested_value, reason, lbo_name } = await request.json();
  if (!attraction_name || !field_to_change || !requested_value) {
    return NextResponse.json({ error: 'attraction_name, field_to_change and requested_value are required' }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from('lbo_change_requests')
    .insert({
      attraction_name,
      field_to_change,
      current_value:   current_value  || null,
      requested_value,
      reason:          reason         || null,
      lbo_email:       user.email,
      lbo_name:        lbo_name || user.username,
      status:          'pending',
    });

  if (error) return NextResponse.json({ error: 'Failed to submit', detail: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
