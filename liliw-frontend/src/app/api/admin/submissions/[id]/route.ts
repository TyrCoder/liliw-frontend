import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity } from '@/lib/cms-auth';

type Params = { params: Promise<{ id: string }> };

const STATUSES = ['new', 'read', 'replied', 'closed'];

/**
 * Moves a message through the inbox — opened, dealt with, put away.
 *
 * Marking who handled it matters as much as the status: two people working the
 * same inbox otherwise have no way to see that one of them already picked a
 * message up.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can manage messages' }, { status: 403 });
  }

  const { status } = await req.json();
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }

  const patch: Record<string, string> = { status };
  // Opening a message is not the same as taking responsibility for it, so
  // only a deliberate action claims it.
  if (status !== 'read') {
    patch.handled_by = email;
    patch.handled_at = new Date().toISOString();
  }

  const { error } = await supabaseServer
    .from('community_submissions')
    .update(patch)
    .eq('id', id);

  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });
  return NextResponse.json({ success: true });
}
