import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('community_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[admin/submissions GET]', error.code, error.message);
    return NextResponse.json({ success: false, data: [] });
  }

  const rows = data || [];

  // The replies come back in one query rather than one per message — the inbox
  // renders whole threads, and 200 round trips to draw a list is not that.
  let replies: Record<string, { id: string; body: string; sentBy: string; sentAt: string; delivered: boolean; error: string | null }[]> = {};
  if (rows.length) {
    const { data: replyRows } = await supabaseServer
      .from('submission_replies')
      .select('*')
      .in('submission_id', rows.map(r => r.id))
      .order('sent_at', { ascending: true });

    replies = (replyRows || []).reduce((acc, r) => {
      (acc[r.submission_id] ||= []).push({
        id: r.id, body: r.body, sentBy: r.sent_by, sentAt: r.sent_at,
        delivered: r.delivered, error: r.delivery_error,
      });
      return acc;
    }, {} as typeof replies);
  }

  // Normalize to shape the admin dashboard expects
  const normalized = rows.map(r => ({
    id: r.id,
    attributes: {
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      message: r.message,
      type: r.type || 'feedback',
      status: r.status || 'new',
      createdAt: r.created_at,
      handledBy: r.handled_by || null,
      handledAt: r.handled_at || null,
      replies: replies[r.id] || [],
    },
  }));

  return NextResponse.json({ success: true, data: normalized });
}
