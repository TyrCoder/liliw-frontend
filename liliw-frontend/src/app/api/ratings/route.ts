import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';

export async function POST(request: NextRequest) {
  const authUser = await verifyToken(request);
  if (!authUser) {
    return NextResponse.json({ error: 'You must be logged in to submit a review.' }, { status: 401 });
  }

  try {
    const { itemId, itemName, author, rating, comment } = await request.json();

    if (!itemId || !author || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('reviews')
      .insert({ item_id: itemId, item_name: itemName || '', author, rating, comment });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award points for writing a review
    awardPoints(authUser.userId, 'review', itemId, itemName || 'Attraction').catch(() => {});

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
