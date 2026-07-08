import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('reward_redemptions')
    .select('id, reward_name, points_spent, redemption_code, claim_type, image_url, status, created_at, redeemed_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}
