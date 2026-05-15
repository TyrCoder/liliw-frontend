import { NextRequest, NextResponse } from 'next/server';
import { syncAlgolia } from '@/lib/syncAlgolia';
import { supabaseServer } from '@/lib/supabase-server';

const WEBHOOK_SECRET = process.env.STRAPI_WEBHOOK_SECRET || '';

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
  // Support both header styles
  const secret =
    req.headers.get('Authorization')?.replace('Bearer ', '') ||
    req.headers.get('x-webhook-secret') ||
    '';

  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, model, uid, entry } = body;

  // Save audit log to Supabase (fire-and-forget, don't block response)
  if (event && model) {
    supabaseServer.from('audit_logs').insert({
      event,
      model,
      uid: uid || null,
      entry_id: String(entry?.documentId || entry?.id || ''),
      entry_title: titleFromEntry(entry),
      changes: entry || null,
    }).then().catch(err => console.error('[webhook] audit log failed:', err));
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
