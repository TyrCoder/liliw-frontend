import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true }); // guests just don't earn points

  const { attractionId, attractionName } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  awardPoints(auth.userId, 'attraction_visit', String(attractionId), attractionName || 'Attraction').catch(() => {});
  return NextResponse.json({ success: true });
}
