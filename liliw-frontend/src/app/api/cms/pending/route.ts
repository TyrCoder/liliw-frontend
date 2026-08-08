import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsRole, CMS_TABLES, labelFieldFor } from '@/lib/cms-auth';

export async function GET(req: NextRequest) {
  const role = await getCmsRole(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const failures: string[] = [];

  const results = await Promise.all(
    Object.entries(CMS_TABLES).map(async ([type, table]) => {
      const nameField = labelFieldFor(type);
      // The column name is decided at runtime, so the client cannot infer a
      // row shape from the select string — described here instead.
      const { data, error } = await supabaseServer
        .from(table)
        .select(`id, ${nameField}, status, created_by, created_at, reject_remarks`)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }) as unknown as {
          data: Record<string, unknown>[] | null;
          error: { message: string } | null;
        };

      // `data || []` on its own turned a broken query into "nothing pending",
      // which is how FAQs went missing from this screen without a trace.
      if (error) {
        failures.push(`${type}: ${error.message}`);
        return [];
      }

      return (data || []).map(entry => ({
        ...entry,
        created_at: String(entry.created_at ?? ''),
        title: entry[nameField] ?? entry.id,
        content_type: type,
      }));
    })
  );

  const pending = results.flat().sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Reported rather than swallowed: "nothing pending" and "one of these tables
  // could not be read" must not look the same on the approvals screen.
  return NextResponse.json({
    data: pending,
    total: pending.length,
    ...(failures.length ? { warning: `Some content types could not be read — ${failures.join('; ')}` } : {}),
  });
}
