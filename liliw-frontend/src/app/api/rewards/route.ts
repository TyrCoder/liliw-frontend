import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(request: NextRequest) {
  const { data: rewards, error } = await supabaseServer
    .from('rewards')
    .select('id, name, description, icon, badge_color, points_cost, stock, claim_type, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: [], totalPoints: 0, _error: error.message });

  let totalPoints = 0;
  let claimedRewardIds: string[] = [];
  const auth = await verifyToken(request);
  if (auth?.userId) {
    const { data: pointRows } = await supabaseServer.from('user_points').select('points').eq('user_id', auth.userId);
    totalPoints = (pointRows ?? []).reduce((s, r) => s + (r.points || 0), 0);

    const { data: redeemedRows } = await supabaseServer
      .from('reward_redemptions')
      .select('reward_id')
      .eq('user_id', auth.userId);
    claimedRewardIds = (redeemedRows ?? []).map(r => r.reward_id).filter(Boolean);
  }

  const data = (rewards ?? []).map(r => ({
    ...r,
    // Online badges are one-per-person; already-claimed ones are flagged so the UI can gray them out.
    alreadyClaimed: r.claim_type === 'online' && claimedRewardIds.includes(r.id),
  }));

  return NextResponse.json({ data, totalPoints });
}
