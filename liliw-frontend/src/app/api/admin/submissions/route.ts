import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdminAuth(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('community_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[admin/submissions GET]', error.code, error.message);
    return NextResponse.json({ success: false, data: [] });
  }

  // Normalize to shape the admin dashboard expects
  const normalized = (data || []).map(r => ({
    id: r.id,
    attributes: {
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      message: r.message,
      type: r.type || 'feedback',
      status: r.status || 'new',
      createdAt: r.created_at,
    },
  }));

  return NextResponse.json({ success: true, data: normalized });
}
