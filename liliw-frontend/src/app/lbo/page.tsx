'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, ChevronLeft, Loader2, CheckCircle, AlertCircle,
  Clock, FileText, ArrowRight, RefreshCw, Users, Plus, X,
  Edit, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const FIELDS_TO_CHANGE = [
  'Name / Listing Title',
  'Description',
  'Location / Address',
  'Contact Number',
  'Operating Hours',
  'Entrance Fee / Price',
  'Photos / Images',
  'Other',
];

type Tab = 'requests' | 'visitors';

const CR_STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-blue-50 text-blue-700',
  done:        'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-600',
};

const CR_STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  done:        'Done',
  rejected:    'Rejected',
};

type AppInfo = {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  attraction_name: string;
  business_type: string;
};

type VisitorRow = {
  label: string;
  male_key: string;
  female_key: string;
};

const VISITOR_ROWS: VisitorRow[] = [
  { label: 'Local (Liliw Residents)',    male_key: 'local_male',            female_key: 'local_female' },
  { label: 'Other City (Same Province)', male_key: 'other_city_male',       female_key: 'other_city_female' },
  { label: 'Other Province',             male_key: 'other_province_male',   female_key: 'other_province_female' },
  { label: 'Foreign',                    male_key: 'foreign_male',          female_key: 'foreign_female' },
];

