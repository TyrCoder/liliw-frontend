import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';
import { sendAttractionRequestUpdate } from '@/lib/email';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

async function getStaffRole(req: NextRequest): Promise<'admin' | 'officer' | 'editor' | null> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token);
    if (!user) return null;
    const { data: profile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role ?? '';
    if (role === 'admin') return 'admin';
    if (role === 'chatoofficer') return 'officer';
    if (role === 'chatoeditor') return 'editor';
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('lbo_attraction_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const role = await getStaffRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, editor_notes, officer_notes } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });

  // Role-based gating
  const editorStatuses   = ['editor_reviewed', 'rejected'];
  const officerStatuses  = ['approved', 'rejected'];

  if (role === 'editor' && !editorStatuses.includes(status)) {
    return NextResponse.json({ error: 'Editors can only set status to editor_reviewed or rejected' }, { status: 403 });
  }
  if (role === 'officer' && !officerStatuses.includes(status)) {
    return NextResponse.json({ error: 'Officers can only approve or reject' }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { status };
  if (editor_notes  !== undefined) updateData.editor_notes  = editor_notes;
  if (officer_notes !== undefined) updateData.officer_notes = officer_notes;

  const { error } = await supabaseServer
    .from('lbo_attraction_requests')
    .update(updateData)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify LBO on final outcomes
  if (status === 'approved' || status === 'rejected') {
    const { data: req } = await supabaseServer
      .from('lbo_attraction_requests')
      .select('lbo_email, lbo_name, attraction_name')
      .eq('id', id)
      .single();

    if (req) {
      sendAttractionRequestUpdate({
        lbo_name:        req.lbo_name || req.lbo_email,
        lbo_email:       req.lbo_email,
        attraction_name: req.attraction_name,
        status:          status as 'approved' | 'rejected',
        notes:           (officer_notes || editor_notes) ?? undefined,
      }).catch(err => console.error('[Email] attraction request update:', err));
    }
  }

  return NextResponse.json({ success: true });
}
