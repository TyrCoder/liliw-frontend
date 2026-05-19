import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export type NotifItem = {
  id: string;
  type: 'submission' | 'participation' | 'lbo_application' | 'attraction_request';
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [submissions, participation, lboApps, attractionReqs] = await Promise.allSettled([
    supabaseServer
      .from('community_submissions')
      .select('id, name, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseServer
      .from('participation_requests')
      .select('id, full_name, name, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseServer
      .from('lbo_applications')
      .select('id, owner_name, business_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseServer
      .from('lbo_attraction_requests')
      .select('id, lbo_name, attraction_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const items: NotifItem[] = [];

  if (submissions.status === 'fulfilled' && submissions.value.data) {
    for (const r of submissions.value.data) {
      items.push({
        id: `sub-${r.id}`,
        type: 'submission',
        title: r.name || 'New Submission',
        subtitle: r.type || 'feedback',
        status: r.status || 'new',
        createdAt: r.created_at,
      });
    }
  }
  if (participation.status === 'fulfilled' && participation.value.data) {
    for (const r of participation.value.data) {
      items.push({
        id: `part-${r.id}`,
        type: 'participation',
        title: (r as any).full_name || (r as any).name || 'Participation Request',
        subtitle: (r as any).event_name || (r as any).type || '',
        status: r.status || 'pending',
        createdAt: r.created_at,
      });
    }
  }
  if (lboApps.status === 'fulfilled' && lboApps.value.data) {
    for (const r of lboApps.value.data) {
      items.push({
        id: `lbo-${r.id}`,
        type: 'lbo_application',
        title: (r as any).business_name || (r as any).owner_name || 'LBO Application',
        subtitle: (r as any).owner_name || '',
        status: r.status || 'pending',
        createdAt: r.created_at,
      });
    }
  }
  if (attractionReqs.status === 'fulfilled' && attractionReqs.value.data) {
    for (const r of attractionReqs.value.data) {
      items.push({
        id: `attr-${r.id}`,
        type: 'attraction_request',
        title: (r as any).attraction_name || 'Attraction Request',
        subtitle: (r as any).lbo_name || '',
        status: r.status || 'pending',
        createdAt: r.created_at,
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ success: true, data: items.slice(0, 30) });
}
