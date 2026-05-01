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

    const baseUrl = `${STRAPI_URL}/api/${endpoint}/${strapiId}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    };

    // Update the draft
    const putRes = await fetch(baseUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data: { hotspots } }),
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      return NextResponse.json({ error: `PUT failed (${putRes.status}): ${text}` }, { status: putRes.status });
    }

    // Publish so the changes are visible via the public Content API
    const pubRes = await fetch(`${baseUrl}/actions/publish`, { method: 'POST', headers });
    if (!pubRes.ok) {
      const text = await pubRes.text();
      return NextResponse.json({ error: `Publish failed (${pubRes.status}): ${text}` }, { status: pubRes.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
