import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const CREDS  = {
  email:    process.env.STRAPI_ADMIN_EMAIL    || '',
  password: process.env.STRAPI_ADMIN_PASSWORD || '',
};

async function tryLogin(url: string) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin':  STRAPI,
        'Referer': `${STRAPI}/admin`,
      },
      body: JSON.stringify(CREDS),
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, body: json ?? text.slice(0, 200) };
  } catch (e: any) {
    return { status: 0, ok: false, error: e.message };
  }
}

export async function GET(_request: NextRequest) {
  const candidates = [
    `${STRAPI}/admin/login`,
    `${STRAPI}/admin/auth/local`,
    `${STRAPI}/admin/auth/login`,
    `${STRAPI}/api/admin/login`,
  ];

  const results: Record<string, any> = {};
  for (const url of candidates) {
    results[url.replace(STRAPI, '')] = await tryLogin(url);
  }

  return NextResponse.json({
    strapi_url: STRAPI,
    credentials_configured: !!(CREDS.email && CREDS.password),
    results,
  });
}
