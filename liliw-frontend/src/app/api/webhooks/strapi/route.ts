import { NextRequest, NextResponse } from 'next/server';
import { syncAlgolia } from '@/lib/syncAlgolia';
import { supabaseServer } from '@/lib/supabase-server';

function titleFromEntry(entry: any): string {
  return (
    entry?.name ||
    entry?.title ||
    entry?.full_name ||
    entry?.question ||
    entry?.slug ||
    String(entry?.documentId || entry?.id || '?')
  );
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignore empty test pings
  }

  const { event, model, uid, entry } = body;

  // Save audit log — use 'system' as model fallback for test pings
  if (event) {
    const { error } = await supabaseServer.from('audit_logs').insert({
      event,
      model: model || 'system',
      uid: uid || null,
      entry_id: String(entry?.documentId || entry?.id || ''),
      entry_title: titleFromEntry(entry),
      changes: entry || null,
    });
    if (error) console.error('[webhook] audit log insert failed:', error.code, error.message);
  }

  // Sync Algolia index — respond immediately so Strapi doesn't time out
  const syncPromise = syncAlgolia().catch(err => {
    console.error('[webhook] Algolia sync failed:', err);
  });

  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
  const result = await Promise.race([syncPromise, timeout]);

  if (result !== null && result !== undefined) {
    return NextResponse.json({ synced: result });
  }
  return NextResponse.json({ status: 'accepted' }, { status: 202 });
}
