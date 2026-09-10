import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity, CMS_TABLES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';
import { invalidateContentCache } from '@/lib/content';
import { saveSnapshots } from '@/lib/cms-snapshot';

type Params = { params: Promise<{ type: string }> };

// The status an entry must currently be in for each action to apply — the same
// gate the per-item routes (submit/approve/reject) enforce one at a time.
const ELIGIBLE_FROM: Record<string, string[]> = {
  submit:  ['draft', 'rejected'],
  approve: ['pending'],
  reject:  ['pending'],
};

/**
 * Applies one review action to many entries in a single request.
 *
 * Mirrors the submit/approve/reject routes but does the work as one UPDATE over
 * the eligible ids rather than a round-trip per row. Ids whose status does not
 * match the action are skipped, not failed, so a mixed "All"-tab selection is
 * safe: Approve touches only the pending ones.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { type } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, ids, remarks } = await req.json();
  if (!ELIGIBLE_FROM[action]) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No entries selected' }, { status: 400 });
  }

  // Same role gates as the single-item routes.
  if (action === 'submit' && role === 'officer') {
    return NextResponse.json({ error: 'Officers cannot submit content for approval' }, { status: 403 });
  }
  if ((action === 'approve' || action === 'reject') && role === 'editor') {
    return NextResponse.json({ error: 'Editors cannot review content' }, { status: 403 });
  }
  if (action === 'reject' && !remarks?.trim()) {
    return NextResponse.json({ error: 'Rejection remarks are required' }, { status: 400 });
  }

  const { data: rows, error: readErr } = await supabaseServer.from(table).select('*').in('id', ids);
  if (readErr) return NextResponse.json({ error: explainDbError(readErr) }, { status: 500 });

  const eligible = (rows ?? []).filter(r => ELIGIBLE_FROM[action].includes(r.status));
  if (eligible.length === 0) {
    return NextResponse.json({ success: true, count: 0, skipped: ids.length });
  }
  const eligibleIds = eligible.map(r => r.id);

  const now = new Date().toISOString();
  const patch =
    action === 'submit'  ? { status: 'pending',  reject_remarks: null }
    : action === 'approve' ? { status: 'approved', reviewed_by: email, reject_remarks: null, published_at: now }
    : { status: 'rejected', reviewed_by: email, reject_remarks: remarks.trim(), published_at: null };

  const { error } = await supabaseServer.from(table).update(patch).in('id', eligibleIds);
  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  // Snapshot the approved content as the baseline future edits diff against.
  if (action === 'approve') await saveSnapshots(type, eligible);

  const event = action === 'submit' ? 'entry.submit' : action === 'approve' ? 'entry.publish' : 'entry.unpublish';
  for (const r of eligible) {
    logCmsAction({
      table, entryId: r.id, event, performedBy: email, role,
      entryTitle: String(r.name || r.title || r.question || r.id),
    });
  }
  if (action !== 'submit') invalidateContentCache();

  return NextResponse.json({
    success: true,
    count: eligibleIds.length,
    skipped: ids.length - eligibleIds.length,
  });
}
