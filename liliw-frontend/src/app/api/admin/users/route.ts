import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profiles } = await supabaseServer
      .from('profiles')
      .select('id, email, username, role, created_at')
      .order('created_at', { ascending: false });

    // Avatars live on tourist_profiles, keyed by email. Fetched together so
    // the admin list can show who has set a picture and offer to clear it.
    const { data: tourists } = await supabaseServer
      .from('tourist_profiles')
      .select('email, avatar, avatar_updated_at');

    const avatars = new Map(
      (tourists ?? []).map(t => [String(t.email).toLowerCase(), t]),
    );

    const data = (profiles ?? []).map(p => {
      const t = avatars.get(String(p.email).toLowerCase());
      return {
        id: p.id,
        username: p.username || p.email,
        email: p.email,
        confirmed: true,
        blocked: false,
        createdAt: p.created_at,
        role: { name: p.role === 'chatoofficer' ? 'CHATO Officer' : p.role === 'chatoeditor' ? 'CHATO Editor' : p.role === 'admin' ? 'Admin' : 'Authenticated' },
        source: 'supabase',
        avatar: t?.avatar ?? null,
        avatarUpdatedAt: t?.avatar_updated_at ?? null,
        // Only an uploaded picture can be objectionable; the twelve built-in
        // ones need no review, so the list can single out the ones that do.
        avatarIsCustom: typeof t?.avatar === 'string' && t.avatar.startsWith('http'),
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

/**
 * Clears a visitor's profile picture and deletes the uploaded file.
 *
 * Custom avatars are screened in the browser, which is advisory — the check
 * runs on the client and can be bypassed by posting to the upload endpoint
 * directly. This is the backstop that screening design assumes: a moderator
 * can always take a picture down.
 */
export async function DELETE(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await req.json().catch(() => ({ email: null }));
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  const key = String(email).toLowerCase();

  // The uploaded file is foldered by user id, so find that before clearing.
  const { data: profile } = await supabaseServer
    .from('profiles').select('id').eq('email', key).maybeSingle();

  if (profile?.id) {
    const { data: files } = await supabaseServer.storage.from('avatars').list(profile.id);
    if (files?.length) {
      await supabaseServer.storage
        .from('avatars')
        .remove(files.map(f => `${profile.id}/${f.name}`));
    }
  }

  const { error } = await supabaseServer
    .from('tourist_profiles')
    .update({ avatar: null, avatar_updated_at: new Date().toISOString() })
    .eq('email', key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
