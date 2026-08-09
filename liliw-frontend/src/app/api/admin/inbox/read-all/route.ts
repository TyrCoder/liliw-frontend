import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity } from '@/lib/cms-auth';
import { INBOX_SOURCES, InboxSource } from '@/lib/inbox';

/**
 * Marks a batch of messages read in one write.
 *
 * The ids come from the client rather than being derived here as "everything
 * unread", so the button clears exactly the messages the person was looking
 * at — a message that arrives mid-click stays unread and still gets noticed.
 *
 * Reading is not the same as taking responsibility for a message, so this
 * deliberately does not set handled_by.
 */
export async function POST(req: NextRequest) {
  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can manage messages' }, { status: 403 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Nothing to mark' }, { status: 400 });
  }

  // Each id is `${source}:${refId}` — a ref_id is only unique within a source.
  const rows = ids
    .map((id: string) => {
      const cut = String(id).indexOf(':');
      const source = String(id).slice(0, cut);
      const refId = String(id).slice(cut + 1);
      if (!INBOX_SOURCES.includes(source as InboxSource) || !refId) return null;
      return { source, ref_id: refId, status: 'read', updated_at: new Date().toISOString() };
    })
    .filter(Boolean);

  if (!rows.length) return NextResponse.json({ error: 'No valid messages' }, { status: 400 });

  const { error } = await supabaseServer
    .from('inbox_state')
    .upsert(rows, { onConflict: 'source,ref_id' });

  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  return NextResponse.json({ success: true, marked: rows.length, by: email });
}
