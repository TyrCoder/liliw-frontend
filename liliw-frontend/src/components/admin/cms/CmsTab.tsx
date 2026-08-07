'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Loader2, Plus, Edit2, Trash2, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import RichTextEditor from './RichTextEditor';
import MediaUploader, { MediaItem } from './MediaUploader';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import RejectModal from './RejectModal';

// One template for every CMS content type.
//
// Each content tab was previously its own ~250-line file that differed only in
// field names, table columns and the API slug — the list/filter/draft-autosave/
// submit/approve/reject/delete logic and all the markup were copy-pasted. This
// component owns that shared behaviour once; a tab is now just a config object.
// The slug must match a key in CMS_TABLES (src/lib/cms-auth.ts), which is what
// the API routes use to resolve the backing table.

const STATUS_LABELS: Record<string, string> = {
  all: 'All', draft: 'Draft', pending: 'Pending Review', approved: 'Published', rejected: 'Rejected',
};

export type CmsFieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'richtext' | 'media'
  | 'datetime' | 'checkbox';

export interface CmsField {
  /**
   * Column name. May be dotted to reach inside a JSON column — artisans keep
   * their links in `social_media`, so 'social_media.facebook' edits that key
   * without disturbing the others alongside it.
   */
  name: string;
  label: string;
  type: CmsFieldType;
  /** Blocks Save until filled. Also drives the `*` in the label. */
  required?: boolean;
  /** `select` only. */
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** `textarea` only. */
  rows?: number;
  /** `media` only — a cover image wants exactly one. */
  maxFiles?: number;
  /** Full-width (2) or half-width (1) within the form's two-column grid. */
  colSpan?: 1 | 2;
}

/** Reads a possibly-dotted field name off the record being edited. */
const readField = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined),
    obj,
  );

/** Writes a possibly-dotted field name, cloning each level on the way down. */
function writeField<T extends object>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  const child = (obj as Record<string, unknown>)[head];
  return {
    ...obj,
    [head]: writeField((child && typeof child === 'object' ? child : {}) as object, rest.join('.'), value),
  };
}

export interface CmsColumn<T> {
  header: string;
  render: (entry: T) => ReactNode;
  /** The name column — rejection remarks are shown beneath it. */
  primary?: boolean;
}

/**
 * The Status column. Include it in `columns` wherever the tab wants it —
 * tabs differ on whether Status sits before or after their own columns.
 */
export const statusColumn = <T extends { status: string }>(): CmsColumn<T> => ({
  header: 'Status',
  render: e => <StatusBadge status={e.status} />,
});

export interface CmsTabConfig<T> {
  /** API slug, e.g. 'faqs' → /api/cms/faqs. Must match a CMS_TABLES key. */
  slug: string;
  /** Plural heading, e.g. 'FAQs'. */
  title: string;
  subtitle: string;
  /** Singular, used in buttons/modal titles/confirms, e.g. 'FAQ'. */
  entityLabel: string;
  emptyIcon: ReactNode;
  emptyText: string;
  /** Blank record used when creating. */
  empty: Record<string, unknown>;
  fields: CmsField[];
  columns: CmsColumn<T>[];
}

interface BaseEntry {
  id: string;
  status: string;
  reject_remarks: string | null;
  created_at: string;
  media?: MediaItem[];
}

interface Props<T> {
  config: CmsTabConfig<T>;
  token: string | null;
  userEmail: string;
  isOfficer: boolean;
  isAdmin: boolean;
}

