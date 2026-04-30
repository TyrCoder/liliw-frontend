import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

const ENDPOINTS: Record<string, string> = {
  heritage: 'heritage-sites',
  spot: 'tourist-spots',
  dining: 'dining-and-foods',
};

export async function POST(req: NextRequest) {
  try {
    const { attractionType, strapiId, hotspots } = await req.json();

    const endpoint = ENDPOINTS[attractionType];
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid attraction type' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/${endpoint}/${strapiId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: { hotspots } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
