import { NextResponse } from 'next/server';
import { fetchApproved } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const data = await fetchApproved(
      'cms_events',
      q => q.eq('is_joinable', true).order('date_start', { ascending: true }),
    );
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
