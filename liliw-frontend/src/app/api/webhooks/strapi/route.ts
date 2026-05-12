import { NextRequest, NextResponse } from 'next/server';
import { syncAlgolia } from '@/lib/syncAlgolia';

export async function POST(req: NextRequest) {
  const secret = process.env.STRAPI_WEBHOOK_SECRET;

  if (secret) {
    const provided = req.headers.get('x-webhook-secret') ?? '';
    if (provided !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
  }

  // Fire-and-forget: respond immediately so Strapi doesn't time out, sync in background
  const syncPromise = syncAlgolia().catch(err => {
    console.error('[webhook] Algolia sync failed:', err);
  });

  // Wait up to 8 s; if still running, return 202 Accepted so Strapi doesn't retry
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
  const result = await Promise.race([syncPromise, timeout]);

  if (result !== null && result !== undefined) {
    return NextResponse.json({ synced: result });
  }
  return NextResponse.json({ status: 'accepted' }, { status: 202 });
}
