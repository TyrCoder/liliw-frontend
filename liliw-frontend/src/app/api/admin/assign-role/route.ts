import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

// GET /api/admin/assign-role — list all UP users and roles
export async function GET() {
  const [usersRes, rolesRes] = await Promise.all([
    fetch(`${STRAPI}/api/users?populate=role`, { headers }),
    fetch(`${STRAPI}/api/users-permissions/roles`, { headers }),
  ]);

  const users = usersRes.ok ? await usersRes.json() : [];
  const roles = rolesRes.ok ? await rolesRes.json() : {};

  return NextResponse.json({
    users: users.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role?.name,
      roleId: u.role?.id,
    })),
    roles: (roles.roles ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
    })),
  });
}

// POST /api/admin/assign-role — { userId, roleId }
export async function POST(request: NextRequest) {
  const { userId, roleId } = await request.json();
  if (!userId || !roleId) {
    return NextResponse.json({ error: 'userId and roleId are required' }, { status: 400 });
  }

  const res = await fetch(`${STRAPI}/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ role: roleId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to update role', detail: err }, { status: res.status });
  }

  const updated = await res.json();
  return NextResponse.json({
    success: true,
    user: { id: updated.id, email: updated.email, username: updated.username },
  });
}
