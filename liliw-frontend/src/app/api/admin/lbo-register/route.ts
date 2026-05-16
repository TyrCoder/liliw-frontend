import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendApprovalEmail } from '@/lib/email';
import { requireAdminAuth } from '@/lib/auth';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

// POST — create LBO user account after approval { applicationId, username, email, password }
export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { applicationId, username, email, password } = await request.json();
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 });
  }

  // Register the user via Strapi auth (they log in through the site)
  const regRes = await fetch(`${STRAPI}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to create account', detail: err }, { status: regRes.status });
  }

  const { user } = await regRes.json();

  // Mark application as approved in Supabase
  if (applicationId) {
    await supabaseServer
      .from('lbo_applications')
      .update({ status: 'approved' })
      .eq('id', applicationId);
  }

  // Fetch business name for the email
  const { data: appData } = await supabaseServer
    .from('lbo_applications')
    .select('business_name, owner_name')
    .eq('id', applicationId)
    .single();

  sendApprovalEmail({
    owner_name:    appData?.owner_name || username,
    email,
    business_name: appData?.business_name || '',
    username,
    password,
  }).catch(err => console.error('[Email] approval:', err));

  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, username: user.username } });
}
