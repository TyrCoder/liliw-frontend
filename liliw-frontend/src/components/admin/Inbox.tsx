'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Mail, Phone, Send, Search, Inbox as InboxIcon, CheckCircle, Archive,
  CornerUpLeft, Clock, AlertTriangle, Loader2, User, MessageSquare,
  Users, ClipboardList, RefreshCw, Download, CheckCheck,
} from 'lucide-react';

export interface InboxReply {
  id: string; body: string; sentBy: string; sentAt: string; delivered: boolean; error: string | null;
}
export interface InboxMessage {
  id: string;
  source: 'contact' | 'participation' | 'event';
  refId: string;
  name: string; email: string; phone: string;
  type: string; message: string;
  details: { label: string; value: string }[];
  createdAt: string;
  status: string;
  handledBy: string | null; handledAt: string | null;
  replies: InboxReply[];
}

/** The label rail, in the order staff work through them. */
const FOLDERS = [
  { key: 'all',           label: 'All mail',      icon: InboxIcon },
  { key: 'unread',        label: 'Unread',        icon: Mail },
  { key: 'contact',       label: 'Contact form',  icon: MessageSquare },
  { key: 'participation', label: 'Participation', icon: Users },
  { key: 'event',         label: 'Event sign-ups',icon: ClipboardList },
  { key: 'replied',       label: 'Replied',       icon: CheckCircle },
  { key: 'closed',        label: 'Closed',        icon: Archive },
] as const;
type Folder = typeof FOLDERS[number]['key'];

const SOURCE_LABEL: Record<InboxMessage['source'], string> = {
  contact: 'Contact form', participation: 'Participation', event: 'Event sign-up',
};
const SOURCE_COLOR: Record<InboxMessage['source'], string> = {
  contact: '#1565C0', participation: '#0D9488', event: '#8B5CF6',
};
const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700', read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-50 text-green-700', closed: 'bg-gray-100 text-gray-500',
};

