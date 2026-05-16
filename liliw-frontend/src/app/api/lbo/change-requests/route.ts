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
    `${STRAPI}/api/lbo-change-requests?filters[lbo_email][$eq]=${encodeURIComponent(user.email)}&sort=createdAt:desc`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json());
}

export async function POST(request: NextRequest) {
  const user = await getUser(request.headers.get('Authorization') || '');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attraction_name, field_to_change, current_value, requested_value, reason, lbo_name } = await request.json();
  if (!attraction_name || !field_to_change || !requested_value) {
    return NextResponse.json({ error: 'attraction_name, field_to_change and requested_value are required' }, { status: 400 });
  }

  const res = await fetch(`${STRAPI}/api/lbo-change-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      data: {
        attraction_name,
        attraction_id: attraction_name,
        field_to_change,
        current_value:  current_value  || '',
        requested_value,
        reason:         reason         || '',
        lbo_email:      user.email,
        lbo_name:       lbo_name || user.username,
        status:         'pending',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to submit', detail: err }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
