import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdminAuth(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    console.error('[admin/audit-logs GET]', error.code, error.message);
    return NextResponse.json({ success: false, data: [] });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
