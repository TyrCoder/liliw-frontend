import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

const ROLES = [
  { id: 1, name: 'Authenticated', type: 'authenticated' },
  { id: 2, name: 'CHATO Editor', type: 'chatoeditor' },
  { id: 3, name: 'CHATO Officer', type: 'chatoofficer' },
  { id: 4, name: 'Admin', type: 'admin' },
];

// GET — list all users and available roles
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profiles } = await supabaseServer
    .from('profiles')
    .select('id, email, username, role, created_at')
    .order('created_at', { ascending: false });

  // Whether an account is deactivated lives in Supabase auth, not in profiles,
  // because the ban is enforced there — so it has to be read from there too.
  // Paged rather than assumed to fit one response: the office already has 40+
  // accounts and every business owner adds another.
  const banned = new Set<string>();
  try {
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        if ((u as { banned_until?: string }).banned_until) banned.add(u.id);
      }
      if (data.users.length < 200) break;
    }
  } catch {
    // A failure here costs the badge, not the page. Roles still load.
  }

  return NextResponse.json({
    users: (profiles ?? []).map(p => ({
      id: p.id, username: p.username || p.email, email: p.email,
      role: p.role, roleId: ROLES.find(r => r.type === p.role)?.id ?? 1,
      active: !banned.has(p.id),
    })),
    roles: ROLES,
  });
}

// POST — { userId, roleId } assign role by roleId
export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, roleId, role: roleType } = await request.json();
  const newRole = roleType ?? ROLES.find(r => r.id === roleId)?.type;
  if (!userId || !newRole) return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });

  const { error } = await supabaseServer.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) return NextResponse.json({ error: 'Failed to update role', detail: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// PATCH — { userId, password } reset a user's password
export async function PATCH(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, password } = await request.json();
  if (!userId || !password || password.length < 6) {
    return NextResponse.json({ error: 'userId and password (min 6 chars) are required' }, { status: 400 });
  }

  const { error } = await supabaseServer.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: 'Failed to reset password', detail: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
