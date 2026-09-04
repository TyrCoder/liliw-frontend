import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';
import { invalidateContentCache } from '@/lib/content';

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

    /**
     * Only somebody who has actually been there may review a place.
     *
     * Read from user_points rather than attraction_visit_checkins, for the
     * reason /api/user/visited-attractions gives: a check-in row exists from
     * the moment the page loads, so it would let anyone review anywhere just by
     * opening it. A points row means the visit was credited — the dwell
     * requirement was met, and where proximity is enforced, on site.
     */
    const { data: visit } = await supabaseServer
      .from('user_points')
      .select('created_at')
      .eq('user_id', authUser.userId)
      .eq('action', 'attraction_visit')
      .eq('reference_id', String(itemId))
      .maybeSingle();

    if (!visit) {
      return NextResponse.json(
        {
          error: 'You can review a place once you have visited it. Scan the QR code at the entrance, or open this page while you are there.',
          needsVisit: true,
        },
        { status: 403 },
      );
    }

    const { error } = await supabaseServer
      .from('reviews')
      .insert({ item_id: itemId, item_name: itemName || '', author, rating, comment });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The attractions listing derives its star rating from these reviews, so
    // drop the cached copy — otherwise a new review takes up to the 5-minute
    // TTL to show up there.
    invalidateContentCache();

    // Award points for writing a review
    const unlockedAchievements = await awardPoints(authUser.userId, 'review', itemId, itemName || 'Attraction').catch(() => []);

    return NextResponse.json({ success: true, unlockedAchievements }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
