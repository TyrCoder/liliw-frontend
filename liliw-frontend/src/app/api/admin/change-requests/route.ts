import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';
import { sendChangeRequestUpdate } from '@/lib/email';

// GET — list all LBO change requests
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('lbo_change_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

// PATCH — update status + editor_notes { id, status, editor_notes }
export async function PATCH(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, editor_notes } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  // Try with editor_notes first; fall back to status-only if column doesn't exist yet
  const { error } = await supabaseServer
    .from('lbo_change_requests')
    .update({ status, editor_notes: editor_notes || null })
    .eq('id', id);

  if (error) {
    // Column may not exist — retry with status only
    const { error: error2 } = await supabaseServer
      .from('lbo_change_requests')
      .update({ status })
      .eq('id', id);
    if (error2) return NextResponse.json({ error: 'Failed to update', detail: error2.message }, { status: 500 });
  }

  // Fetch full record to send LBO notification
  if (status === 'done' || status === 'rejected') {
    const { data: cr } = await supabaseServer
      .from('lbo_change_requests')
      .select('lbo_name, lbo_email, attraction_name, field_to_change, requested_value')
      .eq('id', id)
      .single();
    if (cr) {
      sendChangeRequestUpdate({
        lbo_name:        cr.lbo_name,
        lbo_email:       cr.lbo_email,
        attraction_name: cr.attraction_name,
        field_to_change: cr.field_to_change,
        requested_value: cr.requested_value,
        status,
        editor_notes:    editor_notes || '',
      }).catch(err => console.error('[Email] change request update:', err));
    }
  }

  return NextResponse.json({ success: true });
}
