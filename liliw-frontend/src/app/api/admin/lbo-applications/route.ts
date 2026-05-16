import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendRejectionEmail } from '@/lib/email';
import { requireAdminAuth } from '@/lib/auth';

// GET — list all LBO applications
export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('lbo_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

// PATCH — update application status { id, status, notes }
export async function PATCH(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, notes } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const { error } = await supabaseServer
    .from('lbo_applications')
    .update({ status, notes: notes || null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update', detail: error.message }, { status: 500 });

  // Send rejection email if status is rejected
  if (status === 'rejected') {
    const { data: app } = await supabaseServer
      .from('lbo_applications')
      .select('owner_name, email, business_name')
      .eq('id', id)
      .single();
    if (app) {
      sendRejectionEmail({ owner_name: app.owner_name, email: app.email, business_name: app.business_name, notes: notes || '' })
        .catch(err => console.error('[Email] rejection:', err));
    }
  }

  return NextResponse.json({ success: true });
}
