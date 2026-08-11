import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { generateRedemptionCode } from '@/lib/rewards';

const ERROR_RESPONSES: Record<string, [number, string]> = {
  reward_unavailable:  [404, 'Reward not found or no longer available'],
  already_claimed:     [409, "You've already claimed this badge."],
  out_of_stock:        [400, 'This reward is out of stock'],
  insufficient_points: [400, 'Not enough points for this reward.'],
};

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ error: 'You must be logged in to redeem rewards.' }, { status: 401 });

  const { rewardId } = await request.json();
  if (!rewardId) return NextResponse.json({ error: 'rewardId required' }, { status: 400 });

  // The whole check-and-redeem sequence (claim-type rule, stock, points balance,
  // and both inserts) runs atomically in a single DB transaction — see
  // supabase/phase7-atomic-redeem.sql — to close the TOCTOU races the old
  // check-then-insert version of this route had.
  const MAX_CODE_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabaseServer.rpc('redeem_reward', {
      p_user_id: auth.userId,
      p_reward_id: rewardId,
      p_code: generateRedemptionCode(),
    });

    if (!error) return NextResponse.json({ data }, { status: 201 });

    // Extremely rare redemption_code collision — retry with a freshly generated code.
    if (error.code === '23505' && error.message.includes('redemption_code') && attempt < MAX_CODE_ATTEMPTS) {
      continue;
    }

    // reward_unavailable means the row was not found or is inactive. Probing
    // the function directly showed it resolves every active reward correctly,
    // so when a visitor hits this the id that arrived is the thing worth
    // knowing — logged with it rather than left to be guessed at from a
    // sentence on screen.
    if (error.message === 'reward_unavailable') {
      const { data: row } = await supabaseServer
        .from('rewards').select('id, is_active').eq('id', rewardId).maybeSingle();
      console.error('[rewards/redeem] reward_unavailable', {
        rewardId,
        rowExists: !!row,
        isActive: row?.is_active ?? null,
        userId: auth.userId,
      });
    }

    const [status, message] = ERROR_RESPONSES[error.message] ?? [500, 'Failed to create redemption'];
    return NextResponse.json({ error: message, code: error.message }, { status });
  }

  return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 });
}
