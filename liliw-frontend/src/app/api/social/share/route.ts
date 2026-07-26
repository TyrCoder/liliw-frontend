import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';

// Awards points when a visitor shares an attraction to social media.
//
// Facebook's sharer gives no completion callback, so this is necessarily
// optimistic: it fires when the share window is opened, not when a post is
// actually published. Farming is bounded by the user_points_dedup unique
// index (user_id, action, reference_id) — the same attraction only ever
// awards once per user, no matter how many times Share is clicked.
export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true, unlockedAchievements: [] }); // guests just don't earn points

  const { attractionId, attractionName } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  const unlockedAchievements = await awardPoints(
    auth.userId, 'share', String(attractionId), attractionName || 'Attraction',
  ).catch(() => []);

  return NextResponse.json({ success: true, unlockedAchievements });
}
