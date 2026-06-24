import { NextResponse } from 'next/server';
import { fetchApproved } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const data = await fetchApproved(
      'cms_itineraries',
      q => q.order('created_at', { ascending: false }),
    );
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
