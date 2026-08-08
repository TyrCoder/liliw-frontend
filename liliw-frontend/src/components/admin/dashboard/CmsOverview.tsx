'use client';

import { useEffect, useState } from 'react';
import {
  Inbox, FileEdit, ShieldCheck, MapPin, CalendarDays, Newspaper, Palette,
  BookOpen, HelpCircle, Route, Users, Activity, Plus, AlertCircle, Layers,
  ArrowRight, CheckCircle2, PenLine,
} from 'lucide-react';
import {
  DashboardHeader, Metric, MetricGrid, Panel, EmptyState, RankedList,
  ActivityFeed, PendingRow, QuickAction, relativeTime, ROYAL,
} from './DashboardKit';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; accent: string }> = {
  attractions:  { label: 'Attractions', icon: <MapPin className="w-3.5 h-3.5" />,      accent: '#F7941D' },
  events:       { label: 'Events',      icon: <CalendarDays className="w-3.5 h-3.5" />,accent: '#8B5CF6' },
  news:         { label: 'News',        icon: <Newspaper className="w-3.5 h-3.5" />,   accent: '#2EC4D6' },
  'art-forms':  { label: 'Art forms',   icon: <Palette className="w-3.5 h-3.5" />,     accent: '#D43D8D' },
  artisans:     { label: 'Artisans',    icon: <Users className="w-3.5 h-3.5" />,       accent: '#16A34A' },
  stories:      { label: 'Stories',     icon: <BookOpen className="w-3.5 h-3.5" />,    accent: '#F97316' },
  faqs:         { label: 'FAQs',        icon: <HelpCircle className="w-3.5 h-3.5" />,  accent: '#6366F1' },
  itineraries:  { label: 'Itineraries', icon: <Route className="w-3.5 h-3.5" />,       accent: '#84CC16' },
};

/**
 * The CMS dashboard, in two guises.
 *
 * An officer reviews and publishes; an editor writes and submits. They share
 * the same library and the same design, so this is one component with the
 * panels each role actually needs — rather than two files that would drift.
 */