export default function CmsTab<T extends BaseEntry>({ config, token, userEmail, isOfficer, isAdmin }: Props<T>) {
  const { slug, fields, columns } = config;
  const hasMedia = fields.some(f => f.type === 'media');

  const [entries, setEntries]   = useState<T[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Partial<T> | null>(null);
  const [media, setMedia]       = useState<MediaItem[]>([]);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const h: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const withMedia = (body: Record<string, unknown>) => (hasMedia ? { ...body, media } : body);

  const autoSaveStatus = useAutoSaveDraft(
    editing?.id,
    JSON.stringify(hasMedia ? { editing, media } : editing),
    async () => {
      if (!editing?.id) return;
      await fetch(`/api/cms/${slug}/${editing.id}`, {
        method: 'PUT', headers: h, body: JSON.stringify(withMedia({ ...editing, created_by: userEmail })),
      });
    },
    // Never auto-save something live or awaiting review: the PUT resets status
    // to draft, which would quietly pull it off the public site.
    (editing as { status?: string } | null)?.status !== 'approved'
      && (editing as { status?: string } | null)?.status !== 'pending',
  );

  const load = async (status?: string) => {
    setLoading(true);
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    const res = await fetch(`/api/cms/${slug}${qs}`, { headers: h }).catch(() => null);
    const d = res ? await res.json() : {};
    if (res && !res.ok) setMsg({ ok: false, text: d.error || `Could not load (${res.status}).` });
    setEntries(d.data || []);
    setLoading(false);
  };

  /**
   * Approve, submit, reject and delete were fire-and-forget: the response was
   * dropped and the list reloaded regardless. A 403 (an editor pressing
   * Approve) or a 409 (approving something not pending, deleting something
   * under review) therefore looked exactly like a button that does nothing.
   */
  const act = async (url: string, init: RequestInit, failure: string) => {
    const res = await fetch(url, init).catch(() => null);
    if (!res) { setMsg({ ok: false, text: `${failure}: no response from the server.` }); return false; }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg({ ok: false, text: d.error || `${failure} (${res.status}).` });
      return false;
    }
    return true;
  };

  // `load` is recreated every render; depending on it would refetch in a loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const openCreate = () => { setEditing({ ...config.empty } as Partial<T>); setMedia([]); setMsg(null); };
  const openEdit = (e: T) => { setEditing({ ...e }); setMedia(e.media || []); setMsg(null); };
  const closeForm = () => { setEditing(null); setMsg(null); };

  const save = async () => {
    if (!editing) return;
    setSaving(true); setMsg(null);
    const isNew = !editing.id;
    const url = isNew ? `/api/cms/${slug}` : `/api/cms/${slug}/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT', headers: h,
      body: JSON.stringify(withMedia({ ...editing, created_by: userEmail })),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ ok: true, text: isNew ? `${config.entityLabel} created.` : `${config.entityLabel} saved.` });
      load(statusFilter);
      setTimeout(closeForm, 1200);
    } else {
      setMsg({ ok: false, text: d.error || 'Save failed' });
    }
    setSaving(false);
  };

  const submit = async (id: string) => {
    setMsg(null);
    if (await act(`/api/cms/${slug}/${id}/submit`, { method: 'POST', headers: h }, 'Could not submit for review')) {
      setMsg({ ok: true, text: 'Sent for review.' });
    }
    load(statusFilter);
  };

  const approve = async (id: string) => {
    setMsg(null);
    if (await act(`/api/cms/${slug}/${id}/approve`, { method: 'POST', headers: h }, 'Could not approve')) {
      setMsg({ ok: true, text: 'Published — it is now live on the site.' });
    }
    load(statusFilter);
  };

  const reject = (id: string) => { setRejectTarget(id); setRejectRemarks(''); };

  const confirmReject = async () => {
    if (!rejectTarget || !rejectRemarks.trim()) return;
    setRejecting(true);
    setMsg(null);
    const ok = await act(
      `/api/cms/${slug}/${rejectTarget}/reject`,
      { method: 'POST', headers: h, body: JSON.stringify({ remarks: rejectRemarks }) },
      'Could not reject',
    );
    if (ok) setMsg({ ok: true, text: 'Sent back to the author.' });
    setRejecting(false); setRejectTarget(null); setRejectRemarks('');
    load(statusFilter);
  };

  const del = async (id: string) => {
    if (!confirm(`Delete this ${config.entityLabel.toLowerCase()}?`)) return;
    setDeleting(id);
    setMsg(null);
    if (await act(`/api/cms/${slug}/${id}`, { method: 'DELETE', headers: h }, 'Could not delete')) {
      setMsg({ ok: true, text: `${config.entityLabel} deleted.` });
    }
    setDeleting(null);
    load(statusFilter);
  };

  const canEdit = !isOfficer || isAdmin;

  const setField = (name: string, value: unknown) =>
    setEditing(p => writeField((p ?? {}) as object, name, value) as Partial<T>);

  const val = (name: string) => (editing ? readField(editing, name) : undefined);

  // Save is blocked until every required field has a non-empty value.
  const missingRequired = fields.some(f => {
    if (!f.required) return false;
    const v = val(f.name);
    return typeof v === 'string' ? !v.trim() : v === undefined || v === null;
  });

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

  const renderField = (f: CmsField) => {
    switch (f.type) {
      case 'textarea':
        return <textarea rows={f.rows ?? 3} value={(val(f.name) as string) || ''} placeholder={f.placeholder}
          onChange={e => setField(f.name, e.target.value)} className={`${inputCls} resize-none`} />;
      case 'number':
        return <input type="number" value={(val(f.name) as number) ?? ''} placeholder={f.placeholder}
          onChange={e => setField(f.name, e.target.value === '' ? null : Number(e.target.value))} className={inputCls} />;
      case 'select':
        // Fall back to the first option so a record with an empty value still
        // shows something valid rather than a blank select.
        return (
          <select value={(val(f.name) as string) || f.options?.[0]?.value || ''}
            onChange={e => setField(f.name, e.target.value)}
            className={`${inputCls} bg-white`}>
            {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'richtext':
        return <RichTextEditor value={(val(f.name) as string) || ''} onChange={v => setField(f.name, v)} placeholder={f.placeholder} />;
      case 'datetime':
        // The column stores a full ISO timestamp; the input wants it trimmed
        // to the minute, and gives it back without a zone.
        return <input type="datetime-local" className={inputCls}
          value={((val(f.name) as string) || '').slice(0, 16)}
          onChange={e => setField(f.name, e.target.value || null)} />;
      case 'checkbox':
        return (
          <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
            <input type="checkbox" className="w-4 h-4 rounded accent-blue-600"
              checked={!!val(f.name)}
              onChange={e => setField(f.name, e.target.checked)} />
            <span className="text-sm text-gray-700 font-medium">{f.label}</span>
          </label>
        );
      case 'media':
        return <MediaUploader value={media} onChange={setMedia} maxFiles={f.maxFiles} />;
      default:
        return <input value={(val(f.name) as string) || ''} placeholder={f.placeholder}
          onChange={e => setField(f.name, e.target.value)} className={inputCls} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{config.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'draft', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={statusFilter === s ? { backgroundColor: '#1565C0' } : {}}>
              {STATUS_LABELS[s]}
            </button>
          ))}
          {canEdit && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#1565C0' }}>
              <Plus className="w-4 h-4" /> New {config.entityLabel}
            </button>
          )}
        </div>
      </div>

      {/* Result of a list action. The only place `msg` used to render was the
          edit form footer, so anything reported by approve, submit, reject or
          delete — which all run from this list, with no form open — was set
          and then never shown. */}
      {editing === null && msg && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
          msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {msg.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="flex-1 min-w-0">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            {config.emptyIcon}
            <p className="font-semibold text-sm">{config.emptyText}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {columns.map(c => <th key={c.header} className="px-5 py-3 text-left">{c.header}</th>)}
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map(c => (
                      <td key={c.header} className="px-5 py-4">
                        {c.render(e)}
                        {c.primary && e.reject_remarks && (
                          <p className="text-xs text-red-500 mt-0.5">Rejected: {e.reject_remarks}</p>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canEdit && ['draft', 'rejected', 'approved'].includes(e.status) && (
                          <button onClick={() => openEdit(e)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {canEdit && ['draft', 'rejected'].includes(e.status) && (
                          <button onClick={() => submit(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition">
                            <Send className="w-3 h-3" /> Submit
                          </button>
                        )}
                        {(isOfficer || isAdmin) && e.status === 'pending' && (
                          <>
                            <button onClick={() => approve(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition">
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => reject(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                              <AlertCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {canEdit && ['draft', 'rejected', 'approved'].includes(e.status) && (
                          <button onClick={() => del(e.id)} disabled={deleting === e.id} className="p-1 rounded-lg text-gray-300 hover:text-red-500 transition disabled:opacity-50">
                            {deleting === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 py-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing.id ? `Edit ${config.entityLabel}` : `New ${config.entityLabel}`}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {/* Single column on phones — half-width fields like lat/lng were
                  ~140px wide side by side on a narrow screen. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(f => (
                  <div key={f.name} className={(f.colSpan ?? 2) === 2 ? 'sm:col-span-2' : ''}>
                    {/* A checkbox reads better with its label beside it, and
                        renders its own, so it skips the heading above. */}
                    {f.type !== 'checkbox' && (
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        {f.label}{f.required ? ' *' : ''}
                      </label>
                    )}
                    {renderField(f)}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {msg && (
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {msg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}
                  </span>
                )}
                {autoSaveStatus === 'saving' && <span className="flex items-center gap-1 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" /> Saving draft…</span>}
                {autoSaveStatus === 'saved'  && <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> Draft saved</span>}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                <button onClick={save} disabled={saving || missingRequired}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{ backgroundColor: '#1565C0' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RejectModal
        open={rejectTarget !== null}
        remarks={rejectRemarks}
        onChangeRemarks={setRejectRemarks}
        onConfirm={confirmReject}
        onCancel={() => { setRejectTarget(null); setRejectRemarks(''); }}
        loading={rejecting}
      />
    </div>
  );
}
