import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use a server-only client so RLS doesn't block anon inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemName, author, rating, comment } = body;

    if (!itemId || !author || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        item_id: itemId,
        item_name: itemName || '',
        author,
        rating,
        comment,
      });

    if (error) {
      console.error('[ratings POST] Supabase error:', error.code, error.message);
      // Table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Reviews table not set up yet. Please create it in Supabase.' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[ratings POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
