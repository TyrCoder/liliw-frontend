import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { normaliseAvatar } from '@/lib/avatars';

const USER_TYPES = ['liliw_local', 'laguna', 'provincial', 'international'];

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { username, full_name, user_type, avatar } = await req.json();

  // Every write below used to discard its error and the route returned
  // success regardless, so a rejected write — a duplicate username, a missing
  // column, a policy refusal — showed "Profile updated successfully!" over a
  // profile that had not changed. Nothing here reports success it did not get.
  if (username?.trim()) {
    const { error } = await supabaseServer
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);

    if (error) {
      const taken = error.code === '23505';
      return NextResponse.json(
        { error: taken ? 'That username is already taken.' : `Could not save your username: ${error.message}` },
        { status: taken ? 409 : 500 },
      );
    }
  }

  // user_type drives the passport's nationality line and the visitor-mix
  // reporting, so only the four registration values are accepted — a client
  // must not be able to write free text into the column.
  if (user_type !== undefined && user_type !== '' && !USER_TYPES.includes(user_type)) {
    return NextResponse.json({ error: 'Invalid visitor type' }, { status: 400 });
  }

  // An avatar is either one of the twelve built-in ids or a URL in our own
  // Storage bucket. normaliseAvatar rejects anything else, so the column can
  // never be turned into a hotlink to an arbitrary image on the internet.
  let nextAvatar: string | null | undefined;
  if (avatar !== undefined) {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    nextAvatar = normaliseAvatar(avatar, host);
    if (avatar && nextAvatar === null) {
      return NextResponse.json({ error: 'That profile picture is not allowed' }, { status: 400 });
    }
  }

  if (full_name !== undefined || user_type !== undefined || avatar !== undefined) {
    const patch: Record<string, string | null> = { email: user.email!.toLowerCase() };
    if (full_name !== undefined) patch.full_name = full_name?.trim() || null;
    if (user_type !== undefined) patch.user_type = user_type || null;
    if (avatar !== undefined) {
      patch.avatar = nextAvatar ?? null;
      patch.avatar_updated_at = new Date().toISOString();
    }

    const { error } = await supabaseServer
      .from('tourist_profiles')
      .upsert(patch, { onConflict: 'email' });

    if (error) {
      return NextResponse.json(
        { error: `Could not save your profile: ${error.message}` },
        { status: 500 },
      );
    }
  }

  // Returned so the form can show what is actually stored rather than what it
  // hoped it sent — the difference between the two is the whole bug above.
  const { data: saved } = await supabaseServer
    .from('tourist_profiles')
    .select('user_type, full_name, avatar')
    .eq('email', user.email!.toLowerCase())
    .maybeSingle();

  return NextResponse.json({ success: true, profile: saved ?? null });
}
