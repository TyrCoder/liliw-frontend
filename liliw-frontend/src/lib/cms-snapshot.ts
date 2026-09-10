import { supabaseServer } from './supabase-server';

// Snapshots of an entry's content at the moment it was last approved, so the
// Content Approvals "View" panel can show what a pending edit changed. Best
// effort: a snapshot failing must never block an approval.

/** Save one entry's current content as its last-approved snapshot. */
export async function saveSnapshot(contentType: string, contentId: string, data: Record<string, unknown>) {
  await supabaseServer.from('cms_snapshots').upsert(
    { content_type: contentType, content_id: String(contentId), data, snapshot_at: new Date().toISOString() },
    { onConflict: 'content_type,content_id' },
  ).then(null, () => {});
}

/** Save many at once, for a bulk approval. */
export async function saveSnapshots(contentType: string, rows: { id: string }[]) {
  if (rows.length === 0) return;
  const now = new Date().toISOString();
  await supabaseServer.from('cms_snapshots').upsert(
    rows.map(r => ({ content_type: contentType, content_id: String(r.id), data: r, snapshot_at: now })),
    { onConflict: 'content_type,content_id' },
  ).then(null, () => {});
}

/** The last-approved content for an entry, or null if it has never been approved. */
export async function getSnapshot(contentType: string, contentId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseServer
    .from('cms_snapshots').select('data')
    .eq('content_type', contentType).eq('content_id', String(contentId))
    .maybeSingle();
  return (data?.data as Record<string, unknown>) ?? null;
}
