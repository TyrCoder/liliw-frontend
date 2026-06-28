import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

const EVENT_LABELS: Record<string, string> = {
  'entry.create':    'created',
  'entry.update':    'updated',
  'entry.delete':    'deleted',
  'entry.submit':    'submitted for review',
  'entry.publish':   'approved',
  'entry.unpublish': 'rejected',
};

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  officer: 'CHATO Officer',
  editor:  'CHATO Editor',
};

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('audit_logs')
    .select('id, event, model, entry_id, entry_title, performed_by, changes, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ success: true, data: [] });

  const activities = (data ?? []).map(row => ({
    id:          row.id,
    contentType: row.model ?? 'Content',
    entryName:   row.entry_title ?? row.entry_id ?? '—',
    action:      EVENT_LABELS[row.event] ?? row.event,
    at:          row.created_at,
    performer:   row.performed_by ? {
      name:  row.performed_by,
      email: row.performed_by,
      role:  ROLE_LABELS[row.changes?.role ?? ''] ?? row.changes?.role ?? '—',
    } : null,
  }));

  return NextResponse.json({ success: true, data: activities });
}
