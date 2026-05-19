import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';

// GET — list all responses for a form (staff only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireStaffAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: form, error: formErr } = await supabaseServer
    .from('event_forms')
    .select('id, event_slug, event_title, fields')
    .eq('id', id)
    .single();

  if (formErr || !form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

  const { data: responses, error } = await supabaseServer
    .from('event_form_responses')
    .select('*')
    .eq('form_id', id)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form, responses: responses ?? [] });
}
