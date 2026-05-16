import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET — list all LBO applications
export async function GET() {
  const { data, error } = await supabaseServer
    .from('lbo_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

// PATCH — update application status { id, status, notes }
export async function PATCH(request: NextRequest) {
  const { id, status, notes } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const { error } = await supabaseServer
    .from('lbo_applications')
    .update({ status, notes: notes || null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update', detail: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
