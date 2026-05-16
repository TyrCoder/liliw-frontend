import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

async function getUser(authHeader: string) {
  const userToken = authHeader.replace('Bearer ', '');
  if (!userToken) return null;
  const res = await fetch(`${STRAPI}/api/users/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return res.ok ? res.json() : null;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(
    `${STRAPI}/api/visitor-records?filters[lbo_email][$eq]=${encodeURIComponent(user.email)}&sort=year:desc,month:desc`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json());
}

export async function POST(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await request.json();
  if (!b.attraction_name || !b.month || !b.year) {
    return NextResponse.json({ error: 'attraction_name, month and year are required' }, { status: 400 });
  }

  const n = (v: any) => Math.max(0, Number(v) || 0);

  const res = await fetch(`${STRAPI}/api/visitor-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      data: {
        attraction_name:       b.attraction_name,
        attraction_id:         b.attraction_name,
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
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to submit', detail: err }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
