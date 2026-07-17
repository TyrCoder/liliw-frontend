import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ data: [] });

    const { data } = await supabaseServer
      .from('cms_events')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .limit(1);

    return NextResponse.json({ data: data ?? [] }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
