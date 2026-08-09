'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Mail, Phone, Send, Search, Inbox as InboxIcon, CheckCircle, Archive,
  CornerUpLeft, Clock, AlertTriangle, Loader2, User,
} from 'lucide-react';

export interface InboxReply {
  id: string; body: string; sentBy: string; sentAt: string; delivered: boolean; error: string | null;
}
export interface InboxMessage {
  id: string;
  attributes: {
    name: string; email: string; phone: string; message: string; type: string;
    status: string; createdAt: string;
    handledBy?: string | null; handledAt?: string | null;
    replies?: InboxReply[];
  };
}

const TYPE_BADGE: Record<string, string> = {
  feedback: 'bg-purple-50 text-purple-700', volunteer: 'bg-teal-50 text-teal-700',
  partnership: 'bg-orange-50 text-orange-700', tourism: 'bg-blue-50 text-blue-700',
};
const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700', read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-50 text-green-700', closed: 'bg-gray-100 text-gray-500',
};

type Filter = 'all' | 'new' | 'replied' | 'closed';

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

/**
 * The contact inbox — messages from the public, and the replies to them.
 *
 * Built as a mail client rather than another table because that is what the
 * job actually is: read what someone sent, answer it, and be able to see later
 * that it was answered. The old table could do none of the last two.
 */
export default function Inbox({
  messages, loading, token, onRefresh,
}: {
  messages: InboxMessage[];
  loading: boolean;
  token: string;
  onRefresh: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(m => {
      const a = m.attributes;
      if (filter === 'new' && a.status !== 'new') return false;
      if (filter === 'replied' && a.status !== 'replied') return false;
      if (filter === 'closed' && a.status !== 'closed') return false;
      if (!q) return true;
      return [a.name, a.email, a.message, a.type].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [messages, filter, query]);

  const selected = messages.find(m => m.id === selectedId) ?? null;

  // Opening the first message automatically would mark it read on every visit,
  // so the list starts with nothing selected.
  useEffect(() => {
    if (selectedId && !messages.some(m => m.id === selectedId)) setSelectedId(null);
  }, [messages, selectedId]);

  const patchStatus = async (id: string, status: string, quiet = false) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update the message');
      if (!quiet) toast.success(status === 'closed' ? 'Message closed' : 'Message updated');
      onRefresh();
    } catch (err) {
      // Marking read is a background nicety; failing it loudly would be noise.
      if (!quiet) toast.error(err instanceof Error ? err.message : 'Could not update the message');
    }
  };

  const open = (m: InboxMessage) => {
    setSelectedId(m.id);
    setDraft('');
    setSubject(`Re: your ${m.attributes.type || 'message'} to Liliw Tourism`);
    if (m.attributes.status === 'new') patchStatus(m.id, 'read', true);
  };

  const send = async () => {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selected.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft, subject }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The reply could not be sent');
      toast.success(`Reply sent to ${selected.attributes.email}`);
      setDraft('');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The reply could not be sent');
    } finally {
      setSending(false);
    }
  };

  const unread = messages.filter(m => m.attributes.status === 'new').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ backgroundColor: '#1565C015' }}>
            <InboxIcon className="w-4.5 h-4.5" style={{ color: '#1565C0' }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Inbox</h3>
            <p className="text-xs text-gray-400">
              {messages.length} message{messages.length === 1 ? '' : 's'}
              {unread > 0 && <> · <span className="font-semibold" style={{ color: '#1565C0' }}>{unread} unread</span></>}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages"
            className="pl-9 pr-3 py-2 w-56 max-w-full text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
          {(['all', 'new', 'replied', 'closed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] min-h-[520px]">
        {/* ── Message list ─────────────────────────────────────── */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100 max-h-[620px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading messages…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <InboxIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                {query || filter !== 'all' ? 'Nothing matches that' : 'No messages yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {query || filter !== 'all'
                  ? 'Try a different filter or search.'
                  : 'Messages sent through the contact page arrive here.'}
              </p>
            </div>
          ) : filtered.map(m => {
            const a = m.attributes;
            const isNew = a.status === 'new';
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => open(m)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors ${
                  active ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: isNew ? '#1565C0' : '#E2E8F0', color: isNew ? '#fff' : '#64748B' }}
                  >
                    {initials(a.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${isNew ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {a.name}
                      </p>
                      <span className="ml-auto text-[11px] text-gray-400 shrink-0">{when(a.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5 capitalize">{a.type}</p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isNew ? 'text-gray-600' : 'text-gray-400'}`}>{a.message}</p>
                    {(a.replies?.length ?? 0) > 0 && (
                      <p className="text-[11px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: '#16A34A' }}>
                        <CornerUpLeft className="w-3 h-3" />
                        {a.replies!.length} repl{a.replies!.length === 1 ? 'y' : 'ies'}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Thread + composer ────────────────────────────────── */}
        {!selected ? (
          <div className="hidden lg:grid place-items-center p-12 text-center">
            <div>
              <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Select a message to read it</p>
              <p className="text-xs text-gray-400 mt-1">You can reply here and it will be emailed to the sender.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[620px]">
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{selected.attributes.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    <a href={`mailto:${selected.attributes.email}`} className="flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" />{selected.attributes.email}
                    </a>
                    {selected.attributes.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.attributes.phone}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{when(selected.attributes.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE[selected.attributes.type] || 'bg-gray-100 text-gray-600'}`}>
                    {selected.attributes.type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[selected.attributes.status] || 'bg-gray-100 text-gray-600'}`}>
                    {selected.attributes.status}
                  </span>
                </div>
              </div>
              {selected.attributes.handledBy && (
                <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                  <User className="w-3 h-3" />Handled by {selected.attributes.handledBy}
                </p>
              )}
            </div>

            {/* Thread body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/40">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                  {selected.attributes.name} wrote
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.attributes.message}</p>
              </div>

              {(selected.attributes.replies || []).map(r => (
                <div key={r.id} className="rounded-2xl border p-4 ml-0 sm:ml-8"
                     style={{ backgroundColor: r.delivered ? '#F0FDF4' : '#FEF2F2', borderColor: r.delivered ? '#BBF7D0' : '#FECACA' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                     style={{ color: r.delivered ? '#16A34A' : '#DC2626' }}>
                    {r.delivered ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {r.sentBy} · {when(r.sentAt)}{!r.delivered && ' · not delivered'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                  {!r.delivered && r.error && (
                    <p className="text-xs mt-2" style={{ color: '#DC2626' }}>{r.error}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full mb-2 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <textarea
                ref={composerRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }}
                rows={4}
                placeholder={`Reply to ${selected.attributes.name}…`}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
                <span className="text-[11px] text-gray-400">Ctrl + Enter to send</span>

                {selected.attributes.status !== 'closed' ? (
                  <button
                    onClick={() => patchStatus(selected.id, 'closed')}
                    className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />Close
                  </button>
                ) : (
                  <button
                    onClick={() => patchStatus(selected.id, 'read')}
                    className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />Reopen
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Sent from the tourism office address. The sender&rsquo;s original message is quoted in the email.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
