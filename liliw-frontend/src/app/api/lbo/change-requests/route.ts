import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { lboEmail } from '@/lib/lbo-auth';

async function getUser(req: NextRequest): Promise<{ email: string } | null> {
  const email = await lboEmail(req);
  return email ? { email } : null;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('lbo_change_requests')
    .select('*')
    .eq('lbo_email', user.email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: lboApp } = await supabaseServer
    .from('lbo_applications')
    .select('id')
    .eq('email', user.email)
    .eq('status', 'approved')
    .limit(1)
    .single();
  if (!lboApp) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { attraction_name, field_to_change, current_value, requested_value, reason, lbo_name } = await request.json();
  if (!attraction_name || !field_to_change || !requested_value) {
    return NextResponse.json({ error: 'attraction_name, field_to_change and requested_value are required' }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from('lbo_change_requests')
    .insert({
      attraction_name,
      field_to_change,
      current_value:   current_value  || null,
      requested_value,
      reason:          reason         || null,
      lbo_email:       user.email,
      // username only ever existed on the cookie path, so it was already
      // undefined for anyone calling with a token. The email always resolves.
      lbo_name:        lbo_name || user.email,
      status:          'pending',
    });

  if (error) return NextResponse.json({ error: 'Failed to submit', detail: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
