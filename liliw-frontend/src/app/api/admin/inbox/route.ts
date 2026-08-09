import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { loadInbox } from '@/lib/inbox';

/**
 * Everything the public has sent the office, as one queue.
 *
 * Replaces three separate endpoints behind three separate tabs; the sources
 * are kept as a label on each message so the inbox can still filter to one.
 */
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json({ success: true, data: await loadInbox() });
  } catch (err) {
    console.error('[admin/inbox GET]', err);
    return NextResponse.json(
      { success: false, data: [], error: err instanceof Error ? err.message : 'Could not load the inbox' },
      { status: 500 },
    );
  }
}
