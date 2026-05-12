import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone, type, message } = await req.json();

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI}/api/participation-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        data: { full_name, email, phone: phone || '', type: type || null, message: message || '' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Strapi participation-request error:', err);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('participation-request route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
