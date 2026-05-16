import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || '';
  const userToken = auth.replace('Bearer ', '');
  if (!userToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify identity via Strapi JWT
  const meRes = await fetch(`${STRAPI}/api/users/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  const user = await meRes.json();

  // Look up approved LBO application in Supabase
  const { data, error } = await supabaseServer
    .from('lbo_applications')
    .select('*')
    .eq('email', user.email)
    .eq('status', 'approved')
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ isLbo: false }, { status: 403 });
  }

  return NextResponse.json({
    isLbo: true,
    application: {
      id:              data.id,
      business_name:   data.business_name,
      owner_name:      data.owner_name,
      email:           data.email,
      phone:           data.phone,
      address:         data.address,
      attraction_name: data.attraction_name,
      business_type:   data.business_type,
    },
    user: { id: user.id, email: user.email, username: user.username },
  });
}
