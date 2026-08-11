import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * QR check-ins at one business, for one month, in the shape of the monthly
 * visitor record.
 *
 * The form a business fills in asks for the same two things a profile already
 * knows: where the visitor travelled from, and their gender. So a scan can be
 * counted straight into the right box instead of the owner tallying paper.
 *
 * It does not replace the manual form. Only visitors who are signed in and
 * scan the poster appear here — walk-ins, groups, and anyone who does not use
 * the app never will — so this is the floor of the real number, offered as a
 * starting point rather than an answer.
 */

// user_type maps onto the form's four rows exactly.
const ORIGIN: Record<string, 'local' | 'other_city' | 'other_province' | 'foreign'> = {
  liliw_local:   'local',
  laguna:        'other_city',
  provincial:    'other_province',
  international: 'foreign',
};

export async function GET(request: NextRequest) {
  // Same resolution order as /api/lbo/me: the bearer token is the account
  // making the request, the cookie is the fallback.
  let email: string | null = null;
  const userToken = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (userToken) {
    try {
      const { data: { user } } = await supabaseServer.auth.getUser(userToken);
      email = user?.email ?? null;
    } catch { /* fall through to the cookie */ }
  }
  if (!email) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    email = (cookie ? verifySession(cookie) : null)?.email ?? null;
  }
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const month = Number(url.searchParams.get('month'));
  const year  = Number(url.searchParams.get('year'));
  if (!(month >= 1 && month <= 12) || !(year >= 2000 && year <= 2100)) {
    return NextResponse.json({ error: 'Bad month or year' }, { status: 400 });
  }

  const { data: app } = await supabaseServer
    .from('lbo_applications')
    .select('strapi_attraction_id, strapi_attraction_type')
    .eq('email', email)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (!app?.strapi_attraction_id || !app.strapi_attraction_type) {
    // Approved but not linked to a listing: no attraction, so no check-ins.
    return NextResponse.json({ linked: false, total: 0, counts: {}, unknownGender: 0 });
  }

  const attractionId = `${app.strapi_attraction_type}-${app.strapi_attraction_id}`;
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to   = new Date(Date.UTC(year, month, 1)).toISOString();

  // Only confirmed on-site scans. A 'web' row is someone who opened the page,
  // which is not a visitor the tourism office should be counting.
  const { data: checkins, error } = await supabaseServer
    .from('attraction_visit_checkins')
    .select('user_id, started_at, via')
    .eq('attraction_id', attractionId)
    .eq('via', 'qr')
    .gte('started_at', from)
    .lt('started_at', to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = checkins ?? [];
  const counts: Record<string, number> = {
    local_male: 0, local_female: 0,
    other_city_male: 0, other_city_female: 0,
    other_province_male: 0, other_province_female: 0,
    foreign_male: 0, foreign_female: 0,
  };
  let unknownGender = 0;
  let unknownOrigin = 0;

  if (rows.length) {
    // check-ins hold the auth user id; the profile is keyed by email, so the
    // auth record is the bridge between them.
    const profiles = new Map<string, { user_type: string | null; gender: string | null }>();
    await Promise.all(rows.map(async r => {
      if (profiles.has(r.user_id)) return;
      try {
        const { data } = await supabaseServer.auth.admin.getUserById(r.user_id);
        const mail = data.user?.email?.toLowerCase();
        if (!mail) return;
        const { data: p } = await supabaseServer
          .from('tourist_profiles').select('user_type, gender').eq('email', mail).maybeSingle();
        profiles.set(r.user_id, { user_type: p?.user_type ?? null, gender: p?.gender ?? null });
      } catch { /* an unreadable profile is counted as unknown, not dropped */ }
    }));

    for (const r of rows) {
      const p = profiles.get(r.user_id);
      const origin = ORIGIN[p?.user_type ?? ''] ?? null;
      const gender = p?.gender === 'male' || p?.gender === 'female' ? p.gender : null;
      if (!origin) { unknownOrigin++; continue; }
      if (!gender) { unknownGender++; continue; }
      counts[`${origin}_${gender}`]++;
    }
  }

  return NextResponse.json({
    linked: true,
    total: rows.length,
    counts,
    // Reported rather than hidden: a business seeing 9 scans but 7 in the grid
    // should be told the other two did not say, not left to wonder.
    unknownGender,
    unknownOrigin,
  });
}
