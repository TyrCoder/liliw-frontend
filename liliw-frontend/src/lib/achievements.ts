import { supabaseServer } from './supabase-server';

export const POINTS = {
  event_signup:     15,
  review:           20,
  attraction_visit: 5,
  share:            5,
} as const;

export interface UnlockedAchievement {
  id: string;
  name: string;
  icon: string;
  badge_color: string;
  points_reward: number;
}

export async function awardPoints(
  userId: string,
  action: keyof typeof POINTS,
  referenceId: string,
  referenceName: string,
): Promise<UnlockedAchievement[]> {
  const points = POINTS[action];

  // Insert points log (unique index prevents duplicates for same action+ref)
  const { error } = await supabaseServer.from('user_points').insert({
    user_id: userId, points, action, reference_id: referenceId, reference_name: referenceName,
  });
  if (error) return []; // duplicate or db error — skip silently

  // Recompute totals for achievement checks
  const { data: pointRows } = await supabaseServer
    .from('user_points')
    .select('action')
    .eq('user_id', userId);

  if (!pointRows) return [];

  const eventCount  = pointRows.filter(r => r.action === 'event_signup').length;
  const reviewCount = pointRows.filter(r => r.action === 'review').length;
  const visitCount  = pointRows.filter(r => r.action === 'attraction_visit').length;
  const shareCount  = pointRows.filter(r => r.action === 'share').length;

  const { data: pointSumRows } = await supabaseServer
    .from('user_points')
    .select('points')
    .eq('user_id', userId);
  const earned = (pointSumRows ?? []).reduce((s, r) => s + (r.points || 0), 0);

  const { data: allAchievements } = await supabaseServer
    .from('achievements')
    .select('id, trigger_type, trigger_value, points_reward, name, icon, badge_color')
    .eq('is_active', true);

  const { data: alreadyEarned } = await supabaseServer
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const earnedIds = new Set((alreadyEarned ?? []).map(r => r.achievement_id));
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const ach of allAchievements ?? []) {
    if (earnedIds.has(ach.id)) continue;

    let unlocked = false;
    if (ach.trigger_type === 'event_count'            && eventCount  >= ach.trigger_value) unlocked = true;
    if (ach.trigger_type === 'review_count'           && reviewCount >= ach.trigger_value) unlocked = true;
    if (ach.trigger_type === 'attraction_visit_count' && visitCount  >= ach.trigger_value) unlocked = true;
    if (ach.trigger_type === 'share_count'            && shareCount  >= ach.trigger_value) unlocked = true;
    if (ach.trigger_type === 'total_points'           && earned      >= ach.trigger_value) unlocked = true;

    if (unlocked) {
      const { error: achErr } = await supabaseServer.from('user_achievements').insert({ user_id: userId, achievement_id: ach.id });
      if (achErr) continue; // lost the race to a concurrent call — don't double-award
      if (ach.points_reward > 0) {
        // The badge row is already committed, so losing this one hands out a
        // badge whose bonus never lands and quietly leaves the points total
        // wrong. It cannot be retried here without risking a double award, so
        // record it loudly enough to be found.
        const { error: ptsErr } = await supabaseServer.from('user_points').insert({
          user_id: userId, points: ach.points_reward,
          action: 'achievement_bonus', reference_id: ach.id, reference_name: ach.name,
        });
        if (ptsErr) {
          console.error(
            `[achievements] awarded "${ach.name}" to ${userId} but its ${ach.points_reward} bonus points failed:`,
            ptsErr.message,
          );
        }
      }
      newlyUnlocked.push({ id: ach.id, name: ach.name, icon: ach.icon, badge_color: ach.badge_color, points_reward: ach.points_reward });
    }
  }

  return newlyUnlocked;
}
