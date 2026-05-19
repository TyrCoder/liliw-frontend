import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET — get active form for an event (public)
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const { data, error } = await supabaseServer
    .from('event_forms')
    .select('id, event_slug, event_title, fields')
    .eq('event_slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return NextResponse.json({ form: null });
  return NextResponse.json({ form: data });
}

// POST — submit a response (public)
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { form_id, respondent_name, respondent_email, answers } = await req.json();

  if (!form_id || !answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'form_id and answers are required' }, { status: 400 });
  }

  // Verify form exists and is active
  const { data: form, error: formErr } = await supabaseServer
    .from('event_forms')
    .select('id, fields')
    .eq('id', form_id)
    .eq('event_slug', params.slug)
    .eq('is_active', true)
    .single();

  if (formErr || !form) return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });

  // Validate required fields
  const fields: any[] = form.fields || [];
  for (const field of fields) {
    if (field.required && !answers[field.id]?.toString().trim()) {
      return NextResponse.json({ error: `"${field.label}" is required` }, { status: 400 });
    }
  }

  const { error } = await supabaseServer
    .from('event_form_responses')
    .insert({
      form_id,
      event_slug: params.slug,
      respondent_name: respondent_name?.trim() || null,
      respondent_email: respondent_email?.trim() || null,
      answers,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
