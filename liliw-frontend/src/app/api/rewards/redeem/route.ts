import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { generateRedemptionCode } from '@/lib/rewards';

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ error: 'You must be logged in to redeem rewards.' }, { status: 401 });

  const { rewardId } = await request.json();
  if (!rewardId) return NextResponse.json({ error: 'rewardId required' }, { status: 400 });

  const { data: reward, error: rewardError } = await supabaseServer
    .from('rewards')
    .select('id, name, points_cost, stock, is_active, claim_type, image_url')
    .eq('id', rewardId)
    .single();

  if (rewardError || !reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
  if (!reward.is_active) return NextResponse.json({ error: 'This reward is no longer available' }, { status: 400 });

  const isOnline = reward.claim_type === 'online';

  // Online badges are unlimited stock but capped at one claim per person.
  if (isOnline) {
    const { data: existing } = await supabaseServer
      .from('reward_redemptions')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('reward_id', reward.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "You've already claimed this badge." }, { status: 409 });
  } else if (reward.stock !== null && reward.stock <= 0) {
    return NextResponse.json({ error: 'This reward is out of stock' }, { status: 400 });
  }

  const { data: pointRows } = await supabaseServer.from('user_points').select('points').eq('user_id', auth.userId);
  const totalPoints = (pointRows ?? []).reduce((s, r) => s + (r.points || 0), 0);

  if (totalPoints < reward.points_cost) {
    return NextResponse.json({ error: `Not enough points. You need ${reward.points_cost}, you have ${totalPoints}.` }, { status: 400 });
  }

  const redemptionCode = generateRedemptionCode();

  const { data: redemption, error: redemptionError } = await supabaseServer
    .from('reward_redemptions')
    .insert({
      user_id: auth.userId,
      reward_id: reward.id,
      reward_name: reward.name,
      points_spent: reward.points_cost,
      redemption_code: redemptionCode,
      claim_type: reward.claim_type,
      image_url: reward.image_url || null,
      // Online rewards are digital badges — claimed instantly, no in-person pickup step.
      status: isOnline ? 'redeemed' : 'pending',
      redeemed_at: isOnline ? new Date().toISOString() : null,
      redeemed_by: isOnline ? 'online (self-claim)' : null,
    })
    .select()
    .single();

  if (redemptionError) return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 });

  // Deduct points — use the redemption's own id as reference so redeeming the same reward
  // twice doesn't collide with the dedup unique index on user_points(user_id, action, reference_id).
  await supabaseServer.from('user_points').insert({
    user_id: auth.userId, points: -reward.points_cost, action: 'reward_redeem',
    reference_id: redemption.id, reference_name: reward.name,
  });

  // Online badges are unlimited — stock only applies to physical in-person rewards.
  if (!isOnline && reward.stock !== null) {
    await supabaseServer.from('rewards').update({ stock: reward.stock - 1 }).eq('id', reward.id);
  }

  return NextResponse.json({ data: redemption }, { status: 201 });
}
