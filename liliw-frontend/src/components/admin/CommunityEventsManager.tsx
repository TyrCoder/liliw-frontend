'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2, HeartHandshake, Users, Calendar, MapPin, ChevronLeft, Download,
  CheckCircle, XCircle, Mail, Phone, RefreshCw, AlertCircle, UserPlus,
} from 'lucide-react';

interface Signups { total: number; confirmed: number; cancelled: number }
interface CommunityEvent {
  id: string; title: string; category: string; venue: string;
  date_start: string | null; date_end: string | null;
  organizer: string; slots: number | null; is_open: boolean;
  status: string; signups: Signups;
}
interface Signup {
  id: string; full_name: string; email: string | null; phone: string;
  message: string; status: string; created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-50 text-green-700', draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700', rejected: 'bg-red-50 text-red-600',
};
const SIGNUP_BADGE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700', confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function fmtDate(iso: string | null) {
  if (!iso) return 'No date set';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * The community events manager — what is on, and who has joined it.
 *
 * The events list comes first because that is the question staff arrive with:
 * they are organising a specific clean-up, not browsing volunteers. Picking one
 * replaces the list with its participants rather than expanding a row, so the
 * contact details have the whole width to be read and copied from.
 */
export default function CommunityEventsManager({ token }: { token: string }) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  const [selected, setSelected] = useState<CommunityEvent | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loadingSignups, setLoadingSignups] = useState(false);

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ full_name: '', email: '', phone: '', message: '' });

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/community-events', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `Could not load events (${r.status})`);
        return d;
      })
      .then(d => { setEvents(d.data || []); setFailed(null); })
      // An empty table and a failed request looked identical everywhere else in
      // this project before it was fixed; not repeating that here.
      .catch(err => setFailed(err instanceof Error ? err.message : 'Could not load events'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openEvent = async (e: CommunityEvent) => {
    setSelected(e);
    setLoadingSignups(true);
    setSignups([]);
    try {
      const res = await fetch(`/api/admin/community-events/${e.id}/signups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not load participants');
      setSignups(d.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load participants');
    } finally {
      setLoadingSignups(false);
    }
  };

  const setStatus = async (signup: Signup, status: string) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/community-events/${selected.id}/signups`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: signup.id, status }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not update');
      setSignups(prev => prev.map(s => (s.id === signup.id ? { ...s, status } : s)));
      toast.success(status === 'confirmed' ? `${signup.full_name} confirmed` : `${signup.full_name} cancelled`);
      load();   // the count on the events list has changed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  /** Records someone who signed up in person, by phone, or on a paper sheet. */
  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !draft.full_name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/community-events/${selected.id}/signups`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not add them');
      setSignups(prev => [...prev, d.signup]);
      setDraft({ full_name: '', email: '', phone: '', message: '' });
      setAdding(false);
      toast.success(`${d.signup.full_name} added`);
      load();   // the count on the events list has changed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add them');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!selected) return;
    const rows = [
      ['Signed up', 'Name', 'Email', 'Phone', 'Status', 'Message'],
      ...signups.map(s => [s.created_at, s.full_name, s.email, s.phone, s.status, s.message]),
    ];
    const blob = new Blob([rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.title.replace(/[^\w-]+/g, '-')}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Participants for one event ────────────────────────────
  if (selected) {
    const active = signups.filter(s => s.status !== 'cancelled');
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />All community events
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-start gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900">{selected.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(selected.date_start)}</span>
                {selected.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.venue}</span>}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {active.length}{selected.slots ? ` of ${selected.slots}` : ''} joined
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {signups.length > 0 && (
                <button onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                  <Download className="w-3.5 h-3.5" />Export CSV
                </button>
              )}
              <button onClick={() => setAdding(a => !a)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: '#1565C0' }}>
                <UserPlus className="w-3.5 h-3.5" />Add participant
              </button>
            </div>
          </div>

          {/* Recording someone who signed up away from the website — at the
              office, over the phone, or on a sheet at the barangay hall. */}
          {adding && (
            <form onSubmit={addParticipant} className="px-6 py-4 border-b border-gray-100 bg-blue-50/40">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input autoFocus required value={draft.full_name}
                  onChange={e => setDraft(d => ({ ...d, full_name: e.target.value }))}
                  placeholder="Full name *"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <input type="email" value={draft.email}
                  onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                  placeholder="Email (optional)"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <input value={draft.phone}
                  onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <input value={draft.message}
                  onChange={e => setDraft(d => ({ ...d, message: e.target.value }))}
                  placeholder="Note (optional)"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button type="submit" disabled={!draft.full_name.trim() || saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: '#1565C0' }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {saving ? 'Adding…' : 'Add to this event'}
                </button>
                <button type="button" onClick={() => setAdding(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100">
                  Cancel
                </button>
                <span className="text-[11px] text-gray-400 ml-1">
                  Only a name is required — added participants count as confirmed.
                </span>
              </div>
            </form>
          )}

          {loadingSignups ? (
            <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-300" /></div>
          ) : signups.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Nobody has joined yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Sign-ups from the Community page appear here — or use
                <strong className="text-gray-500"> Add participant</strong> to record someone who joined in person.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Contact</th>
                    <th className="px-5 py-3 text-left">Message</th>
                    <th className="px-5 py-3 text-left">Signed up</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {signups.map(s => (
                    <tr key={s.id} className={s.status === 'cancelled' ? 'opacity-50' : ''}>
                      <td className="px-5 py-4 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="px-5 py-4">
                        {/* Staff can record a walk-in who only left a phone
                            number, so there may be no address to link to. */}
                        {s.email ? (
                          <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-gray-600 hover:underline">
                            <Mail className="w-3 h-3 shrink-0" />{s.email}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">No email</span>
                        )}
                        {s.phone && (
                          <p className="flex items-center gap-1 text-gray-400 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />{s.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-gray-500 line-clamp-2">{s.message || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{fmtWhen(s.created_at)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${SIGNUP_BADGE[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {s.status !== 'confirmed' && (
                          <button onClick={() => setStatus(s, 'confirmed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 mr-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />Confirm
                          </button>
                        )}
                        {s.status !== 'cancelled' ? (
                          <button onClick={() => setStatus(s, 'cancelled')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100">
                            <XCircle className="w-3.5 h-3.5" />Cancel
                          </button>
                        ) : (
                          <button onClick={() => setStatus(s, 'new')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100">
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── The events themselves ─────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Community Events</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Pick an event to see who has joined it. Events are created in the CMS.
          </p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {failed && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{failed}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" /></div>
      ) : events.length === 0 && !failed ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <HeartHandshake className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No community events yet</p>
          <p className="text-xs text-gray-400 mt-1">Create one under Content Management → Community Events.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(e => {
            const full = !!e.slots && e.signups.total >= e.slots;
            return (
              <button key={e.id} onClick={() => openEvent(e)}
                className="bg-white rounded-2xl border border-gray-200 p-5 text-left transition hover:shadow-md hover:border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_BADGE[e.status] || 'bg-gray-100 text-gray-600'}`}>
                    {e.status}
                  </span>
                  {!e.is_open && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">Closed</span>
                  )}
                  {full && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">Full</span>
                  )}
                </div>

                <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{e.title}</p>
                <p className="text-xs text-gray-400">{fmtDate(e.date_start)}{e.venue ? ` · ${e.venue}` : ''}</p>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: '#0D9488' }} />
                  <span className="text-sm font-bold text-gray-900">
                    {e.signups.total}{e.slots ? ` / ${e.slots}` : ''}
                  </span>
                  <span className="text-xs text-gray-400">joined</span>
                  {e.signups.confirmed > 0 && (
                    <span className="ml-auto text-[11px] font-semibold" style={{ color: '#16A34A' }}>
                      {e.signups.confirmed} confirmed
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
