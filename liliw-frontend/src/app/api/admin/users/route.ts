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

/** The roles an admin may hand out, matching /api/admin/assign-role. */
const ASSIGNABLE = ['authenticated', 'chatoeditor', 'chatoofficer', 'admin'] as const;

/**
 * Creates a staff account outright.
 *
 * Adding an editor previously meant asking the person to register on the public
 * site, waiting for the emailed code to arrive, and only then promoting them —
 * three steps across two people, and impossible for anyone whose address cannot
 * receive the code. Same shape as the LBO approval route, which has created
 * accounts this way all along.
 *
 * The password is returned once so the admin can hand it over; it is never
 * stored in readable form and cannot be looked up afterwards.
 */
export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, email, password, role } = await req.json().catch(() => ({}));

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Username, email and password are required.' }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  // The column is plain TEXT with no constraint, so a typo here would create an
  // account that signs in normally and is then bounced off /admin with nothing
  // explaining why. Checked rather than trusted.
  if (!ASSIGNABLE.includes(role)) {
    return NextResponse.json(
      { error: `Role must be one of: ${ASSIGNABLE.join(', ')}` },
      { status: 400 },
    );
  }

  const address = String(email).trim().toLowerCase();

  const { data: created, error } = await supabaseServer.auth.admin.createUser({
    email: address,
    password,
    // No confirmation mail: the admin is vouching for this person in person,
    // and half the reason for this route is addresses that cannot receive one.
    email_confirm: true,
    user_metadata: { username, role },
  });

  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? '');
    return NextResponse.json(
      { error: taken ? 'An account with that email already exists.' : (error?.message || 'Could not create the account.') },
      { status: taken ? 409 : 400 },
    );
  }

  // The signup trigger writes a profile row with the default role, so this has
  // to run after it to set the real one. Without it the account exists with no
  // staff access and the admin is left wondering why.
  const { error: profErr } = await supabaseServer
    .from('profiles')
    .upsert({ id: created.user.id, email: address, username, role }, { onConflict: 'id' });

  if (profErr) {
    return NextResponse.json(
      { error: `Account created, but its role could not be set: ${profErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    user: { id: created.user.id, username, email: address, role },
  }, { status: 201 });
}

/**
 * Deactivates or restores an account.
 *
 * Deliberately not a delete. A visitor's rows are scattered across points,
 * check-ins, reviews, favorites, trips, achievements and redemptions; removing
 * the account would orphan some of them and silently pull that person's
 * published reviews off the attraction pages, changing what the public sees and
 * the ratings those pages average. Deactivation keeps every record intact and
 * is reversible, which is what a tourism office actually needs — the usual case
 * is a misbehaving account or a test account, not a right-to-erasure request.
 *
 * Enforced by Supabase itself rather than by a flag this codebase checks, so
 * there is no path — our login route, a direct client call, a stale token
 * refresh — that lets a deactivated account back in.
 */
const BAN_FOREVER = '876000h'; // 100 years; GoTrue has no permanent value

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, active } = await req.json().catch(() => ({}));
  if (!email || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'email and active are required' }, { status: 400 });
  }

  const key = String(email).trim().toLowerCase();

  const { data: profile } = await supabaseServer
    .from('profiles').select('id, role').eq('email', key).maybeSingle();

  if (!profile?.id) return NextResponse.json({ error: 'No account with that email.' }, { status: 404 });

  // Deactivating the last admin would leave nobody able to reverse it, and
  // Role Management is the only interface for roles — recovery would mean SQL.
  if (!active && profile.role === 'admin') {
    const { count } = await supabaseServer
      .from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'This is the only admin account. Promote another admin before deactivating this one.' },
        { status: 409 },
      );
    }
  }

  const { error } = await supabaseServer.auth.admin.updateUserById(profile.id, {
    ban_duration: active ? 'none' : BAN_FOREVER,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, email: key, active });
}

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
