import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';

const STRAPI       = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { eventId, full_name, email, phone, notes, strapi_user_id, username } = await request.json();

    if (!eventId || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI}/api/event-signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          event: eventId,
          full_name,
          email,
          phone: phone || '',
          notes: notes || '',
          strapi_user_id: strapi_user_id || null,
          username: username || '',
          status: 'pending',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Strapi event-signup error:', err);
      return NextResponse.json({ error: 'Failed to save sign-up' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('event-signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdminAuth(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(
      `${STRAPI}/api/event-signups?populate=event&sort=createdAt:desc&pagination[limit]=200`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('Strapi error');
    const data = await res.json();
    return NextResponse.json({ success: true, data: data.data || [] });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
