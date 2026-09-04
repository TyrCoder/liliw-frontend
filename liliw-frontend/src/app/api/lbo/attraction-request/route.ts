import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendAttractionRequestNotification } from '@/lib/email';
import { lboEmail } from '@/lib/lbo-auth';
import { contentProblem } from '@/lib/cms-validate';


async function getVerifiedLbo(req: NextRequest) {
  const email = await lboEmail(req);
  if (!email) return null;

  const { data: app } = await supabaseServer
    .from('lbo_applications')
    .select('id, business_name, owner_name, email')
    .eq('email', email)
    .eq('status', 'approved')
    .single();

  if (!app) return null;
  return { user: { email }, app };
}

export async function GET(request: NextRequest) {
  const lbo = await getVerifiedLbo(request);
  if (!lbo) return NextResponse.json({ error: 'Unauthorized or no approved LBO application' }, { status: 403 });

  const { data, error } = await supabaseServer
    .from('lbo_attraction_requests')
    .select('*')
    .eq('lbo_email', lbo.user.email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const lbo = await getVerifiedLbo(request);
  if (!lbo) return NextResponse.json({ error: 'Unauthorized or no approved LBO application' }, { status: 403 });

  const body = await request.json();
  const { attraction_name, description, category, latitude, longitude } = body;

  if (!attraction_name?.trim()) {
    return NextResponse.json({ error: 'attraction_name is required' }, { status: 400 });
  }

  // Same rules the CMS applies, so a request arriving this way cannot carry a
  // name or a coordinate the CMS would have refused.
  const problem = contentProblem(attraction_name, body);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const { error } = await supabaseServer
    .from('lbo_attraction_requests')
    .insert({
      lbo_email:       lbo.user.email,
      lbo_name:        lbo.app.owner_name,
      business_name:   lbo.app.business_name,
      attraction_name: attraction_name.trim(),
      description:     description || null,
      category:        category || null,
      latitude:        latitude ?? null,
      longitude:       longitude ?? null,
      status:          'pending',
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  sendAttractionRequestNotification({
    lbo_name:        lbo.app.owner_name,
    lbo_email:       lbo.user.email,
    business_name:   lbo.app.business_name,
    attraction_name: attraction_name.trim(),
    category:        category || undefined,
    description:     description || undefined,
  }).catch(err => console.error('[Email] attraction request:', err));

  return NextResponse.json({ success: true });
}
