import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyToken } from '@/lib/verifyToken';
import { supabaseServer } from '@/lib/supabase-server';

export type PublicNotifItem = {
  id: string;
  type: 'event' | 'news' | 'achievement' | 'checkin';
  title: string;
  subtitle: string;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  if (!await requireAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = await verifyToken(request);

  const [eventsRes, newsRes, achievementsRes, checkinsRes] = await Promise.allSettled([
    supabaseServer.from('cms_events').select('id, title, date_start, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    supabaseServer.from('cms_news').select('id, title, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    auth?.userId
      ? supabaseServer.from('user_achievements').select('id, earned_at, achievements(name, description)').eq('user_id', auth.userId).order('earned_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: null, error: null } as any),
    // The points row, not the check-in row: points are only written once the
    // visit actually counted, so this cannot announce points nobody got.
    auth?.userId
      ? supabaseServer.from('user_points')
          .select('id, reference_name, points, created_at')
          .eq('user_id', auth.userId).eq('action', 'attraction_visit')
          .order('created_at', { ascending: false }).limit(8)
      : Promise.resolve({ data: null, error: null } as any),
  ]);

  const items: PublicNotifItem[] = [];

  // Scanning a poster awarded points silently — the stamp appeared in the
  // passport, but nothing told the visitor it had happened unless they went
  // looking. It belongs in the bell alongside the achievement it may unlock.
  if (checkinsRes.status === 'fulfilled' && !checkinsRes.value.error) {
    for (const v of (checkinsRes.value.data ?? []) as any[]) {
      items.push({
        id: `checkin-${v.id}`,
        type: 'checkin',
        title: `Checked in at ${v.reference_name || 'an attraction'}`,
        subtitle: v.points
          ? `+${v.points} points added, and the place is stamped in your passport.`
          : 'Stamped in your passport.',
        createdAt: v.created_at,
      });
    }
  }

  if (achievementsRes.status === 'fulfilled' && !achievementsRes.value.error) {
    for (const ua of (achievementsRes.value.data ?? []) as any[]) {
      const ach = Array.isArray(ua.achievements) ? ua.achievements[0] : ua.achievements;
      if (!ach) continue;
      items.push({
        id: `achievement-${ua.id}`,
        type: 'achievement',
        title: `Achievement Unlocked: ${ach.name}`,
        subtitle: ach.description || 'Keep exploring Liliw!',
        createdAt: ua.earned_at,
      });
    }
  }

  if (eventsRes.status === 'fulfilled' && !eventsRes.value.error) {
    for (const e of eventsRes.value.data ?? []) {
      items.push({
        id: `event-${e.id}`,
        type: 'event',
        title: e.title || 'New Event',
        subtitle: e.date_start ? `Happening ${new Date(e.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Upcoming event in Liliw',
        createdAt: e.created_at || new Date().toISOString(),
      });
    }
  }

  if (newsRes.status === 'fulfilled' && !newsRes.value.error) {
    for (const e of newsRes.value.data ?? []) {
      items.push({
        id: `news-${e.id}`,
        type: 'news',
        title: e.title || 'News Update',
        subtitle: 'Liliw Tourism News',
        createdAt: e.created_at || new Date().toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ success: true, data: items.slice(0, 15) });
}
