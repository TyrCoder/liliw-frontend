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

    const data = (profiles ?? []).map(p => ({
      id: p.id,
      username: p.username || p.email,
      email: p.email,
      confirmed: true,
      blocked: false,
      createdAt: p.created_at,
      role: { name: p.role === 'chatoofficer' ? 'CHATO Officer' : p.role === 'chatoeditor' ? 'CHATO Editor' : p.role === 'admin' ? 'Admin' : 'Authenticated' },
      source: 'supabase',
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
