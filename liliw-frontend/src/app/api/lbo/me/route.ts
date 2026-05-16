import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || '';
  const userToken = auth.replace('Bearer ', '');
  if (!userToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const meRes = await fetch(`${STRAPI}/api/users/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  const user = await meRes.json();

  const appRes = await fetch(
    `${STRAPI}/api/lbo-applications?filters[email][$eq]=${encodeURIComponent(user.email)}&filters[status][$eq]=approved`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!appRes.ok) return NextResponse.json({ error: 'Failed to check application' }, { status: 500 });

  const appData = await appRes.json();
  const apps = appData.data || [];
  if (apps.length === 0) {
    return NextResponse.json({ isLbo: false }, { status: 403 });
  }

  const app = apps[0];
  const a = app.attributes || app;
  return NextResponse.json({
    isLbo: true,
    application: {
      id: app.id,
      business_name:   a.business_name,
      owner_name:      a.owner_name,
      email:           a.email,
      phone:           a.phone,
      address:         a.address,
      attraction_name: a.attraction_name,
      business_type:   a.business_type,
    },
    user: { id: user.id, email: user.email, username: user.username },
  });
}
