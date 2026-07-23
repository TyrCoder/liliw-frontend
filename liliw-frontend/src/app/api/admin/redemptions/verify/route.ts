import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';
import { getCmsIdentity } from '@/lib/cms-auth';

// GET ?code=XXXX — look up a code's details without consuming it (staff review step)
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const { data, error } = await supabaseServer
    .from('reward_redemptions')
    .select('id, redemption_code, reward_name, points_spent, status, created_at, redeemed_at, redeemed_by, user_id, image_url')
    .eq('redemption_code', code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No redemption found for this code' }, { status: 404 });

  const { data: profile } = await supabaseServer.from('profiles').select('email, username').eq('id', data.user_id).maybeSingle();

  return NextResponse.json({ data: { ...data, profile } });
}

// POST { code } — marks the code as redeemed (the "receipt" confirmation)
export async function POST(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json();
  const cleanCode = code?.trim().toUpperCase();
  if (!cleanCode) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const { data: redemption } = await supabaseServer
    .from('reward_redemptions')
    .select('id, status, reward_name, redeemed_at, redeemed_by')
    .eq('redemption_code', cleanCode)
    .maybeSingle();

  if (!redemption) return NextResponse.json({ error: 'No redemption found for this code' }, { status: 404 });
  if (redemption.status === 'redeemed') {
    return NextResponse.json({ error: `Already redeemed on ${new Date(redemption.redeemed_at).toLocaleString('en-PH')} by ${redemption.redeemed_by || 'staff'}` }, { status: 409 });
  }

  const { email } = await getCmsIdentity(request);

  const { data, error } = await supabaseServer
    .from('reward_redemptions')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString(), redeemed_by: email })
    .eq('id', redemption.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to confirm redemption' }, { status: 500 });
  return NextResponse.json({ data });
}
