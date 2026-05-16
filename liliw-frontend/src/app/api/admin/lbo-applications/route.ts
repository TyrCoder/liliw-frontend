import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

// GET — list all LBO applications
export async function GET() {
  const res = await fetch(`${STRAPI}/api/lbo-applications?populate=documents&sort=createdAt:desc`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ data: [], _error: err, _status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

// PATCH — update application status { id, status, notes }
export async function PATCH(request: NextRequest) {
  const { id, status, notes } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const res = await fetch(`${STRAPI}/api/lbo-applications/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { status, notes: notes || '' } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to update', detail: err }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
