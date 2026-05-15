import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
  const itemId = new URL(request.url).searchParams.get('itemId');

  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemId) query = query.eq('item_id', itemId);

  const { data, error } = await query;

  if (error) {
    console.error('[reviews GET] Supabase error:', error.code, error.message);
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({
    data: (data || []).map((r) => ({
      id: r.id,
      attributes: {
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        verified: r.verified || false,
      },
    })),
  });
}
