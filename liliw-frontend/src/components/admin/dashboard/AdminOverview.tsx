'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye, Users, MapPin, Palette, CalendarDays, Inbox, FileEdit, UserPlus,
  Activity, ShieldCheck, Trophy, QrCode, Star, Gift, Building2, Layers,
  BarChart3, Clock, ArrowRight, Plus, Newspaper,
} from 'lucide-react';
import {
  DashboardHeader, Metric, MetricGrid, Panel, EmptyState, TrendChart, ChartLegend,
  RankedList, ActivityFeed, PendingRow, QuickAction, relativeTime, ROYAL,
} from './DashboardKit';

const RANGES = [
  { key: '7',   label: '7 Days' },
  { key: '30',  label: '30 Days' },
  { key: '90',  label: '90 Days' },
  { key: '365', label: '1 Year' },
];

const EVENT_LOOK: Record<string, { icon: React.ReactNode; accent: string }> = {
  'entry.create':    { icon: <Plus className="w-3.5 h-3.5" />,        accent: '#16A34A' },
  'entry.update':    { icon: <FileEdit className="w-3.5 h-3.5" />,    accent: '#0F5FB5' },
  'entry.publish':   { icon: <ShieldCheck className="w-3.5 h-3.5" />, accent: '#16A34A' },
  'entry.submit':    { icon: <Inbox className="w-3.5 h-3.5" />,       accent: '#B45309' },
  'entry.archive':   { icon: <Layers className="w-3.5 h-3.5" />,      accent: '#B45309' },
  'entry.restore':   { icon: <Activity className="w-3.5 h-3.5" />,    accent: '#0F5FB5' },
  'entry.delete':    { icon: <Inbox className="w-3.5 h-3.5" />,       accent: '#DC2626' },
};

const MODEL_LABEL: Record<string, string> = {
  cms_attractions: 'Attraction', cms_events: 'Event', cms_news: 'News',
  cms_art_forms: 'Art form', cms_artisans: 'Artisan', cms_stories: 'Story',
  cms_faqs: 'FAQ', cms_itineraries: 'Itinerary',
};

interface Props {
  token: string | null;
  username: string;
  onGoToTab: (tab: string) => void;
}

