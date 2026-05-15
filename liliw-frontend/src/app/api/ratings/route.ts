import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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
      console.error('[ratings POST]', error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[ratings POST] unexpected:', err);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
