'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle, AlertCircle, ClipboardList, Eye, X } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface PendingEntry {
  id: string;
  title: string;
  content_type: string;
  created_by: string;
  created_at: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  attractions:   'Attraction',
  events:        'Event',
  news:          'News',
  'art-forms':   'Art Form',
  artisans:      'Artisan',
  stories:       'Story',
};

const TYPE_COLORS: Record<string, string> = {
  attractions:   '#F59E0B',
  events:        '#3B82F6',
  news:          '#8B5CF6',
  'art-forms':   '#EC4899',
  artisans:      '#10B981',
  stories:       '#F97316',
};

interface Props { token: string | null; }

export default function ContentApprovalsTab({ token }: Props) {
  const [entries, setEntries]     = useState<PendingEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [rejectModal, setRejectModal] = useState<PendingEntry | null>(null);
  const [remarks, setRemarks]     = useState('');
  const [saving, setSaving]       = useState<string | null>(null);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/cms/pending', { headers: h }).catch(() => null);
    const d = res ? await res.json() : {};
    setEntries(d.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const approve = async (entry: PendingEntry) => {
    setSaving(entry.id);
    setMsg(null);
    const res = await fetch(`/api/cms/${entry.content_type}/${entry.id}/approve`, {
      method: 'POST', headers: h,
    });
    if (res.ok) {
      setMsg({ ok: true, text: `"${entry.title}" approved and published.` });
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    } else {
      const d = await res.json();
      setMsg({ ok: false, text: d.error || 'Failed to approve' });
    }
    setSaving(null);
    setTimeout(() => setMsg(null), 4000);
  };

  const openReject = (entry: PendingEntry) => {
    setRejectModal(entry);
    setRemarks('');
    setMsg(null);
  };

  const confirmReject = async () => {
    if (!rejectModal || !remarks.trim()) return;
    setSaving(rejectModal.id);
    const res = await fetch(`/api/cms/${rejectModal.content_type}/${rejectModal.id}/reject`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ remarks: remarks.trim() }),
    });
    if (res.ok) {
      setMsg({ ok: true, text: `"${rejectModal.title}" rejected with remarks.` });
      setEntries(prev => prev.filter(e => e.id !== rejectModal.id));
      setRejectModal(null);
    } else {
      const d = await res.json();
      setMsg({ ok: false, text: d.error || 'Failed to reject' });
    }
    setSaving(null);
    setTimeout(() => setMsg(null), 4000);
  };

  const types = ['all', ...Object.keys(TYPE_LABELS)];
  const filtered = typeFilter === 'all' ? entries : entries.filter(e => e.content_type === typeFilter);

  // Group by content type
  const grouped = filtered.reduce<Record<string, PendingEntry[]>>((acc, e) => {
    if (!acc[e.content_type]) acc[e.content_type] = [];
    acc[e.content_type].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Content Approvals</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${entries.length} item${entries.length !== 1 ? 's' : ''} waiting for review`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition capitalize ${typeFilter === t ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={typeFilter === t ? { backgroundColor: '#00BFB3' } : {}}>
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
              {t !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({entries.filter(e => e.content_type === t).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Global message */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {msg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center py-20 text-gray-400">
          <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold text-sm">No pending items</p>
          <p className="text-xs mt-1">All content is up to date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100"
                style={{ backgroundColor: `${TYPE_COLORS[type]}10` }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[type] }} />
                <h3 className="font-bold text-sm text-gray-800">{TYPE_LABELS[type]}</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400">{items.length} pending</span>
              </div>

              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Submitted by</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{entry.title}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{entry.created_by}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={entry.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(entry)}
                            disabled={saving === entry.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition disabled:opacity-50">
                            {saving === entry.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => openReject(entry)}
                            disabled={saving === entry.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                            <AlertCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Reject Entry</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Rejecting <span className="font-semibold text-gray-900">"{rejectModal.title}"</span>.
                The editor will see your remarks and can revise and resubmit.
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                  Remarks <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Explain what needs to be changed…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!remarks.trim() || saving === rejectModal.id}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60">
                {saving === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