function when(iso: string) {
  if (!iso) return '';
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

function csvCell(v: string) {
  return `"${(v ?? '').replace(/"/g, '""')}"`;
}

/**
 * The staff inbox — everything the public sends the office, in one queue.
 *
 * Built as a mail client rather than three tables because that is what the job
 * actually is: read what someone sent, answer it, and be able to see later
 * that it was answered. The three old tabs could do none of the last two.
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
  const [folder, setFolder] = useState<Folder>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const counts = useMemo(() => ({
    all:           messages.length,
    unread:        messages.filter(m => m.status === 'new').length,
    contact:       messages.filter(m => m.source === 'contact').length,
    participation: messages.filter(m => m.source === 'participation').length,
    event:         messages.filter(m => m.source === 'event').length,
    replied:       messages.filter(m => m.status === 'replied').length,
    closed:        messages.filter(m => m.status === 'closed').length,
  }), [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(m => {
      if (folder === 'unread'  && m.status !== 'new')     return false;
      if (folder === 'replied' && m.status !== 'replied') return false;
      if (folder === 'closed'  && m.status !== 'closed')  return false;
      if (['contact', 'participation', 'event'].includes(folder) && m.source !== folder) return false;
      // Closed mail stays out of the main view the way an archive does.
      if (folder === 'all' && m.status === 'closed') return false;
      if (!q) return true;
      return [m.name, m.email, m.message, m.type, ...m.details.map(d => d.value)]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }, [messages, folder, query]);

  const unreadHere = filtered.filter(m => m.status === 'new').length;
  const selected = messages.find(m => m.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && !messages.some(m => m.id === selectedId)) setSelectedId(null);
  }, [messages, selectedId]);

  const patchStatus = async (m: InboxMessage, status: string, quiet = false) => {
    try {
      const res = await fetch(`/api/admin/inbox/${m.source}/${m.refId}`, {
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

  /**
   * Clears the unread flags in one write rather than one request per message.
   *
   * Only the messages currently listed are marked, so a search or a source
   * filter narrows what gets cleared — "mark all read" while looking at three
   * event sign-ups should not silently clear forty contact messages.
   */
  const markAllRead = async () => {
    const unread = filtered.filter(m => m.status === 'new');
    if (!unread.length || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/admin/inbox/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unread.map(m => m.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not mark them read');
      toast.success(`${unread.length} message${unread.length === 1 ? '' : 's'} marked as read`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not mark them read');
    } finally {
      setMarkingAll(false);
    }
  };

  const open = (m: InboxMessage) => {
    setSelectedId(m.id);
    setDraft('');
    setSubject(`Re: your ${m.type} to Liliw Tourism`);
    if (m.status === 'new') patchStatus(m, 'read', true);
  };

  const send = async () => {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/inbox/${selected.source}/${selected.refId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft, subject }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The reply could not be sent');
      toast.success(`Reply sent to ${selected.email}`);
      setDraft('');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The reply could not be sent');
    } finally {
      setSending(false);
    }
  };

  // Kept from the old Event Responses tab, which existed mainly to export.
  const exportCsv = () => {
    const rows = [
      ['Received', 'Source', 'Type', 'Name', 'Email', 'Phone', 'Status', 'Message'],
      ...filtered.map(m => [
        m.createdAt, SOURCE_LABEL[m.source], m.type, m.name, m.email, m.phone, m.status,
        m.message || m.details.map(d => `${d.label}: ${d.value}`).join(' | '),
      ]),
    ];
    const blob = new Blob([rows.map(r => r.map(c => csvCell(String(c))).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inbox-${folder}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ backgroundColor: '#1565C015' }}>
            <InboxIcon className="w-4 h-4" style={{ color: '#1565C0' }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Inbox</h3>
            <p className="text-xs text-gray-400">
              Contact, participation and event sign-ups
              {counts.unread > 0 && <> · <span className="font-semibold" style={{ color: '#1565C0' }}>{counts.unread} unread</span></>}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search mail"
            className="pl-9 pr-3 py-2 w-56 max-w-full text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
        <button onClick={exportCsv} disabled={!filtered.length}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          <Download className="w-3.5 h-3.5" />Export
        </button>
        <button onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-[190px_320px_1fr]">
        {/* ── Label rail ─────────────────────────────────────── */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100 p-2.5 bg-gray-50/50">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {FOLDERS.map(f => {
              const Icon = f.icon;
              const active = folder === f.key;
              const n = counts[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setFolder(f.key)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                    active ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-500 hover:bg-white/70 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" style={active ? { color: '#1565C0' } : undefined} />
                  <span className="truncate">{f.label}</span>
                  {n > 0 && (
                    <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                      f.key === 'unread' ? 'text-white' : 'text-gray-500 bg-gray-100'
                    }`} style={f.key === 'unread' ? { backgroundColor: '#1565C0' } : undefined}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Message list ───────────────────────────────────── */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100 max-h-[640px] overflow-y-auto">
          {/* Sits above the list rather than in the toolbar so it reads as an
              action on what is listed, which is exactly what it does. */}
          {unreadHere > 0 && (
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm border-b border-blue-100">
              <span className="text-xs font-semibold" style={{ color: '#1565C0' }}>
                {unreadHere} unread{folder !== 'all' && folder !== 'unread' ? ' here' : ''}
              </span>
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#1565C0' }}
              >
                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Mark all read
              </button>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading mail…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <InboxIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                {query ? 'Nothing matches that' : 'Nothing here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {query
                  ? 'Try a different search or folder.'
                  : folder === 'event'
                    ? 'Event sign-up responses will appear here.'
                    : 'Messages sent through the website arrive here.'}
              </p>
            </div>
          ) : filtered.map(m => {
            const isNew = m.status === 'new';
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
                    style={{ backgroundColor: isNew ? SOURCE_COLOR[m.source] : '#E2E8F0', color: isNew ? '#fff' : '#64748B' }}
                  >
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${isNew ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {m.name}
                      </p>
                      <span className="ml-auto text-[11px] text-gray-400 shrink-0">{when(m.createdAt)}</span>
                    </div>
                    <p className="text-[11px] font-semibold mt-0.5 truncate" style={{ color: SOURCE_COLOR[m.source] }}>
                      {SOURCE_LABEL[m.source]} · <span className="text-gray-400 capitalize font-medium">{m.type}</span>
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isNew ? 'text-gray-600' : 'text-gray-400'}`}>
                      {m.message || m.details.map(d => `${d.label}: ${d.value}`).join(' · ') || 'No message'}
                    </p>
                    {m.replies.length > 0 && (
                      <p className="text-[11px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: '#16A34A' }}>
                        <CornerUpLeft className="w-3 h-3" />
                        {m.replies.length} repl{m.replies.length === 1 ? 'y' : 'ies'}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Thread + composer ──────────────────────────────── */}
        {!selected ? (
          <div className="hidden lg:grid place-items-center p-12 text-center">
            <div>
              <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Select a message to read it</p>
              <p className="text-xs text-gray-400 mt-1">Replies are emailed to the sender from the office address.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[640px]">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{selected.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    {selected.email && (
                      <a href={`mailto:${selected.email}`} className="flex items-center gap-1 hover:underline">
                        <Mail className="w-3 h-3" />{selected.email}
                      </a>
                    )}
                    {selected.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{when(selected.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${SOURCE_COLOR[selected.source]}15`, color: SOURCE_COLOR[selected.source] }}>
                    {SOURCE_LABEL[selected.source]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              {selected.handledBy && (
                <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                  <User className="w-3 h-3" />Handled by {selected.handledBy}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/40">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                  {selected.name} · {selected.type}
                </p>
                {selected.message && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                )}
                {/* An event response is a filled-in form, so it reads as one. */}
                {selected.details.length > 0 && (
                  <dl className="mt-2 space-y-2.5">
                    {selected.details.map(d => (
                      <div key={d.label}>
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{d.label}</dt>
                        <dd className="text-sm text-gray-700 mt-0.5">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {!selected.message && selected.details.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No message body.</p>
                )}
              </div>

              {selected.replies.map(r => (
                <div key={r.id} className="rounded-2xl border p-4 ml-0 sm:ml-8"
                     style={{ backgroundColor: r.delivered ? '#F0FDF4' : '#FEF2F2', borderColor: r.delivered ? '#BBF7D0' : '#FECACA' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                     style={{ color: r.delivered ? '#16A34A' : '#DC2626' }}>
                    {r.delivered ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {r.sentBy} · {when(r.sentAt)}{!r.delivered && ' · not delivered'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                  {!r.delivered && r.error && <p className="text-xs mt-2" style={{ color: '#DC2626' }}>{r.error}</p>}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4 bg-white">
              {!selected.email ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  This message has no email address, so it cannot be replied to here.
                </p>
              ) : (
                <>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full mb-2 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }}
                    rows={4}
                    placeholder={`Reply to ${selected.name}…`}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {selected.email && (
                  <>
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
                  </>
                )}
                {selected.status !== 'closed' ? (
                  <button onClick={() => patchStatus(selected, 'closed')}
                    className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Archive className="w-3.5 h-3.5" />Close
                  </button>
                ) : (
                  <button onClick={() => patchStatus(selected, 'read')}
                    className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <CornerUpLeft className="w-3.5 h-3.5" />Reopen
                  </button>
                )}
              </div>
              {selected.email && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Sent from the tourism office address, with their original message quoted underneath.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
