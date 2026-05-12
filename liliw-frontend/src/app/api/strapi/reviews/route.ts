import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const itemId = new URL(request.url).searchParams.get('itemId');

  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemId) query = query.eq('item_id', itemId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: [] });

  // Shape matches what Ratings component expects: { data: [{ id, attributes: { author, rating, comment, createdAt } }] }
  return NextResponse.json({
    data: (data || []).map(r => ({
      id: r.id,
      attributes: {
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        verified: false,
      },
    })),
  });
}