export default function CmsOverview({
  token, username, isOfficer, onGoToTab,
}: {
  token: string | null;
  username: string;
  isOfficer: boolean;
  onGoToTab: (tab: string) => void;
}) {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setD)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const content = d?.content ?? {};
  const pending = d?.pending ?? {};
  const pendingTotal = Object.values(pending).reduce((s: number, n) => s + Number(n), 0);

  const totals = Object.values(content) as any[];
  const published = totals.reduce((s, t) => s + (t?.approved ?? 0), 0);
  const drafts    = totals.reduce((s, t) => s + (t?.draft ?? 0), 0);
  const rejected  = totals.reduce((s, t) => s + (t?.rejected ?? 0), 0);
  const archived  = totals.reduce((s, t) => s + (t?.archived ?? 0), 0);

  return (
    <div className="space-y-5">
      <DashboardHeader
        title={isOfficer ? 'Officer Dashboard' : 'Editor Dashboard'}
        subtitle={isOfficer
          ? `Welcome back, ${username}. Here's what needs your review.`
          : `Welcome back, ${username}. Here's your content and what's with the reviewers.`}
      />

      <MetricGrid>
        {isOfficer ? (
          <Metric icon={<Inbox className="w-4 h-4" />} label="Awaiting Review"
            value={pendingTotal} sub="submitted by editors" loading={loading}
            accent={pendingTotal ? '#B45309' : '#64748B'} />
        ) : (
          <Metric icon={<PenLine className="w-4 h-4" />} label="Your Open Work"
            value={d?.myWork?.length ?? 0} sub="drafts and returns" loading={loading}
            accent={d?.myWork?.length ? '#B45309' : '#64748B'} />
        )}
        <Metric icon={<ShieldCheck className="w-4 h-4" />} label="Published"
          value={published} sub="live on the site" loading={loading} accent="#16A34A" />
        <Metric icon={<FileEdit className="w-4 h-4" />} label="Drafts"
          value={drafts} sub="not yet submitted" loading={loading} accent="#64748B" />
        <Metric icon={isOfficer ? <Layers className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          label={isOfficer ? 'Archived' : 'Sent Back'}
          value={isOfficer ? archived : rejected}
          sub={isOfficer ? 'off the site, recoverable' : 'needs your changes'}
          loading={loading} accent={isOfficer ? '#B45309' : rejected ? '#DC2626' : '#64748B'} />
      </MetricGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Officers: the queue. Editors: their own desk. */}
        {isOfficer ? (
          <Panel title="Review Queue" subtitle="Content submitted and waiting"
            action={<button onClick={() => onGoToTab('approvals')}
              className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: ROYAL }}>
              Open <ArrowRight className="w-3 h-3" />
            </button>}>
            {pendingTotal === 0 ? (
              <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} title="Queue is clear"
                message="Nothing is waiting for review. Submitted content will appear here as soon as an editor sends it." />
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.entries(pending)
                  .filter(([, n]) => Number(n) > 0)
                  .map(([type, n]) => (
                    <PendingRow key={type} label={TYPE_META[type]?.label ?? type}
                      count={Number(n)} accent={TYPE_META[type]?.accent}
                      onClick={() => onGoToTab('approvals')} />
                  ))}
              </div>
            )}
          </Panel>
        ) : (
          <Panel title="Your Work in Progress" subtitle="Drafts and anything sent back to you">
            {d?.myWork?.length ? (
              <ul className="divide-y divide-gray-50">
                {d.myWork.map((w: any) => (
                  <li key={`${w.type}-${w.id}`}>
                    <button onClick={() => onGoToTab(w.type)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition text-left">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${TYPE_META[w.type]?.accent ?? '#64748B'}14`,
                          color: TYPE_META[w.type]?.accent ?? '#64748B',
                        }}>
                        {TYPE_META[w.type]?.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{w.title}</p>
                        <p className="text-[11px] text-gray-400">
                          {TYPE_META[w.type]?.label ?? w.type} · updated {relativeTime(w.updatedAt)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={w.status === 'rejected'
                          ? { backgroundColor: 'rgba(220,38,38,0.1)', color: '#DC2626' }
                          : { backgroundColor: '#F1F5F9', color: '#64748B' }}>
                        {w.status === 'rejected' ? 'Sent back' : 'Draft'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<PenLine className="w-6 h-6" />} title="Nothing in progress"
                message="Drafts you start and anything a reviewer sends back will collect here."
                action={<button onClick={() => onGoToTab('attractions')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: ROYAL }}>
                  Start something new
                </button>} />
            )}
          </Panel>
        )}

        {/* The library, same for both */}
        <Panel title="Content Library" subtitle="Published entries by type">
          {published === 0 ? (
            <EmptyState icon={<FileEdit className="w-6 h-6" />} title="Nothing published yet"
              message="Approved content appears here, counted by type." />
          ) : (
            <RankedList items={Object.entries(content)
              .map(([type, v]: [string, any]) => ({ label: TYPE_META[type]?.label ?? type, value: v?.approved ?? 0 }))
              .filter(i => Number(i.value) > 0)
              .sort((a, b) => Number(b.value) - Number(a.value))} />
          )}
        </Panel>
      </div>

      {/* Gaps worth acting on, rather than a wall of counts */}
      <Panel title={isOfficer ? 'Needs Attention' : 'Where Things Stand'}
        subtitle="Types with nothing published, or work sitting unfinished">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const v = content[type] ?? {};
            const empty = (v.approved ?? 0) === 0;
            const waiting = (v.draft ?? 0) + (v.pending ?? 0) + (v.rejected ?? 0);
            return (
              <button key={type} onClick={() => onGoToTab(type)}
                className="bg-white px-4 py-3.5 text-left hover:bg-gray-50 transition">
                <div className="flex items-center gap-2">
                  <span style={{ color: meta.accent }}>{meta.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 truncate">{meta.label}</span>
                </div>
                <p className="text-lg font-bold mt-1.5 leading-none tabular-nums"
                  style={{ color: empty ? '#CBD5E1' : '#0F172A' }}>
                  {v.approved ?? 0}
                </p>
                <p className="text-[10px] mt-1"
                  style={{ color: empty ? '#DC2626' : waiting ? '#B45309' : '#94A3B8' }}>
                  {empty ? 'nothing published' : waiting ? `${waiting} in progress` : 'all published'}
                </p>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={isOfficer ? 'Recent Activity' : 'Your Recent Edits'}
          subtitle={isOfficer ? 'Across the whole CMS' : 'What you have changed lately'}>
          {d?.activity?.length ? (
            <ActivityFeed items={d.activity.slice(0, 7).map((a: any) => ({
              icon: <Activity className="w-3.5 h-3.5" />,
              accent: a.event === 'entry.publish' ? '#16A34A' : a.event === 'entry.delete' ? '#DC2626' : ROYAL,
              title: a.entry_title || a.model,
              meta: `${a.event.replace('entry.', '')}${isOfficer && a.performed_by ? ` · ${a.performed_by}` : ''}`,
              when: relativeTime(a.created_at),
            }))} />
          ) : (
            <EmptyState icon={<Activity className="w-6 h-6" />} title="No activity yet"
              message={isOfficer ? 'Edits and approvals appear here as the team works.' : 'Your edits will be listed here.'} />
          )}
        </Panel>

        <Panel title="Quick Actions" subtitle="Start something, or jump to the queue">
          <div className="grid grid-cols-3 gap-3 p-4">
            <QuickAction icon={<MapPin className="w-4 h-4" />}       label="Attraction" onClick={() => onGoToTab('attractions')} accent="#F7941D" />
            <QuickAction icon={<CalendarDays className="w-4 h-4" />} label="Event"      onClick={() => onGoToTab('events')}      accent="#8B5CF6" />
            <QuickAction icon={<Newspaper className="w-4 h-4" />}    label="News"       onClick={() => onGoToTab('news')}        accent="#2EC4D6" />
            <QuickAction icon={<BookOpen className="w-4 h-4" />}     label="Story"      onClick={() => onGoToTab('stories')}     accent="#F97316" />
            <QuickAction icon={<Route className="w-4 h-4" />}        label="Itinerary"  onClick={() => onGoToTab('itineraries')} accent="#84CC16" />
            {isOfficer
              ? <QuickAction icon={<Inbox className="w-4 h-4" />} label="Approvals" onClick={() => onGoToTab('approvals')} accent="#B45309" />
              : <QuickAction icon={<Plus className="w-4 h-4" />}  label="FAQ"       onClick={() => onGoToTab('faqs')}      accent="#6366F1" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