const BLANK_VISITORS = Object.fromEntries(
  VISITOR_ROWS.flatMap(r => [[r.male_key, ''], [r.female_key, '']])
) as Record<string, string>;

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LboDashboard() {
  const { user, token, loading: authLoading } = useAuth();

  const [checking,   setChecking]   = useState(true);
  const [appInfo,    setAppInfo]    = useState<AppInfo | null>(null);
  const [notLbo,     setNotLbo]     = useState(false);

  const [activeTab, setActiveTab]   = useState<Tab>('requests');

  // Change requests
  const [requests,      setRequests]     = useState<any[]>([]);
  const [loadingReqs,   setLoadingReqs]  = useState(true);
  const [showCrForm,    setShowCrForm]   = useState(false);
  const [crForm,        setCrForm]       = useState({ field_to_change: '', current_value: '', requested_value: '', reason: '' });
  const [submittingCr,  setSubmittingCr] = useState(false);
  const [crMsg,         setCrMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  // Visitor records
  const [records,       setRecords]      = useState<any[]>([]);
  const [loadingRecs,   setLoadingRecs]  = useState(true);
  const now = new Date();
  const [vrMonth,       setVrMonth]      = useState(now.getMonth() + 1);
  const [vrYear,        setVrYear]       = useState(now.getFullYear());
  const [vrCounts,      setVrCounts]     = useState<Record<string, string>>(BLANK_VISITORS);
  const [submittingVr,  setSubmittingVr] = useState(false);
  const [vrMsg,         setVrMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  // Verify LBO status on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { setChecking(false); return; }
    fetch('/api/lbo/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.isLbo) setAppInfo(d.application);
        else setNotLbo(true);
      })
      .catch(() => setNotLbo(true))
      .finally(() => setChecking(false));
  }, [authLoading, user, token]);

  // Fetch change requests
  useEffect(() => {
    if (!appInfo || !token) return;
    fetch('/api/lbo/change-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setRequests(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingReqs(false));
  }, [appInfo, token]);

  // Fetch visitor records
  useEffect(() => {
    if (!appInfo || !token) return;
    fetch('/api/lbo/visitor-records', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setRecords(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [appInfo, token]);

  const handleSubmitCr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingCr(true);
    setCrMsg(null);
    try {
      const res = await fetch('/api/lbo/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: appInfo.attraction_name || appInfo.business_name,
          field_to_change: crForm.field_to_change,
          current_value:   crForm.current_value,
          requested_value: crForm.requested_value,
          reason:          crForm.reason,
          lbo_name:        appInfo.owner_name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCrMsg({ ok: true, text: 'Request submitted successfully!' });
        setCrForm({ field_to_change: '', current_value: '', requested_value: '', reason: '' });
        setShowCrForm(false);
        // Refresh list
        fetch('/api/lbo/change-requests', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => setRequests(d.data || []));
      } else {
        setCrMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setCrMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingCr(false);
    setTimeout(() => setCrMsg(null), 4000);
  };

  const handleSubmitVr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingVr(true);
    setVrMsg(null);
    try {
      const res = await fetch('/api/lbo/visitor-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: appInfo.attraction_name || appInfo.business_name,
          month: vrMonth,
          year:  vrYear,
          ...Object.fromEntries(Object.entries(vrCounts).map(([k, v]) => [k, v === '' ? 0 : Number(v)])),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVrMsg({ ok: true, text: `Visitor record for ${MONTHS[vrMonth - 1]} ${vrYear} submitted!` });
        setVrCounts({ ...BLANK_VISITORS });
        fetch('/api/lbo/visitor-records', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => setRecords(d.data || []));
      } else {
        setVrMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setVrMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingVr(false);
    setTimeout(() => setVrMsg(null), 4000);
  };

  /* ─── Loading / auth states ─── */
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--warm-white)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-50">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">LBO Dashboard</h1>
          <p className="text-gray-500 mb-6">Please log in with your Local Business Owner account to access your dashboard.</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0' }}>
            Log In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (notLbo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-amber-50">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Not Granted</h1>
          <p className="text-gray-500 mb-2">Your account ({user.email}) does not have an approved Local Business Owner application.</p>
          <p className="text-sm text-gray-400 mb-6">If you haven't applied yet, submit an application and wait for CHATO approval.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/business/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: '#1565C0' }}>
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <ChevronLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Dashboard ─── */
  const totalVisitors = (r: any) => {
    const a = r.attributes || r;
    return (a.local_male||0)+(a.local_female||0)+(a.other_city_male||0)+(a.other_city_female||0)+(a.other_province_male||0)+(a.other_province_female||0)+(a.foreign_male||0)+(a.foreign_female||0);
  };

  const vrTotal = (male_key: string, female_key: string) => {
    const m = Number(vrCounts[male_key]) || 0;
    const f = Number(vrCounts[female_key]) || 0;
    return m + f;
  };

  const vrGrandTotal = VISITOR_ROWS.reduce((sum, r) => sum + vrTotal(r.male_key, r.female_key), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0B3D91 0%,#1565C0 100%)' }} className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-sm font-semibold mb-4 opacity-80 hover:opacity-100 transition" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Site
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{appInfo!.business_name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{appInfo!.owner_name} · LBO Dashboard</p>
              {appInfo!.attraction_name && (
                <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-100">
                  {appInfo!.attraction_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex">
          {([
            { key: 'requests', label: 'Change Requests', icon: <Edit className="w-4 h-4" />, badge: requests.filter(r => (r.attributes?.status || r.status) === 'pending').length },
            { key: 'visitors', label: 'Visitor Records',  icon: <TrendingUp className="w-4 h-4" />, badge: 0 },
          ] as { key: Tab; label: string; icon: React.ReactNode; badge: number }[]).map(({ key, label, icon, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === key ? 'border-teal-400 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {icon}{label}
              {badge > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── CHANGE REQUESTS ── */}
        {activeTab === 'requests' && (
          <>
            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 flex-wrap justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Change Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5 max-w-lg">Submit a request to update any information about your attraction listing. Our CHATO Editor will review and apply the changes in the system.</p>
              </div>
              <button onClick={() => { setShowCrForm(v => !v); setCrMsg(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
                style={{ backgroundColor: showCrForm ? '#6B7280' : '#1565C0' }}>
                {showCrForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Request</>}
              </button>
            </div>

            {/* New request form */}
            {showCrForm && (
              <form onSubmit={handleSubmitCr} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">New Change Request</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Field to Change <span className="text-red-500">*</span></label>
                  <select required value={crForm.field_to_change} onChange={e => setCrForm(f => ({ ...f, field_to_change: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="" disabled>Select field…</option>
                    {FIELDS_TO_CHANGE.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Value (optional)</label>
                  <textarea value={crForm.current_value} onChange={e => setCrForm(f => ({ ...f, current_value: e.target.value }))} rows={2}
                    placeholder="What does it say now?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Requested Value <span className="text-red-500">*</span></label>
                  <textarea required value={crForm.requested_value} onChange={e => setCrForm(f => ({ ...f, requested_value: e.target.value }))} rows={2}
                    placeholder="What should it say?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason (optional)</label>
                  <textarea value={crForm.reason} onChange={e => setCrForm(f => ({ ...f, reason: e.target.value }))} rows={2}
                    placeholder="Why is this change needed?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                {crMsg && (
                  <div className={`flex items-center gap-2 text-sm font-semibold ${crMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {crMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {crMsg.text}
                  </div>
                )}

                <button type="submit" disabled={submittingCr}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1565C0' }}>
                  {submittingCr ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Request'}
                </button>
              </form>
            )}

            {/* Global crMsg when form is closed */}
            {!showCrForm && crMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${crMsg.ok ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                {crMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {crMsg.text}
              </div>
            )}

            {/* Request list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Your Requests</h2>
                <span className="text-sm text-gray-400">{requests.length} total</span>
              </div>
              {loadingReqs ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <FileText className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-semibold">No requests yet</p>
                  <p className="text-xs mt-1">Use the button above to submit your first change request</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {requests.map(req => {
                    const a = req.attributes || req;
                    const status = a.status || 'pending';
                    return (
                      <div key={req.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">{a.field_to_change}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CR_STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                                {CR_STATUS_LABEL[status] || status}
                              </span>
                            </div>
                            {a.current_value && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1"><span className="font-medium">From:</span> {a.current_value}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2"><span className="font-medium">To:</span> {a.requested_value}</p>
                            {a.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{a.reason}</p>}
                            {a.editor_notes && (
                              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-xs font-semibold text-amber-700">Editor note:</p>
                                <p className="text-xs text-amber-800 mt-0.5">{a.editor_notes}</p>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{(a.created_at || a.createdAt) ? fmt(a.created_at || a.createdAt) : '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── VISITOR RECORDS ── */}
        {activeTab === 'visitors' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900">Visitor Records</h2>
              <p className="text-xs text-gray-400 mt-0.5">Submit monthly visitor counts for your attraction. These are used for tourism statistics reporting.</p>
            </div>

            {/* Submission form */}
            <form onSubmit={handleSubmitVr} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-gray-900 text-sm">Submit Monthly Record</h3>

              {/* Month + Year */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                  <select value={vrMonth} onChange={e => setVrMonth(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                  <input type="number" value={vrYear} onChange={e => setVrYear(Number(e.target.value))} min={2000} max={2100}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              {/* VAR-2 style table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border border-gray-200 min-w-[200px]">Visitor Category</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border border-gray-200 w-28">Male</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border border-gray-200 w-28">Female</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border border-gray-200 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VISITOR_ROWS.map(row => {
                      const rowTotal = vrTotal(row.male_key, row.female_key);
                      return (
                        <tr key={row.label} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-700 border border-gray-200">{row.label}</td>
                          <td className="px-2 py-2 border border-gray-200">
                            <input type="number" min={0}
                              value={vrCounts[row.male_key]}
                              onChange={e => setVrCounts(c => ({ ...c, [row.male_key]: e.target.value }))}
                              placeholder="0"
                              className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                          </td>
                          <td className="px-2 py-2 border border-gray-200">
                            <input type="number" min={0}
                              value={vrCounts[row.female_key]}
                              onChange={e => setVrCounts(c => ({ ...c, [row.female_key]: e.target.value }))}
                              placeholder="0"
                              className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900 border border-gray-200 bg-gray-50">{rowTotal}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3 font-bold text-blue-900 border border-gray-200">Grand Total</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 border border-gray-200">
                        {VISITOR_ROWS.reduce((s, r) => s + (Number(vrCounts[r.male_key]) || 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 border border-gray-200">
                        {VISITOR_ROWS.reduce((s, r) => s + (Number(vrCounts[r.female_key]) || 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 border border-gray-200">{vrGrandTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {vrMsg && (
                <div className={`flex items-center gap-2 text-sm font-semibold ${vrMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {vrMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {vrMsg.text}
                </div>
              )}

              <button type="submit" disabled={submittingVr}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                {submittingVr ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><RefreshCw className="w-4 h-4" /> Submit Record</>}
              </button>
            </form>

            {/* Past records */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Past Submissions</h2>
                <span className="text-sm text-gray-400">{records.length} total</span>
              </div>
              {loadingRecs ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <Users className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-semibold">No records submitted yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Period</th>
                        <th className="px-5 py-3 text-center">Local</th>
                        <th className="px-5 py-3 text-center">Other City</th>
                        <th className="px-5 py-3 text-center">Other Province</th>
                        <th className="px-5 py-3 text-center">Foreign</th>
                        <th className="px-5 py-3 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map(rec => {
                        const a = rec.attributes || rec;
                        const total = totalVisitors(rec);
                        return (
                          <tr key={rec.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4 font-semibold text-gray-900">
                              {MONTHS[(a.month || 1) - 1]} {a.year}
                            </td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.local_male||0)+(a.local_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.other_city_male||0)+(a.other_city_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.other_province_male||0)+(a.other_province_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.foreign_male||0)+(a.foreign_female||0)}</td>
                            <td className="px-5 py-4 text-center font-bold text-gray-900">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
