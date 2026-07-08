import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(request: NextRequest) {
  const { data: rewards, error } = await supabaseServer
    .from('rewards')
    .select('id, name, description, icon, badge_color, points_cost, stock, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: [], totalPoints: 0, _error: error.message });

  let totalPoints = 0;
  const auth = await verifyToken(request);
  if (auth?.userId) {
    const { data: pointRows } = await supabaseServer.from('user_points').select('points').eq('user_id', auth.userId);
    totalPoints = (pointRows ?? []).reduce((s, r) => s + (r.points || 0), 0);
  }

  return NextResponse.json({ data: rewards ?? [], totalPoints });
}
