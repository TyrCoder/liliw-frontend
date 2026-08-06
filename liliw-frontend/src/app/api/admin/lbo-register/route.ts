import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendApprovalEmail } from '@/lib/email';
import { requireAdminAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { applicationId, username, email, password } = await request.json();
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 });
  }

  // Create Supabase auth user for the LBO
  const { data: created, error } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role: 'authenticated' },
  });

  if (error || !created.user) {
    return NextResponse.json({ error: 'Failed to create account', detail: error?.message }, { status: 400 });
  }

  // Explicit profile row. The auth user already exists by this point, so a
  // failure here leaves an account that can sign in with no username or role.
  const { error: profErr } = await supabaseServer.from('profiles').upsert({
    id: created.user.id, email, username, role: 'authenticated',
  }, { onConflict: 'id' });
  if (profErr) {
    return NextResponse.json(
      { error: 'Account created but its profile row failed', detail: profErr.message },
      { status: 500 },
    );
  }

  if (applicationId) {
    // If this is skipped the owner has a working login while their application
    // still reads as pending, so the approval looks like it never happened.
    const { error: appErr } = await supabaseServer
      .from('lbo_applications').update({ status: 'approved' }).eq('id', applicationId);
    if (appErr) {
      return NextResponse.json(
        { error: 'Account created, but the application could not be marked approved', detail: appErr.message },
        { status: 500 },
      );
    }
  }

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

  return NextResponse.json({ success: true, user: { id: created.user.id, email, username } });
}
