import { NextResponse } from 'next/server';
import { fetchApproved } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const data = await fetchApproved('cms_faqs', q => q.order('sort_order', { ascending: true }));
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
