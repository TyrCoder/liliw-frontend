import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, CMS_TABLES, labelFieldFor } from '@/lib/cms-auth';

/**
 * Dashboard data, shaped by who is asking.
 *
 * One endpoint rather than four because the roles overlap heavily — an officer
 * and an admin both want the approvals queue — and because the alternative is
 * four routes drifting apart on what "pending" counts as. What differs is what
 * each role is allowed to see, and that is enforced here rather than by the
 * dashboard choosing not to render it: hiding a card is not access control.
 */

type Role = 'admin' | 'officer' | 'editor';

const countOf = async (table: string, filter?: (q: any) => any) => {
  let q = supabaseServer.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
};

/** Content totals by status, for every CMS type at once. */
async function contentBreakdown() {
  const entries = await Promise.all(
    Object.entries(CMS_TABLES).map(async ([type, table]) => {
      const { data } = await supabaseServer.from(table).select('status');
      const rows = data ?? [];
      const by = (s: string) => rows.filter(r => r.status === s).length;
      return [type, {
        total: rows.length,
        approved: by('approved'),
        draft: by('draft'),
        pending: by('pending'),
        rejected: by('rejected'),
        archived: by('archived'),
      }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Everything awaiting a review decision, per type. */
async function pendingQueue() {
  const entries = await Promise.all(
    Object.entries(CMS_TABLES).map(async ([type, table]) => {
      const { count } = await supabaseServer
        .from(table).select('*', { count: 'exact', head: true }).eq('status', 'pending');
      return [type, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function GET(req: NextRequest) {
  const { role, email } = await getCmsIdentity(req);

  // LBO owners are ordinary accounts with an approved application, not a CMS
  // role, so they are identified separately.
  let lboEmail: string | null = null;
  if (!role) {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (token) {
      const { data: { user } } = await supabaseServer.auth.getUser(token);
      if (user?.email) {
        const { data: app } = await supabaseServer
          .from('lbo_applications').select('id').eq('email', user.email.toLowerCase())
          .eq('status', 'approved').maybeSingle();
        if (app) lboEmail = user.email.toLowerCase();
      }
    }
    if (!lboEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  /* ── LBO ──────────────────────────────────────────────────────────────── */
  if (lboEmail) {
    const { data: app } = await supabaseServer
      .from('lbo_applications')
      .select('business_name, owner_name, attraction_name, strapi_attraction_id, strapi_attraction_type, created_at')
      .eq('email', lboEmail).eq('status', 'approved').maybeSingle();

    const attractionId = app?.strapi_attraction_id ?? null;
    const publicId = attractionId && app?.strapi_attraction_type
      ? `${app.strapi_attraction_type}-${attractionId}` : null;

    const [reviews, requests, records, checkins, tour] = await Promise.all([
      publicId
        ? supabaseServer.from('reviews').select('rating, created_at').eq('item_id', publicId)
        : Promise.resolve({ data: [] as { rating: number; created_at: string }[] }),
      supabaseServer.from('lbo_change_requests').select('status').eq('lbo_email', lboEmail),
      // lbo_visitor_records, not visitor_records — the latter exists, is empty,
      // and has no lbo_email, so querying it would have reported zero forever.
      supabaseServer.from('lbo_visitor_records').select('id').eq('lbo_email', lboEmail),
      attractionId
        ? supabaseServer.from('attraction_visit_checkins').select('via, started_at').eq('attraction_id', attractionId)
        : Promise.resolve({ data: [] as { via: string; started_at: string }[] }),
      attractionId
        ? supabaseServer.from('cms_attractions').select('virtual_tour_photos').eq('id', attractionId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const revs = reviews.data ?? [];
    const reqs = requests.data ?? [];
    const chk = checkins.data ?? [];

    return NextResponse.json({
      role: 'lbo',
      business: {
        name: app?.business_name ?? null,
        owner: app?.owner_name ?? null,
        attraction: app?.attraction_name ?? null,
        linked: !!attractionId,
        since: app?.created_at ?? null,
      },
      metrics: {
        reviews: revs.length,
        rating: revs.length
          ? Math.round((revs.reduce((s, r) => s + (r.rating || 0), 0) / revs.length) * 10) / 10
          : null,
        checkins: chk.length,
        verifiedCheckins: chk.filter(c => c.via === 'qr').length,
        visitorRecordMonths: (records.data ?? []).length,
        openRequests: reqs.filter(r => ['pending', 'in_progress'].includes(r.status)).length,
        tourScenes: Array.isArray((tour.data as any)?.virtual_tour_photos)
          ? (tour.data as any).virtual_tour_photos.length : 0,
      },
      requests: {
        pending: reqs.filter(r => r.status === 'pending').length,
        inProgress: reqs.filter(r => r.status === 'in_progress').length,
        done: reqs.filter(r => r.status === 'done').length,
        rejected: reqs.filter(r => r.status === 'rejected').length,
      },
    });
  }

  /* ── CMS roles ────────────────────────────────────────────────────────── */
  const r = role as Role;
  const [content, pending, audit] = await Promise.all([
    contentBreakdown(),
    pendingQueue(),
    supabaseServer.from('audit_logs')
      .select('event, model, entry_title, performed_by, created_at')
      .order('created_at', { ascending: false })
      .limit(r === 'editor' ? 40 : 15),
  ]);

  const recent = (audit.data ?? []);

  /* Editors see their own work and the shared library — not the user base,
     not applications, not audit for the whole team. */
  if (r === 'editor') {
    const mine = recent.filter(a => a.performed_by === email).slice(0, 12);
    const myDrafts = await Promise.all(
      Object.entries(CMS_TABLES).map(async ([type, table]) => {
        const { data } = await supabaseServer
          .from(table)
          .select(`id, status, created_by, updated_at, ${labelFieldFor(type)}`)
          .in('status', ['draft', 'rejected'])
          .eq('created_by', email)
          .order('updated_at', { ascending: false })
          .limit(5);
        return (data ?? []).map((row: any) => ({
          type, id: row.id, status: row.status,
          title: row[labelFieldFor(type)] ?? row.id,
          updatedAt: row.updated_at,
        }));
      }),
    );

    return NextResponse.json({
      role: 'editor',
      email,
      content,
      pending,               // what they submitted is now with a reviewer
      myWork: myDrafts.flat()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8),
      activity: mine,
    });
  }

  /* Officers review; admins do that and run the system. */
  const [lboApps, changeReqs, participation, submissions] = await Promise.all([
    supabaseServer.from('lbo_applications').select('status'),
    supabaseServer.from('lbo_change_requests').select('status'),
    supabaseServer.from('participation_requests').select('id'),
    supabaseServer.from('submissions').select('id'),
  ]);

  const apps = lboApps.data ?? [];
  const crs = changeReqs.data ?? [];

  const base = {
    role: r,
    email,
    content,
    pending,
    activity: recent,
    queues: {
      lboApplications: apps.filter(a => a.status === 'pending').length,
      changeRequests:  crs.filter(c => ['pending', 'in_progress'].includes(c.status)).length,
      participation:   (participation.data ?? []).length,
      submissions:     (submissions.data ?? []).length,
    },
  };

  if (r === 'officer') return NextResponse.json(base);

  /* Admin only: people, engagement and system counts. */
  const [profiles, tourists, points, redemptions, checkins, reviewsCount, toursCount] = await Promise.all([
    supabaseServer.from('profiles').select('role, created_at'),
    countOf('tourist_profiles'),
    supabaseServer.from('user_points').select('points, created_at'),
    countOf('reward_redemptions'),
    countOf('attraction_visit_checkins'),
    countOf('reviews'),
    supabaseServer.from('cms_attractions').select('virtual_tour_photos'),
  ]);

  const people = profiles.data ?? [];
  const monthAgo = Date.now() - 30 * 86_400_000;
  const roleCount = (name: string) => people.filter(p => p.role === name).length;

  return NextResponse.json({
    ...base,
    users: {
      total: people.length,
      tourists,
      newThisMonth: people.filter(p => new Date(p.created_at).getTime() > monthAgo).length,
      byRole: {
        admin:   roleCount('admin'),
        officer: roleCount('chatoofficer'),
        editor:  roleCount('chatoeditor'),
        member:  people.filter(p => !['admin', 'chatoofficer', 'chatoeditor'].includes(p.role)).length,
      },
    },
    engagement: {
      pointsAwarded: (points.data ?? []).reduce((s, p) => s + (p.points || 0), 0),
      checkins,
      reviews: reviewsCount,
      redemptions,
      virtualTours: (toursCount.data ?? []).filter(
        (a: any) => Array.isArray(a.virtual_tour_photos) && a.virtual_tour_photos.length,
      ).length,
      lboPartners: apps.filter(a => a.status === 'approved').length,
    },
    auditTotal: await countOf('audit_logs'),
  });
}
