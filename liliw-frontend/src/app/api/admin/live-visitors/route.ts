import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabaseServer
    .from('active_sessions')
    .select('session_id, page, device, last_seen')
    .gte('last_seen', cutoff)
    .order('last_seen', { ascending: false });

  if (error) {
    console.error('[admin/live-visitors GET]', error.code, error.message);
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({ data: data || [] });
}
