'use client';

import { useEffect, useState } from 'react';
import {
  Star, QrCode, Users, Layers, Send, CheckCircle2, Clock, MapPin,
  Building2, Camera, TrendingUp, FileText, AlertCircle,
} from 'lucide-react';
import {
  DashboardHeader, Metric, MetricGrid, Panel, EmptyState,
  PendingRow, QuickAction, ROYAL,
} from './DashboardKit';

/**
 * The business owner's dashboard.
 *
 * Deliberately narrow: an LBO sees their own listing and nothing about the
 * wider system — no user counts, no other businesses, no site-wide analytics.
 * The API enforces that; this only has to be honest about which figures are
 * theirs and which are not yet available.
 */
export default function LboOverview({
  token, onGoToTab,
}: {
  token: string | null;
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

  const m = d?.metrics ?? {};
  const b = d?.business ?? {};
  const r = d?.requests ?? {};

  return (
    <div className="space-y-5">
      <DashboardHeader
        title={b.name ? `${b.name}` : 'Business Dashboard'}
        subtitle={b.linked
          ? `Your listing on Liliw Tourism${b.attraction ? ` — ${b.attraction}` : ''}.`
          : 'Your business account. No attraction listing is linked yet.'}
      />

      {!b.linked && !loading && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#B45309' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#92400E' }}>No listing linked yet</p>
            <p className="text-xs mt-1" style={{ color: '#B45309' }}>
              Until your business is linked to an attraction, visitor figures below stay empty.
              Request a listing from the Requests tab and the Tourism Office will set it up.
            </p>
          </div>
        </div>
      )}

      <MetricGrid>
        <Metric icon={<QrCode className="w-4 h-4" />} label="Visitor Check-ins"
          value={m.checkins ?? 0}
          sub={`${m.verifiedCheckins ?? 0} confirmed on-site`}
          loading={loading} accent="#16A34A" />
        <Metric icon={<Star className="w-4 h-4" />} label="Rating"
          value={m.rating ?? '—'}
          sub={m.reviews ? `from ${m.reviews} review${m.reviews === 1 ? '' : 's'}` : 'no reviews yet'}
          loading={loading} accent="#F7941D" />
        <Metric icon={<Layers className="w-4 h-4" />} label="360° Tour"
          value={m.tourScenes ?? 0}
          sub={m.tourScenes ? 'scenes published' : 'not set up yet'}
          loading={loading} accent={m.tourScenes ? '#2EC4D6' : '#64748B'} />
        <Metric icon={<Send className="w-4 h-4" />} label="Open Requests"
          value={m.openRequests ?? 0} sub="with the Tourism Office"
          loading={loading} accent={m.openRequests ? '#B45309' : '#64748B'} />
      </MetricGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Your Requests" subtitle="Changes and bookings you have asked for"
          action={<button onClick={() => onGoToTab('requests')}
            className="text-xs font-semibold" style={{ color: ROYAL }}>Open</button>}>
          {(r.pending + r.inProgress + r.done + r.rejected) === 0 ? (
            <EmptyState icon={<FileText className="w-6 h-6" />} title="No requests yet"
              message="Ask the Tourism Office to update your listing details, or to arrange a 360° tour, and they will show up here with their status."
              action={<button onClick={() => onGoToTab('requests')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: ROYAL }}>
                Make a request
              </button>} />
          ) : (
            <div className="divide-y divide-gray-50">
              <PendingRow label="Waiting to be picked up" count={r.pending ?? 0} accent="#B45309"
                onClick={() => onGoToTab('requests')} />
              <PendingRow label="Being worked on" count={r.inProgress ?? 0} accent="#2EC4D6"
                onClick={() => onGoToTab('requests')} />
              <PendingRow label="Completed" count={r.done ?? 0} accent="#16A34A"
                onClick={() => onGoToTab('requests')} />
              <PendingRow label="Not approved" count={r.rejected ?? 0} accent="#DC2626"
                onClick={() => onGoToTab('requests')} />
            </div>
          )}
        </Panel>

        <Panel title="Monthly Visitor Records" subtitle="The counts you report to the Tourism Office">
          {m.visitorRecordMonths ? (
            <div className="px-5 py-8 text-center">
              <p className="text-4xl font-bold tabular-nums" style={{ color: ROYAL }}>{m.visitorRecordMonths}</p>
              <p className="text-xs text-gray-400 mt-2">
                month{m.visitorRecordMonths === 1 ? '' : 's'} submitted
              </p>
              <button onClick={() => onGoToTab('visitors')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: ROYAL }}>
                Submit this month
              </button>
            </div>
          ) : (
            <EmptyState icon={<Users className="w-6 h-6" />} title="No records submitted"
              message="Each month you can log how many visitors came, split by where they travelled from. The Tourism Office uses this for reporting."
              action={<button onClick={() => onGoToTab('visitors')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: ROYAL }}>
                Add this month
              </button>} />
          )}
        </Panel>
      </div>

      <Panel title="Quick Actions" subtitle="The things owners do most">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <QuickAction icon={<Building2 className="w-4 h-4" />} label="Your Listing"    onClick={() => onGoToTab('overview')} accent="#F7941D" />
          <QuickAction icon={<Users className="w-4 h-4" />}     label="Visitor Records" onClick={() => onGoToTab('visitors')} accent="#16A34A" />
          <QuickAction icon={<Send className="w-4 h-4" />}      label="Request Change"  onClick={() => onGoToTab('requests')} accent="#2EC4D6" />
          <QuickAction icon={<Star className="w-4 h-4" />}      label="Your Reviews"    onClick={() => onGoToTab('ratings')}  accent="#D43D8D" />
        </div>
      </Panel>
    </div>
  );
}
