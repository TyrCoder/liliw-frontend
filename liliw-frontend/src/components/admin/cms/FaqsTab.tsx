'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit2, Trash2, Send, CheckCircle, AlertCircle, X, HelpCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const STATUS_LABELS: Record<string, string> = { all: 'All', draft: 'Draft', pending: 'Pending Review', approved: 'Published', rejected: 'Rejected' };

interface Entry {
  id: string; question: string; answer: string; category: string;
  sort_order: number; status: string; created_by: string;
  reject_remarks: string | null; created_at: string;
}

const EMPTY: Omit<Entry, 'id' | 'created_at' | 'status' | 'created_by'> = {
  question: '', answer: '', category: '', sort_order: 0, reject_remarks: null,
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function FaqsTab({ token, userEmail, isOfficer, isAdmin }: Props) {
  const [entries, setEntries]   = useState<Entry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Partial<Entry> | null>(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const h: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const autoSaveStatus = useAutoSaveDraft(
    editing?.id,
    JSON.stringify(editing),
    async () => {
      if (!editing?.id) return;
      await fetch(`/api/cms/faqs/${editing.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ ...editing, created_by: userEmail }) });
    }
  );

  const load = async (status?: string) => {
    setLoading(true);
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    const res = await fetch(`/api/cms/faqs${qs}`, { headers: h }).catch(() => null);
    const d = res ? await res.json() : {};
    setEntries(d.data || []);
    setLoading(false);
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const openCreate = () => { setEditing({ ...EMPTY }); setMsg(null); };
  const openEdit = (e: Entry) => { setEditing({ ...e }); setMsg(null); };
  const closeForm = () => { setEditing(null); setMsg(null); };

  const save = async () => {
    if (!editing) return;
    setSaving(true); setMsg(null);
    const isNew = !editing.id;
    const body = { ...editing, created_by: userEmail };
    const url = isNew ? '/api/cms/faqs' : `/api/cms/faqs/${editing.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: h, body: JSON.stringify(body) });
    const d = await res.json();
    if (res.ok) { setMsg({ ok: true, text: isNew ? 'FAQ created.' : 'FAQ saved.' }); load(statusFilter); setTimeout(closeForm, 1200); }
    else setMsg({ ok: false, text: d.error || 'Save failed' });
    setSaving(false);
  };

  const submit = async (id: string) => { await fetch(`/api/cms/faqs/${id}/submit`, { method: 'POST', headers: h }); load(statusFilter); };
  const approve = async (id: string) => { await fetch(`/api/cms/faqs/${id}/approve`, { method: 'POST', headers: h }); load(statusFilter); };
  const reject = async (id: string) => {
    const remarks = prompt('Rejection remarks (required):');
    if (!remarks?.trim()) return;
    await fetch(`/api/cms/faqs/${id}/reject`, { method: 'POST', headers: h, body: JSON.stringify({ remarks }) });
    load(statusFilter);
  };
  const del = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    setDeleting(id);
    await fetch(`/api/cms/faqs/${id}`, { method: 'DELETE', headers: h });
    setDeleting(null); load(statusFilter);
  };

  const canEdit = !isOfficer || isAdmin;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">FAQs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Frequently asked questions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all','draft','pending','approved','rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={statusFilter === s ? { backgroundColor: '#00BFB3' } : {}}>{STATUS_LABELS[s]}</button>
          ))}
          {canEdit && (
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#00BFB3' }}>
              <Plus className="w-4 h-4" /> New FAQ
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><HelpCircle className="w-10 h-10 mb-3 opacity-20" /><p className="font-semibold text-sm">No FAQs yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Question</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 max-w-[300px] truncate">{e.question}</p>
                      {e.reject_remarks && <p className="text-xs text-red-500 mt-0.5">Rejected: {e.reject_remarks}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{e.category || '—'}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{e.sort_order}</td>
                    <td className="px-5 py-4"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canEdit && ['draft','rejected'].includes(e.status) && <button onClick={() => openEdit(e)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600 transition"><Edit2 className="w-3 h-3" /> Edit</button>}
                        {canEdit && ['draft','rejected'].includes(e.status) && <button onClick={() => submit(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition"><Send className="w-3 h-3" /> Submit</button>}
                        {(isOfficer || isAdmin) && e.status === 'pending' && <>
                          <button onClick={() => approve(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition"><CheckCircle className="w-3 h-3" /> Approve</button>
                          <button onClick={() => reject(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"><AlertCircle className="w-3 h-3" /> Reject</button>
                        </>}
                        {canEdit && ['draft','rejected'].includes(e.status) && <button onClick={() => del(e.id)} disabled={deleting === e.id} className="p-1 rounded-lg text-gray-300 hover:text-red-500 transition disabled:opacity-50">{deleting === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 py-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing.id ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Question *</label>
                <input value={editing.question || ''} onChange={e => setEditing(p => ({ ...p, question: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="What is…?" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Answer *</label>
                <textarea rows={5} value={editing.answer || ''} onChange={e => setEditing(p => ({ ...p, answer: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Category</label>
                  <input value={editing.category || ''} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="e.g. Travel, Permits" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Sort Order</label>
                  <input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing(p => ({ ...p, sort_order: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {msg && <span className={`flex items-center gap-1.5 text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}</span>}
                {autoSaveStatus === 'saving' && <span className="flex items-center gap-1 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" /> Saving draft…</span>}
                {autoSaveStatus === 'saved'  && <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> Draft saved</span>}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                <button onClick={save} disabled={saving || !editing.question?.trim() || !editing.answer?.trim()} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60" style={{ backgroundColor: '#00BFB3' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
