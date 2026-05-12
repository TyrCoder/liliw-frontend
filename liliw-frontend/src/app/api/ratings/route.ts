import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { itemId, itemName, author, rating, comment } = await request.json();

    if (!itemId || !author || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reviews')
      .insert({ item_id: itemId, item_name: itemName || '', author, rating, comment });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Ratings error:', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