export default function AdminOverview({ token, username, onGoToTab }: Props) {
  const [range, setRange]   = useState('30');
  const [stats, setStats]   = useState<any>(null);
  const [an, setAn]         = useState<any>(null);
  const [anError, setAnError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attractions, setAttractions] = useState<Record<string, string>>({});

  const h = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Names for the "most visited" list — analytics stores ids, not titles.
    fetch('/api/content/attractions')
      .then(r => r.json())
      .then(d => setAttractions(Object.fromEntries(
        (d.data ?? []).map((a: any) => [a.id, a.attributes?.name ?? a.id]),
      )))
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = useCallback(() => {
    if (!token) return;
    setAnError(null);
    fetch(`/api/admin/analytics/summary?range=${range}`, { headers: h })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) {
          setAn(null);
          setAnError(d.needsMigration
            ? 'Visitor tracking is not set up yet — run supabase/phase21-page-views.sql.'
            : d.error || 'Could not load visitor analytics.');
          return;
        }
        setAn(d);
      })
      .catch(() => setAnError('Could not reach the analytics service.'));
  }, [token, range]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const c = stats?.content ?? {};
  const q = stats?.queues ?? {};
  const pendingTotal = Object.values(stats?.pending ?? {}).reduce((s: number, n) => s + Number(n), 0);
  const actionsTotal = pendingTotal + (q.lboApplications ?? 0) + (q.changeRequests ?? 0);

  return (
    <div className="space-y-5">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${username}. Here's what's happening across Liliw Tourism.`}
      />

      {/* ── Headline numbers ── */}
      <MetricGrid>
        <Metric icon={<Eye className="w-4 h-4" />} label="Page Views"
          value={(an?.totals.pageViews ?? 0).toLocaleString()}
          sub={`last ${an?.range ?? range} days`} trend={an?.trends.pageViews}
          loading={!an && !anError} accent={ROYAL} />
        <Metric icon={<Users className="w-4 h-4" />} label="Unique Visitors"
          value={(an?.totals.uniqueVisitors ?? 0).toLocaleString()}
          sub="distinct sessions" trend={an?.trends.uniqueVisitors}
          loading={!an && !anError} accent="#2EC4D6" />
        <Metric icon={<UserPlus className="w-4 h-4" />} label="Registered Users"
          value={(stats?.users?.total ?? 0).toLocaleString()}
          sub={`+${stats?.users?.newThisMonth ?? 0} this month`}
          loading={loading} accent="#16A34A" />
        <Metric icon={<Inbox className="w-4 h-4" />} label="Pending Actions"
          value={actionsTotal} sub="waiting on you"
          loading={loading} accent={actionsTotal > 0 ? '#B45309' : '#64748B'} />
      </MetricGrid>

      <MetricGrid>
        <Metric icon={<MapPin className="w-4 h-4" />} label="Attractions"
          value={c.attractions?.approved ?? 0} sub={`${c.attractions?.total ?? 0} in the CMS`}
          loading={loading} accent="#F7941D" />
        <Metric icon={<Palette className="w-4 h-4" />} label="Artisans & Art Forms"
          value={(c.artisans?.approved ?? 0) + (c['art-forms']?.approved ?? 0)}
          sub="published" loading={loading} accent="#D43D8D" />
        <Metric icon={<CalendarDays className="w-4 h-4" />} label="Events & News"
          value={(c.events?.approved ?? 0) + (c.news?.approved ?? 0)}
          sub="published" loading={loading} accent="#8B5CF6" />
        <Metric icon={<FileEdit className="w-4 h-4" />} label="CMS Changes"
          value={(stats?.auditTotal ?? 0).toLocaleString()} sub="content edits tracked"
          loading={loading} accent="#0B3D91" />
      </MetricGrid>

      {/* ── Visitor analytics ── */}
      <Panel
        title="Visitor Analytics"
        subtitle="Page views and unique visitors over time"
        action={
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                style={range === r.key
                  ? { backgroundColor: ROYAL, color: '#fff' }
                  : { backgroundColor: '#F1F5F9', color: '#64748B' }}>
                {r.label}
              </button>
            ))}
          </div>
        }>
        {anError ? (
          <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="Visitor tracking unavailable"
            message={anError} />
        ) : !an ? (
          <div className="h-[232px] animate-pulse bg-gray-50" />
        ) : !an.hasData ? (
          <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No visits recorded yet"
            message="Views are counted from the moment tracking went live, so this fills in as people browse the site. Nothing is estimated." />
        ) : (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <ChartLegend />
              {an.totals.bounceRate !== null && (
                <span className="text-[11px] text-gray-400">
                  {an.totals.bounceRate}% left after one page
                </span>
              )}
            </div>
            <TrendChart series={an.series} />
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Most visited ── */}
        <Panel title="Most Visited Attractions" subtitle={`Based on real page views · last ${range} days`}>
          {/* The name comes from the API now, which reads cms_attractions
              directly and so still knows archived entries. An archived one is
              labelled and left unlinked rather than pointing at a page that
              404s; the id fallback is only for a row whose attraction has been
              deleted outright. */}
          {an?.topAttractions?.length ? (
            <RankedList items={an.topAttractions.map((t: any) => ({
              label: (t.name ?? attractions[t.id] ?? t.id) + (t.archived ? ' (archived)' : ''),
              value: t.views,
              href: t.archived ? undefined : `/attractions/${t.id}`,
            }))} />
          ) : (
            <EmptyState icon={<MapPin className="w-6 h-6" />} title="Nothing to rank yet"
              message="Once visitors open attraction pages, the most viewed appear here in order." />
          )}
        </Panel>

        {/* ── Pending admin actions ── */}
        <Panel title="Pending Actions" subtitle="Everything waiting on a decision"
          action={<span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: actionsTotal ? 'rgba(180,83,9,0.12)' : '#F1F5F9', color: actionsTotal ? '#B45309' : '#94A3B8' }}>
            {actionsTotal}
          </span>}>
          {actionsTotal === 0 ? (
            <EmptyState icon={<ShieldCheck className="w-6 h-6" />} title="Nothing waiting"
              message="No content is awaiting review, and there are no open applications or change requests." />
          ) : (
            <div className="divide-y divide-gray-50">
              <PendingRow label="Content awaiting review" count={pendingTotal}
                accent="#B45309" onClick={() => onGoToTab('cms')} />
              <PendingRow label="Business applications" count={q.lboApplications ?? 0}
                accent="#F7941D" onClick={() => onGoToTab('lbo')} />
              <PendingRow label="Listing change requests" count={q.changeRequests ?? 0}
                accent="#2EC4D6" onClick={() => onGoToTab('changerequests')} />
              <PendingRow label="Participation requests" count={q.participation ?? 0}
                accent="#8B5CF6" onClick={() => onGoToTab('participation')} />
            </div>
          )}
        </Panel>
      </div>

      {/* ── Engagement ── */}
      <Panel title="Visitor Engagement" subtitle="What people are doing once they arrive">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-px bg-gray-100">
          {[
            { icon: <QrCode className="w-4 h-4" />,   label: 'QR check-ins', value: stats?.engagement?.checkins ?? 0,      accent: '#16A34A' },
            { icon: <Trophy className="w-4 h-4" />,   label: 'Points awarded', value: stats?.engagement?.pointsAwarded ?? 0, accent: '#F7C948' },
            { icon: <Star className="w-4 h-4" />,     label: 'Reviews',      value: stats?.engagement?.reviews ?? 0,        accent: '#F7941D' },
            { icon: <Gift className="w-4 h-4" />,     label: 'Redemptions',  value: stats?.engagement?.redemptions ?? 0,    accent: '#D43D8D' },
            { icon: <Layers className="w-4 h-4" />,   label: '360° tours',   value: stats?.engagement?.virtualTours ?? 0,   accent: '#2EC4D6' },
            { icon: <Building2 className="w-4 h-4" />,label: 'LBO partners', value: stats?.engagement?.lboPartners ?? 0,    accent: '#0B3D91' },
          ].map(m => (
            <div key={m.label} className="bg-white px-4 py-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${m.accent}14`, color: m.accent }}>{m.icon}</span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tabular-nums text-gray-900">{m.value.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400 mt-1 truncate">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── System activity ── */}
        <Panel title="System Activity" subtitle="Latest changes across the CMS"
          action={<button onClick={() => onGoToTab('audit')}
            className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: ROYAL }}>
            Audit log <ArrowRight className="w-3 h-3" />
          </button>}>
          {stats?.activity?.length ? (
            <ActivityFeed items={stats.activity.slice(0, 8).map((a: any) => {
              const look = EVENT_LOOK[a.event] ?? { icon: <Activity className="w-3.5 h-3.5" />, accent: '#64748B' };
              return {
                icon: look.icon, accent: look.accent,
                title: a.entry_title || MODEL_LABEL[a.model] || a.model,
                meta: `${a.event.replace('entry.', '')} · ${MODEL_LABEL[a.model] ?? a.model} · ${a.performed_by ?? 'system'}`,
                when: relativeTime(a.created_at),
              };
            })} />
          ) : (
            <EmptyState icon={<Activity className="w-6 h-6" />} title="No activity yet"
              message="Content edits, approvals and archives appear here as they happen." />
          )}
        </Panel>

        {/* ── People ── */}
        <Panel title="People" subtitle="Who has access to the system"
          action={<button onClick={() => onGoToTab('users')}
            className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: ROYAL }}>
            Manage <ArrowRight className="w-3 h-3" />
          </button>}>
          <div className="p-5 space-y-3">
            {[
              { label: 'Administrators', n: stats?.users?.byRole?.admin ?? 0,   accent: '#DC2626' },
              { label: 'Tourism officers', n: stats?.users?.byRole?.officer ?? 0, accent: '#0B3D91' },
              { label: 'Content editors', n: stats?.users?.byRole?.editor ?? 0,  accent: '#8B5CF6' },
              { label: 'Visitor accounts', n: stats?.users?.byRole?.member ?? 0, accent: '#16A34A' },
            ].map(row => {
              const total = Math.max(1, stats?.users?.total ?? 1);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{row.label}</span>
                    <span className="font-bold tabular-nums text-gray-800">{row.n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(row.n / total) * 100}%`, backgroundColor: row.accent }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* ── Quick actions ── */}
      <Panel title="Quick Actions" subtitle="Common jobs, one click away">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4">
          <QuickAction icon={<MapPin className="w-4 h-4" />}      label="Add Attraction" href="/cms"  accent="#F7941D" />
          <QuickAction icon={<Palette className="w-4 h-4" />}     label="Add Artisan"    href="/cms"  accent="#D43D8D" />
          <QuickAction icon={<CalendarDays className="w-4 h-4" />}label="Create Event"   href="/cms"  accent="#8B5CF6" />
          <QuickAction icon={<Newspaper className="w-4 h-4" />}   label="Post News"      href="/cms"  accent="#2EC4D6" />
          <QuickAction icon={<Inbox className="w-4 h-4" />}       label="Review Queue"   onClick={() => onGoToTab('cms')} accent="#B45309" />
          <QuickAction icon={<Users className="w-4 h-4" />}       label="Manage Roles"   onClick={() => onGoToTab('roles')} accent="#0B3D91" />
          <QuickAction icon={<Clock className="w-4 h-4" />}       label="Audit Log"      onClick={() => onGoToTab('audit')} accent="#64748B" />
        </div>
      </Panel>
    </div>
  );
}
