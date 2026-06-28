import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = auth.userId;

  const [pointsRes, earnedRes, allRes] = await Promise.all([
    supabaseServer.from('user_points').select('points, action, reference_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseServer.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
    supabaseServer.from('achievements').select('id, name, description, icon, badge_color, trigger_type, trigger_value, points_reward, sort_order').eq('is_active', true).order('sort_order'),
  ]);

  const pointLog  = pointsRes.data ?? [];
  const earned    = earnedRes.data ?? [];
  const allAchs   = allRes.data ?? [];

  const totalPoints = pointLog.reduce((s, r) => s + (r.points || 0), 0);
  const earnedSet   = new Set(earned.map(e => e.achievement_id));
  const earnedMap   = new Map(earned.map(e => [e.achievement_id, e.earned_at]));

  const achievements = allAchs.map(a => ({
    ...a,
    earned: earnedSet.has(a.id),
    earned_at: earnedMap.get(a.id) ?? null,
  }));

  return NextResponse.json({
    totalPoints,
    achievements,
    recentActivity: pointLog.slice(0, 10),
  });
}
