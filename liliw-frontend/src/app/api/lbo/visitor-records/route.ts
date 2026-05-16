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
    .from('lbo_visitor_records')
    .select('*')
    .eq('lbo_email', user.email)
    .order('year',  { ascending: false })
    .order('month', { ascending: false });

  if (error) return NextResponse.json({ data: [] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await request.json();
  if (!b.attraction_name || !b.month || !b.year) {
    return NextResponse.json({ error: 'attraction_name, month and year are required' }, { status: 400 });
  }

  const n = (v: any) => Math.max(0, Number(v) || 0);

  const { error } = await supabaseServer
    .from('lbo_visitor_records')
    .insert({
      attraction_name:       b.attraction_name,
      month:                 Number(b.month),
      year:                  Number(b.year),
      local_male:            n(b.local_male),
      local_female:          n(b.local_female),
      other_city_male:       n(b.other_city_male),
      other_city_female:     n(b.other_city_female),
      other_province_male:   n(b.other_province_male),
      other_province_female: n(b.other_province_female),
      foreign_male:          n(b.foreign_male),
      foreign_female:        n(b.foreign_female),
      lbo_email:             user.email,
    });

  if (error) return NextResponse.json({ error: 'Failed to submit', detail: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
