'use client';

import { toast } from 'sonner';

export interface UnlockedAchievement {
  id: string;
  name: string;
  icon: string;
  badge_color: string;
  points_reward: number;
}

/** Call after any action that might award achievements (event sign-up, review, attraction visit). */
export function showAchievementToasts(unlocked?: UnlockedAchievement[] | null) {
  if (!unlocked || unlocked.length === 0) return;
  unlocked.forEach((ach, i) => {
    setTimeout(() => {
      toast.success(`🏆 Achievement Unlocked: ${ach.name}`, {
        description: ach.points_reward > 0 ? `+${ach.points_reward} bonus points earned` : undefined,
        duration: 5000,
      });
    }, i * 700);
  });
}
