'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Eye, TrendingUp, ExternalLink,
  FileText, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronLeft, Mail, Phone, Calendar, MessageSquare, Star,
  RefreshCw, UserCheck, Shield, Activity, MapPin, Edit, Layers,
  Monitor, Smartphone, Tablet, Wifi, Search,
  Building2, X, ChevronDown, ChevronUp, Key, Inbox,
  Download, BarChart2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';

const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

/* ─── types ──────────────────────────────────────────────── */
interface Submission { id: any; attributes: { name: string; email: string; phone: string; message: string; type: string; status: string; createdAt: string }; }
interface EventSignup { id: any; attributes: { full_name: string; email: string; phone: string; notes: string; username: string; status: string; createdAt: string; event: { data: { id: number; attributes: { title: string; date_start: string } } } }; }
interface Analytics { pageViews: number; uniqueVisitors: number; avgSessionTime: string; bounceRate: string; topPages: { path: string; views: number }[]; devices?: { desktop: { count: number; pct: number }; mobile: { count: number; pct: number }; tablet: { count: number; pct: number } }; }
interface AuditLog { id: string; event: string; model: string; uid?: string; entry_id: string; entry_title: string; performed_by?: string; changes?: any; created_at: string; }
interface Participation { id: string; full_name: string; email: string; phone?: string; type?: string; message?: string; created_at: string; }
interface Attraction { id: string; strapiId: string; type: 'heritage' | 'spot' | 'dining'; attributes: { name: string; location?: string; category?: string; rating?: number; photos?: any[]; coordinates?: { latitude?: number; longitude?: number; lat?: number; lng?: number } }; }

type Tab = 'overview' | 'users' | 'roles' | 'lbo' | 'changerequests' | 'visitorrecords' | 'attractionrequests' | 'submissions' | 'participation' | 'signups' | 'attractions' | 'ratings' | 'audit' | 'reports' | 'externalreviews';

/* ─── csv export ──────────────────────────────────────────── */
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── helpers ─────────────────────────────────────────────── */
const STATUS_BADGE: Record<string, string> = { new: 'bg-blue-50 text-blue-700', reviewed: 'bg-yellow-50 text-yellow-700', resolved: 'bg-green-50 text-green-700' };
const TYPE_BADGE: Record<string, string> = { feedback: 'bg-purple-50 text-purple-700', volunteer: 'bg-teal-50 text-teal-700', partnership: 'bg-orange-50 text-orange-700' };

const EVENT_COLOR: Record<string, string> = {
  'entry.create':    'bg-green-50 text-green-700',
  'entry.update':    'bg-blue-50 text-blue-700',
  'entry.delete':    'bg-red-50 text-red-700',
  'entry.publish':   'bg-teal-50 text-teal-700',
  'entry.unpublish': 'bg-yellow-50 text-yellow-700',
};

const TYPE_STRAPI_UID: Record<string, string> = {
  heritage: 'api::heritage-site.heritage-site',
  spot:     'api::tourist-spot.tourist-spot',
  dining:   'api::dining-and-food.dining-and-food',
};
const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage', spot: 'Spot', dining: 'Dining' };
const TYPE_COLORS: Record<string, string> = { heritage: '#F59E0B', spot: '#3B82F6', dining: '#EF4444' };

function strapiEditUrl(type: string, strapiId: string) {
  return `${STRAPI_URL}/admin/content-manager/collection-types/${TYPE_STRAPI_UID[type]}/${strapiId}`;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── sub-components ──────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}

function TableWrap({ title, count, loading, empty, emptyIcon, children }: { title: string; count: number; loading: boolean; empty: boolean; emptyIcon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400">{count} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
      ) : empty ? (
        <div className="flex flex-col items-center py-16 text-center text-gray-400">
          <div className="opacity-20 mb-3">{emptyIcon}</div>
          <p className="font-semibold">No records yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, loading, isAdmin, isChatoOfficer, isChatoEditor, isStaff, token } = useAuth();
  const router = useRouter();

  const [submissions,   setSubmissions]   = useState<Submission[]>([]);
  const [participation, setParticipation] = useState<Participation[]>([]);
  const [signups,       setSignups]       = useState<EventSignup[]>([]);
  const [analytics,     setAnalytics]     = useState<Analytics | null>(null);
  const [reviews,       setReviews]       = useState<any[]>([]);
  const [users,         setUsers]         = useState<any[]>([]);
  const [attractions,   setAttractions]   = useState<Attraction[]>([]);
  const [auditLogs,     setAuditLogs]     = useState<AuditLog[]>([]);
  const [liveVisitors,  setLiveVisitors]  = useState<{ session_id: string; page: string; device: string; last_seen: string }[]>([]);

  const [loadingSubs,   setLoadingSubs]   = useState(true);
  const [loadingPart,   setLoadingPart]   = useState(true);
  const [loadingSignups,setLoadingSignups]= useState(true);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingReviews,setLoadingReviews]= useState(true);
  const [loadingUsers,  setLoadingUsers]  = useState(true);
  const [loadingAttr,   setLoadingAttr]   = useState(true);
  const [loadingAudit,  setLoadingAudit]  = useState(true);

  const [roleUsers,     setRoleUsers]     = useState<any[]>([]);
  const [availRoles,    setAvailRoles]    = useState<any[]>([]);
  const [loadingRoles,  setLoadingRoles]  = useState(true);
  const [savingRole,    setSavingRole]    = useState<number | null>(null);
  const [roleMsg,       setRoleMsg]       = useState<{ id: number; ok: boolean; text: string } | null>(null);
  const [pwdModal,      setPwdModal]      = useState<{ id: number; email: string } | null>(null);
  const [pwdInput,      setPwdInput]      = useState('');
  const [savingPwd,     setSavingPwd]     = useState(false);
  const [pwdMsg,        setPwdMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  const [lboApps,       setLboApps]       = useState<any[]>([]);
  const [loadingLbo,    setLoadingLbo]    = useState(true);
  const [expandedLbo,   setExpandedLbo]   = useState<number | null>(null);
  const [lboRegModal,      setLboRegModal]      = useState<any | null>(null);
  const [lboRegForm,       setLboRegForm]       = useState({ username: '', password: '' });
  const [savingLboReg,     setSavingLboReg]     = useState(false);
  const [lboRegMsg,        setLboRegMsg]        = useState<{ ok: boolean; text: string } | null>(null);
  const [pickedAttraction, setPickedAttraction] = useState<Attraction | null>(null);
  const [attrPickerQuery,  setAttrPickerQuery]  = useState('');
  const [attrPickerOpen,   setAttrPickerOpen]   = useState(false);
  const [rejectModal,   setRejectModal]   = useState<any | null>(null);
  const [rejectNotes,   setRejectNotes]   = useState('');
  const [savingReject,  setSavingReject]  = useState(false);

  const [changeRequests,  setChangeRequests]  = useState<any[]>([]);
  const [loadingCR,       setLoadingCR]       = useState(false);
  const [visitorRecords,  setVisitorRecords]  = useState<any[]>([]);
  const [loadingVR,       setLoadingVR]       = useState(false);
  const [vrYear,          setVrYear]          = useState<string>('all');
  const [vrSearch,        setVrSearch]        = useState('');
  const [vrExportOpen,    setVrExportOpen]    = useState(false);
  const _now = new Date();
  const [vrExportMonth,   setVrExportMonth]   = useState(_now.getMonth() + 1);
  const [vrExportYear,    setVrExportYear]    = useState(_now.getFullYear());
  const [crActionModal,   setCrActionModal]   = useState<{ cr: any; action: 'done' | 'rejected' } | null>(null);
  const [crNotes,         setCrNotes]         = useState('');
  const [savingCR,        setSavingCR]        = useState(false);

  const [attractionReqs,  setAttractionReqs]  = useState<any[]>([]);
  const [loadingAR,       setLoadingAR]       = useState(false);
  const [arActionModal,   setArActionModal]   = useState<{ req: any; action: string } | null>(null);
  const [arNotes,         setArNotes]         = useState('');
  const [savingAR,        setSavingAR]        = useState(false);

  const [attrSearch, setAttrSearch] = useState('');
  const [attrType,   setAttrType]   = useState<string>('all');

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState<number | null>(null);

  const [externalReviews,    setExternalReviews]    = useState<any[]>([]);
  const [loadingExternal,    setLoadingExternal]    = useState(false);
  const [scrapingId,         setScrapingId]         = useState<string | null>(null);
  const [scrapeMsg,          setScrapeMsg]          = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [expandedReview,     setExpandedReview]     = useState<string | null>(null);
  const [scrapeAllActive,    setScrapeAllActive]    = useState(false);
  const [scrapeAllProgress,  setScrapeAllProgress]  = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!loading && (!user || !isStaff)) router.replace('/');
  }, [user, loading, isStaff, router]);

  // Set default tab based on role
  useEffect(() => {
    if (!loading && isStaff) {
      if (isChatoEditor) setActiveTab('changerequests');
      else if (isChatoOfficer) setActiveTab('overview');
    }
  }, [loading, isStaff, isChatoEditor, isChatoOfficer]);

  useEffect(() => {
    if (!isStaff || !token) return;
    const h = { Authorization: `Bearer ${token}` };

    // All staff need attractions + reviews
    fetch('/api/strapi/attractions').then(r => r.json()).then(d => setAttractions(d.data || [])).catch(() => {}).finally(() => setLoadingAttr(false));
    fetch('/api/strapi/reviews').then(r => r.json()).then(d => setReviews(d.data || [])).catch(() => {}).finally(() => setLoadingReviews(false));
    setLoadingExternal(true);
    fetch('/api/admin/external-reviews').then(r => r.json()).then(d => setExternalReviews(d.data || [])).catch(() => {}).finally(() => setLoadingExternal(false));

    // Admin and CHATO Officer get everything else
    if (isAdmin || isChatoOfficer) {
      fetch('/api/admin/submissions',   { headers: h }).then(r => r.json()).then(d => setSubmissions(d.data || [])).catch(() => {}).finally(() => setLoadingSubs(false));
      fetch('/api/admin/participation',  { headers: h }).then(r => r.json()).then(d => setParticipation(d.data || [])).catch(() => {}).finally(() => setLoadingPart(false));
      fetch('/api/event-signup',         { headers: h }).then(r => r.json()).then(d => setSignups(d.data || [])).catch(() => {}).finally(() => setLoadingSignups(false));
      fetch('/api/analytics/track').then(r => r.json()).then(d => setAnalytics(d)).catch(() => {}).finally(() => setLoadingStats(false));
      fetch('/api/admin/audit-logs',     { headers: h }).then(r => r.json()).then(d => setAuditLogs(d.data || [])).catch(() => {}).finally(() => setLoadingAudit(false));
    }

    // Admin only — user management + LBO applications
    if (isAdmin) {
      fetch('/api/admin/users',           { headers: h }).then(r => r.json()).then(d => setUsers(d.data || [])).catch(() => {}).finally(() => setLoadingUsers(false));
      fetch('/api/admin/lbo-applications',{ headers: h }).then(r => r.json()).then(d => { if (d._error) console.error('[LBO] Strapi error:', d._error, 'status:', d._status); setLboApps(d.data || []); }).catch(() => {}).finally(() => setLoadingLbo(false));
    }

    // Admin and Editor — change requests
    if (isAdmin || isChatoEditor) {
      setLoadingCR(true);
      fetch('/api/admin/change-requests', { headers: h }).then(r => r.json()).then(d => setChangeRequests(d.data || [])).catch(() => {}).finally(() => setLoadingCR(false));
    }

    // Admin and Officer — visitor records
    if (isAdmin || isChatoOfficer) {
      setLoadingVR(true);
      fetch('/api/admin/visitor-records', { headers: h }).then(r => r.json()).then(d => setVisitorRecords(d.data || [])).catch(() => {}).finally(() => setLoadingVR(false));
    }

    // All staff — attraction requests
    setLoadingAR(true);
    fetch('/api/admin/attraction-requests', { headers: h }).then(r => r.json()).then(d => setAttractionReqs(d.data || [])).catch(() => {}).finally(() => setLoadingAR(false));

    // Role management — admin and CHATO Officer
    if (isAdmin || isChatoOfficer) {
      fetch('/api/admin/assign-role', { headers: h }).then(r => r.json()).then(d => {
        setRoleUsers(d.users || []);
        setAvailRoles(d.roles || []);
      }).catch(() => {}).finally(() => setLoadingRoles(false));
    }
  }, [isAdmin, isChatoOfficer, isChatoEditor, isStaff, token]);

  // Live visitors polling — every 10 seconds
  useEffect(() => {
    if (!isAdmin || !token) return;
    const h = { Authorization: `Bearer ${token}` };
    const poll = () => {
      fetch('/api/admin/live-visitors', { headers: h })
        .then(r => r.json())
        .then(d => setLiveVisitors(d.data || []))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [isAdmin, token]);

  const handleAssignRole = async (userId: number, roleId: number) => {
    setSavingRole(userId);
    setRoleMsg(null);
    try {
      const res = await fetch('/api/admin/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, roleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoleUsers(prev => prev.map(u => u.id === userId ? { ...u, roleId, role: availRoles.find(r => r.id === roleId)?.name } : u));
        setRoleMsg({ id: userId, ok: true, text: 'Role updated' });
      } else {
        setRoleMsg({ id: userId, ok: false, text: data.error || 'Failed' });
      }
    } catch {
      setRoleMsg({ id: userId, ok: false, text: 'Network error' });
    }
    setSavingRole(null);
    setTimeout(() => setRoleMsg(null), 3000);
  };

  const handleResetPassword = async () => {
    if (!pwdModal) return;
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const res = await fetch('/api/admin/assign-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: pwdModal.id, password: pwdInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ ok: true, text: 'Password updated successfully' });
        setTimeout(() => { setPwdModal(null); setPwdInput(''); setPwdMsg(null); }, 1500);
      } else {
        setPwdMsg({ ok: false, text: data.error || 'Failed to reset password' });
      }
    } catch {
      setPwdMsg({ ok: false, text: 'Network error' });
    }
    setSavingPwd(false);
  };

  const handleSyncSearch = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/admin/sync-search', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      res.ok ? (setSyncCount(data.synced), setSyncStatus('done')) : setSyncStatus('error');
    } catch { setSyncStatus('error'); }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  const handleLboApprove = (app: any) => {
    const a = app.attributes || app;
    setLboRegModal(app);
    setLboRegForm({ username: (a.email || '').split('@')[0], password: '' });
    setLboRegMsg(null);
    // Auto-suggest matching attraction
    const match = attractions.find(attr =>
      attr.attributes.name.toLowerCase().includes((a.attraction_name || '').toLowerCase()) ||
      (a.attraction_name || '').toLowerCase().includes(attr.attributes.name.toLowerCase())
    ) || null;
    setPickedAttraction(match);
    setAttrPickerQuery(match ? match.attributes.name : (a.attraction_name || ''));
    setAttrPickerOpen(false);
  };

  const handleLboReject = (app: any) => {
    setRejectModal(app);
    setRejectNotes('');
  };

  const handleLboRegister = async () => {
    if (!lboRegModal) return;
    setSavingLboReg(true);
    setLboRegMsg(null);
    const a = lboRegModal.attributes || lboRegModal;
    try {
      const res = await fetch('/api/admin/lbo-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          applicationId:         lboRegModal.id,
          username:              lboRegForm.username,
          email:                 a.email,
          password:              lboRegForm.password,
          strapi_attraction_id:   pickedAttraction?.strapiId   || null,
          strapi_attraction_type: pickedAttraction?.type        || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLboRegMsg({ ok: true, text: 'Account created successfully!' });
        setLboApps(prev => prev.map(ap => ap.id === lboRegModal.id
          ? { ...ap, attributes: { ...(ap.attributes || ap), status: 'approved' } }
          : ap
        ));
        setTimeout(() => { setLboRegModal(null); setLboRegForm({ username: '', password: '' }); setLboRegMsg(null); }, 2000);
      } else {
        setLboRegMsg({ ok: false, text: data.error || 'Failed to create account' });
      }
    } catch {
      setLboRegMsg({ ok: false, text: 'Network error' });
    }
    setSavingLboReg(false);
  };

  const handleLboRejectConfirm = async () => {
    if (!rejectModal) return;
    setSavingReject(true);
    try {
      const res = await fetch('/api/admin/lbo-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: rejectModal.id, status: 'rejected', notes: rejectNotes }),
      });
      if (res.ok) {
        setLboApps(prev => prev.map(ap => ap.id === rejectModal.id
          ? { ...ap, attributes: { ...(ap.attributes || ap), status: 'rejected', notes: rejectNotes } }
          : ap
        ));
        setRejectModal(null);
        setRejectNotes('');
      }
    } catch {}
    setSavingReject(false);
  };

  const handleCRUpdate = async () => {
    if (!crActionModal) return;
    setSavingCR(true);
    try {
      const res = await fetch('/api/admin/change-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: crActionModal.cr.id, status: crActionModal.action, editor_notes: crNotes }),
      });
      if (res.ok) {
        setChangeRequests(prev => prev.map(cr => cr.id === crActionModal.cr.id
          ? { ...cr, status: crActionModal.action, editor_notes: crNotes }
          : cr
        ));
        setCrActionModal(null);
        setCrNotes('');
      }
    } catch {}
    setSavingCR(false);
  };

  const handleARUpdate = async () => {
    if (!arActionModal) return;
    setSavingAR(true);
    try {
      const isEditorAction = arActionModal.action === 'editor_reviewed';
      const body: Record<string, unknown> = { id: arActionModal.req.id, status: arActionModal.action };
      if (isEditorAction || isAdmin) body.editor_notes  = arNotes;
      else                           body.officer_notes = arNotes;
      const res = await fetch('/api/admin/attraction-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAttractionReqs(prev => prev.map(r => r.id === arActionModal.req.id
          ? { ...r, status: arActionModal.action, ...(isEditorAction || isAdmin ? { editor_notes: arNotes } : { officer_notes: arNotes }) }
          : r
        ));
        setArActionModal(null);
        setArNotes('');
      }
    } catch {}
    setSavingAR(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} /></div>;
  if (!user || !isStaff) return null;

  const newCount      = submissions.filter(s => s.attributes?.status === 'new').length;
  const feedbackCount = submissions.filter(s => s.attributes?.type === 'feedback').length;
  const volunteerCount= submissions.filter(s => s.attributes?.type === 'volunteer').length;

  const filteredAttractions = attractions.filter(a => {
    const matchType = attrType === 'all' || a.type === attrType;
    const matchSearch = !attrSearch || a.attributes.name.toLowerCase().includes(attrSearch.toLowerCase());
    return matchType && matchSearch;
  });

  const dashboardTitle = isAdmin ? 'Admin Dashboard' : isChatoOfficer ? 'CHATO Officer Dashboard' : 'CHATO Editor Dashboard';
  const dashboardSub   = isAdmin ? 'Full admin access' : isChatoOfficer ? 'Operations & analytics' : 'Content management';

  // Tab visibility per role
  const ALL_TABS: { key: Tab; label: string; badge?: number; roles: string[] }[] = [
    { key: 'overview',      label: 'Analytics',         badge: undefined,                                                                     roles: ['admin', 'officer'] },
    { key: 'users',         label: 'Users',              badge: users.length,                                                                   roles: ['admin'] },
    { key: 'roles',         label: 'Role Management',    badge: roleUsers.length,                                                               roles: ['admin', 'officer'] },
    { key: 'lbo',           label: 'LBO Applications',   badge: lboApps.filter(a => (a.attributes?.status || a.status) === 'pending').length,   roles: ['admin'] },
    { key: 'changerequests',    label: 'Change Requests',    badge: changeRequests.filter(cr => cr.status === 'pending').length,                     roles: ['admin', 'editor'] },
    { key: 'attractionrequests', label: 'Attraction Requests', badge: attractionReqs.filter(r => r.status === 'pending' || r.status === 'editor_reviewed').length, roles: ['admin', 'officer', 'editor'] },
    { key: 'visitorrecords',  label: 'Visitor Records',   badge: undefined,                                                                         roles: ['admin', 'officer'] },
    { key: 'submissions',    label: 'Submissions',       badge: newCount,                                                                        roles: ['admin'] },
    { key: 'participation', label: 'Participation',      badge: participation.length,                                                           roles: ['admin', 'officer'] },
    { key: 'signups',       label: 'Event Sign-ups',     badge: signups.length,                                                                 roles: ['admin'] },
    { key: 'attractions',   label: 'Attractions',        badge: attractions.length,                                                             roles: ['admin', 'officer', 'editor'] },
    { key: 'ratings',       label: 'Ratings',            badge: reviews.length,                                                                 roles: ['admin', 'officer', 'editor'] },
    { key: 'audit',           label: 'Audit Logs',         badge: auditLogs.length,   roles: ['admin', 'officer'] },
    { key: 'reports',         label: 'Reports',            badge: undefined,           roles: ['admin', 'officer'] },
    { key: 'externalreviews', label: 'Online Reviews',     badge: undefined,           roles: ['admin', 'officer'] },
  ];

  const myRole = isAdmin ? 'admin' : isChatoOfficer ? 'officer' : 'editor';
  const TABS = ALL_TABS.filter(t => t.roles.includes(myRole));

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-sm font-semibold mb-4 group" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Site
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{dashboardTitle}</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome back, {user.username} · {dashboardSub}</p>
            </div>
            <a href={`${STRAPI_URL}/admin`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 4px 16px rgba(0,191,179,.35)' }}>
              <ExternalLink className="w-4 h-4" /> Open Strapi Admin
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5 min-w-max">
          {TABS.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === key ? 'border-teal-400 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: key === 'audit' ? '#8B5CF6' : key === 'ratings' ? '#F59E0B' : key === 'users' ? '#3B82F6' : '#00BFB3' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── OVERVIEW ───────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Eye className="w-5 h-5" />}       label="Page Views"       value={loadingStats ? '—' : (analytics?.pageViews ?? 0).toLocaleString()} color="#00BFB3" />
              <StatCard icon={<Users className="w-5 h-5" />}     label="Unique Visitors"  value={loadingStats ? '—' : (analytics?.uniqueVisitors ?? 0).toLocaleString()} color="#3B82F6" />
              <StatCard icon={<MapPin className="w-5 h-5" />}    label="Attractions"       value={loadingAttr ? '—' : attractions.length} sub="in Strapi" color="#F59E0B" />
              <StatCard icon={<Activity className="w-5 h-5" />}  label="CMS Changes"       value={loadingAudit ? '—' : auditLogs.length} sub="audit log entries" color="#6366F1" />
            </div>
            <div className={`grid grid-cols-2 lg:grid-cols-${isAdmin ? 4 : 2} gap-4`}>
              <StatCard icon={<FileText className="w-5 h-5" />}    label="Submissions"     value={loadingSubs ? '—' : submissions.length} sub={`${newCount} new`} color="#8B5CF6" />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Participations" value={loadingPart ? '—' : participation.length} sub="requests" color="#EC4899" />
              {isAdmin && <StatCard icon={<UserCheck className="w-5 h-5" />} label="Registered Users" value={loadingUsers ? '—' : users.length} sub="tourist accounts" color="#10B981" />}
              {isAdmin && <StatCard icon={<Calendar className="w-5 h-5" />}  label="Event Sign-ups"   value={loadingSignups ? '—' : signups.length} sub="total" color="#F59E0B" />}
            </div>

            {/* Sync search */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-900">Search Index</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {syncStatus === 'done' ? `Synced ${syncCount} items to Algolia` : syncStatus === 'error' ? 'Sync failed — check Algolia credentials' : 'Sync Strapi content to Algolia for up-to-date search'}
                </p>
              </div>
              <button onClick={handleSyncSearch} disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: syncStatus === 'error' ? '#EF4444' : syncStatus === 'done' ? '#10B981' : '#00BFB3' }}>
                {syncStatus === 'syncing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
                 : syncStatus === 'done' ? <><CheckCircle className="w-4 h-4" /> Synced</>
                 : syncStatus === 'error' ? <><AlertCircle className="w-4 h-4" /> Retry Sync</>
                 : <><RefreshCw className="w-4 h-4" /> Sync Search</>}
              </button>
            </div>

            {/* Live Visitors */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Wifi className="w-5 h-5" style={{ color: '#00BFB3' }} />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Live on Site</h2>
                    <p className="text-xs text-gray-400">Active in the last 5 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-bold text-gray-700">{liveVisitors.length} active</span>
                </div>
              </div>

              {/* Device summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Desktop', icon: <Monitor className="w-4 h-4" />, count: liveVisitors.filter(v => v.device === 'desktop').length, color: '#3B82F6' },
                  { label: 'Mobile',  icon: <Smartphone className="w-4 h-4" />, count: liveVisitors.filter(v => v.device === 'mobile').length,  color: '#00BFB3' },
                  { label: 'Tablet',  icon: <Tablet className="w-4 h-4" />,     count: liveVisitors.filter(v => v.device === 'tablet').length,  color: '#8B5CF6' },
                ].map(({ label, icon, count, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Session feed */}
              {liveVisitors.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-gray-400">
                  <Wifi className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-semibold">No active visitors right now</p>
                  <p className="text-xs mt-0.5">Sessions appear here within 30 seconds of a page visit</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {liveVisitors.map((v) => {
                    const secsAgo = Math.floor((Date.now() - new Date(v.last_seen).getTime()) / 1000);
                    const timeAgo = secsAgo < 60 ? 'just now' : secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m ago` : `${Math.floor(secsAgo / 3600)}h ago`;
                    const DeviceIcon = v.device === 'mobile' ? Smartphone : v.device === 'tablet' ? Tablet : Monitor;
                    const deviceColor = v.device === 'mobile' ? '#00BFB3' : v.device === 'tablet' ? '#8B5CF6' : '#3B82F6';
                    return (
                      <div key={v.session_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${deviceColor}18`, color: deviceColor }}>
                          <DeviceIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{v.page || '/'}</p>
                          <p className="text-xs text-gray-400 capitalize">{v.device}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 font-medium">{timeAgo}</span>
                        <span className="w-2 h-2 rounded-full shrink-0 bg-green-400" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Participation breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Submission Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Feedback',    count: feedbackCount,                                                      icon: <MessageSquare className="w-5 h-5" />, color: '#8B5CF6' },
                  { label: 'Volunteer',   count: volunteerCount,                                                     icon: <Users className="w-5 h-5" />,         color: '#00BFB3' },
                  { label: 'Partnership', count: submissions.filter(s => s.attributes?.type === 'partnership').length, icon: <BarChart3 className="w-5 h-5" />,    color: '#F59E0B' },
                ].map(({ label, count, icon, color }) => (
                  <div key={label} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{loadingSubs ? '—' : count}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent audit logs preview */}
            {auditLogs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Recent CMS Activity</h2>
                  <button onClick={() => setActiveTab('audit')} className="text-xs font-semibold" style={{ color: '#00BFB3' }}>View all →</button>
                </div>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${EVENT_COLOR[log.event] || 'bg-gray-100 text-gray-600'}`}>
                        {log.event.replace('entry.', '')}
                      </span>
                      <span className="font-medium text-gray-800 truncate">{log.entry_title}</span>
                      <span className="text-gray-400 text-xs shrink-0">{log.model}</span>
                      <span className="text-gray-300 text-xs ml-auto shrink-0">{new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top pages */}
            {analytics?.topPages && analytics.topPages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Top Pages</h2>
                <div className="space-y-3">
                  {analytics.topPages.slice(0, 8).map(({ path, views }) => {
                    const max = analytics.topPages[0]?.views || 1;
                    return (
                      <div key={path} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-40 shrink-0 truncate">{path || '/'}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(views / max) * 100}%`, backgroundColor: '#00BFB3' }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{views}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ──────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <TableWrap title="All Users" count={users.length} loading={loadingUsers} empty={users.length === 0} emptyIcon={<Users className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => {
                  const roleName = u.role?.name || 'Authenticated';
                  const rn = roleName.toLowerCase();
                  const isSuperAdmin = rn.includes('super admin') || rn.includes('super-admin');
                  const isOfficer   = rn.includes('officer');
                  const isEditor    = rn.includes('editor');
                  const isTourist   = rn.includes('authenticated') || rn.includes('tourist');
                  const isPanel     = u.source === 'admin';
                  const roleColor = isSuperAdmin ? { bg: 'bg-red-600 text-white',     avatar: '#DC2626' }
                    : isOfficer   ? { bg: 'bg-[#0F1F3C] text-white',                  avatar: '#0F1F3C' }
                    : isEditor    ? { bg: 'bg-purple-50 text-purple-700',              avatar: '#8B5CF6' }
                    : isTourist   ? { bg: 'bg-teal-50 text-teal-700',                 avatar: '#00BFB3' }
                    :               { bg: 'bg-gray-100 text-gray-700',                avatar: '#6B7280' };
                  const RoleIcon = isSuperAdmin ? Shield : isOfficer ? Shield : isEditor ? Edit : UserCheck;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: roleColor.avatar }}>
                            {(u.username || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.username || '—'}</p>
                            {isPanel && <span className="text-xs text-gray-400">Admin Panel</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600"><Mail className="w-3 h-3 inline mr-1 shrink-0" />{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor.bg}`}>
                          <RoleIcon className="w-3 h-3" />{roleName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.confirmed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {u.confirmed ? <><CheckCircle className="w-3 h-3" /> Active</> : <><AlertCircle className="w-3 h-3" /> Inactive</>}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {/* ── ROLE MANAGEMENT ───────────────────────────────── */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Assign User Roles</h2>
              <p className="text-xs text-gray-400">Changes are saved immediately to Strapi. Roles come from Users &amp; Permissions.</p>
            </div>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">User</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Current Role</th>
                        <th className="px-5 py-3 text-left">Assign Role</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {roleUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#00BFB3' }}>
                                {(u.username || u.email || '?')[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900">{u.username || '—'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{u.email}</td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {u.role || 'Authenticated'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              defaultValue={u.roleId || ''}
                              onChange={e => handleAssignRole(u.id, Number(e.target.value))}
                              disabled={savingRole === u.id}
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50">
                              <option value="" disabled>Select role…</option>
                              {availRoles.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            {savingRole === u.id ? (
                              <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</span>
                            ) : roleMsg?.id === u.id ? (
                              <span className={`flex items-center gap-1.5 text-xs font-semibold ${roleMsg!.ok ? 'text-green-600' : 'text-red-500'}`}>
                                {roleMsg!.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {roleMsg!.text}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => { setPwdModal({ id: u.id, email: u.email }); setPwdInput(''); setPwdMsg(null); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 transition">
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LBO APPLICATIONS ──────────────────────────────── */}
        {activeTab === 'lbo' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={<Clock className="w-5 h-5" />}         label="Pending"  value={lboApps.filter(a => (a.attributes?.status || a.status) === 'pending').length}  color="#F59E0B" />
              <StatCard icon={<CheckCircle className="w-5 h-5" />}   label="Approved" value={lboApps.filter(a => (a.attributes?.status || a.status) === 'approved').length} color="#10B981" />
              <StatCard icon={<AlertCircle className="w-5 h-5" />}   label="Rejected" value={lboApps.filter(a => (a.attributes?.status || a.status) === 'rejected').length} color="#EF4444" />
            </div>

            {/* Application list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">LBO Applications</h2>
                <span className="text-sm text-gray-400">{lboApps.length} total</span>
              </div>
              {loadingLbo ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
              ) : lboApps.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <Building2 className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">No applications yet</p>
                  <p className="text-xs mt-1">Applications submitted at /business/apply appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {lboApps.map(app => {
                    const a = app.attributes || app;
                    const appId = app.id;
                    const status = a.status || 'pending';
                    const isExpanded = expandedLbo === appId;
                    const docs: { name: string; url: string }[] = Array.isArray(a.documents) ? a.documents : [];
                    const statusColor = status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : status === 'rejected'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-yellow-50 text-yellow-700';
                    return (
                      <div key={appId}>
                        {/* Collapsed row */}
                        <div
                          className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedLbo(isExpanded ? null : appId)}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{a.business_name || '—'}</p>
                            <p className="text-xs text-gray-400 truncate">{a.owner_name} · {a.email}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${statusColor}`}>{status}</span>
                          <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                            {(a.created_at || a.createdAt) ? new Date(a.created_at || a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                            <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                              {[
                                { label: 'Business Name',              value: a.business_name },
                                { label: 'Attraction / Listing Name',  value: a.attraction_name },
                                { label: 'Category',                   value: a.category },
                                { label: 'Owner / Representative',     value: a.owner_name },
                                { label: 'Email',                      value: a.email },
                                { label: 'Contact Number',             value: a.phone },
                                { label: 'Business Address',           value: a.address },
                                { label: 'Business Type',              value: a.business_type },
                                { label: "Mayor's Permit / DTI No.",   value: a.permit_number },
                                { label: 'Coordinates',                value: (a.latitude && a.longitude) ? `${a.latitude}, ${a.longitude}` : null },
                                { label: 'Assigned Attraction ID',     value: a.strapi_attraction_id },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                                  <p className="text-sm text-gray-800">{value || '—'}</p>
                                </div>
                              ))}
                            </div>

                            {/* Documents */}
                            {docs.length > 0 && (
                              <div className="mt-5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                  Supporting Documents <span className="text-gray-300 font-normal">({docs.length})</span>
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {docs.map((doc, i) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name || doc.url);
                                    const isPdf   = /\.pdf$/i.test(doc.name || doc.url);
                                    return (
                                      <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                        className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:border-blue-300 hover:shadow-md transition-all">
                                        {isImage ? (
                                          <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={doc.url} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                          </div>
                                        ) : (
                                          <div className="w-full aspect-video bg-red-50 flex items-center justify-center">
                                            <div className="text-center">
                                              <FileText className="w-8 h-8 text-red-400 mx-auto mb-1" />
                                              <span className="text-xs font-bold text-red-500 uppercase">{isPdf ? 'PDF' : 'File'}</span>
                                            </div>
                                          </div>
                                        )}
                                        <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2">
                                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                          <span className="text-xs text-gray-600 truncate">{doc.name || 'Document'}</span>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {a.notes && (
                              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-sm text-amber-800">{a.notes}</p>
                              </div>
                            )}

                            {/* Action buttons — only for pending */}
                            {status === 'pending' && (
                              <div className="mt-5 flex flex-wrap gap-3">
                                <button onClick={() => handleLboApprove(app)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                                  style={{ backgroundColor: '#10B981' }}>
                                  <CheckCircle className="w-4 h-4" /> Approve &amp; Register Account
                                </button>
                                <button onClick={() => handleLboReject(app)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                                  <X className="w-4 h-4" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS ────────────────────────────────────── */}
        {activeTab === 'submissions' && (
          <TableWrap title="Contact / Feedback Submissions" count={submissions.length} loading={loadingSubs} empty={submissions.length === 0} emptyIcon={<FileText className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Message</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map(s => {
                  const a = s.attributes;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{a.name}</td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3 shrink-0" />{a.email}</p>
                        {a.phone && <p className="flex items-center gap-1 text-gray-400 mt-0.5"><Phone className="w-3 h-3 shrink-0" />{a.phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE[a.type] || 'bg-gray-100 text-gray-600'}`}>{a.type}</span>
                      </td>
                      <td className="px-5 py-4 max-w-xs"><p className="text-gray-600 line-clamp-2">{a.message}</p></td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {a.status === 'new' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}{a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1" />{new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {/* ── PARTICIPATION ──────────────────────────────────── */}
        {activeTab === 'participation' && (
          <TableWrap title="Participation Requests" count={participation.length} loading={loadingPart} empty={participation.length === 0} emptyIcon={<MessageSquare className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Message</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {participation.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{p.full_name}</td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3 shrink-0" />{p.email}</p>
                      {p.phone && <p className="flex items-center gap-1 text-gray-400 mt-0.5"><Phone className="w-3 h-3 shrink-0" />{p.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {p.type && <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE[p.type] || 'bg-gray-100 text-gray-600'}`}>{p.type}</span>}
                    </td>
                    <td className="px-5 py-4 max-w-xs"><p className="text-gray-600 line-clamp-2">{p.message || '—'}</p></td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />{new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}

        {/* ── EVENT SIGN-UPS ─────────────────────────────────── */}
        {activeTab === 'signups' && (
          <TableWrap title="Event Sign-ups" count={signups.length} loading={loadingSignups} empty={signups.length === 0} emptyIcon={<Calendar className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Event</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Signed Up</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {signups.map(s => {
                  const a = s.attributes;
                  const eventTitle = a.event?.data?.attributes?.title || '—';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{a.full_name}</td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3 shrink-0" />{a.email}</p>
                        {a.phone && <p className="flex items-center gap-1 text-gray-400 mt-0.5"><Phone className="w-3 h-3 shrink-0" />{a.phone}</p>}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">{eventTitle}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${a.status === 'confirmed' ? 'bg-green-50 text-green-700' : a.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-700'}`}>
                          {a.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}{a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1" />{new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {/* ── ATTRACTIONS ────────────────────────────────────── */}
        {activeTab === 'attractions' && (
          <div className="space-y-4">
            {/* CHATO Editor — prominent Strapi button */}
            {isChatoEditor && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">Content Management</p>
                  <p className="text-xs text-gray-400 mt-0.5">Use Strapi to create, update, or delete attraction entries</p>
                </div>
                <a href={`${STRAPI_URL}/admin`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 4px 16px rgba(0,191,179,.35)' }}>
                  <ExternalLink className="w-4 h-4" /> Open Strapi CMS
                </a>
              </div>
            )}

            {/* Search + Filter bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attractions…"
                  value={attrSearch}
                  onChange={e => setAttrSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <select
                value={attrType}
                onChange={e => setAttrType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="all">All Types</option>
                <option value="heritage">Heritage Sites</option>
                <option value="spot">Tourist Spots</option>
                <option value="dining">Dining</option>
              </select>
              <span className="text-xs text-gray-400 shrink-0">{filteredAttractions.length} of {attractions.length}</span>
            </div>

            <TableWrap title="Attractions" count={filteredAttractions.length} loading={loadingAttr} empty={filteredAttractions.length === 0} emptyIcon={<MapPin className="w-12 h-12" />}>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Rating</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttractions.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/attractions/${a.id}`} target="_blank" className="font-semibold text-gray-900 hover:text-teal-600 transition flex items-center gap-1">
                          {a.attributes.name}
                          <ExternalLink className="w-3 h-3 opacity-40" />
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: TYPE_COLORS[a.type] }}>
                          <Layers className="w-3 h-3" />{TYPE_LABELS[a.type]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 capitalize">{a.attributes.category || '—'}</td>
                      <td className="px-5 py-4">
                        {a.attributes.location && (
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><MapPin className="w-3 h-3 shrink-0" />{a.attributes.location}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {(a.attributes.rating ?? 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                            <span className="text-sm font-semibold text-gray-700">{Number(a.attributes.rating).toFixed(1)}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">No rating</span>}
                      </td>
                      <td className="px-5 py-4">
                        <a href={strapiEditUrl(a.type, a.strapiId)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 text-white"
                          style={{ backgroundColor: '#00BFB3' }}>
                          <Edit className="w-3 h-3" /> Edit in Strapi
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {/* ── RATINGS ────────────────────────────────────────── */}
        {activeTab === 'ratings' && (() => {
          const byItem: Record<string, { count: number; total: number; latest: string }> = {};
          reviews.forEach((r: any) => {
            const a = r.attributes || r;
            const id = a.item_id || '?';
            if (!byItem[id]) byItem[id] = { count: 0, total: 0, latest: '' };
            byItem[id].count++;
            byItem[id].total += Number(a.rating) || 0;
            if (!byItem[id].latest || a.createdAt > byItem[id].latest) byItem[id].latest = a.createdAt;
          });
          const rows = Object.entries(byItem).map(([id, v]) => ({ id, avg: v.total / v.count, count: v.count, latest: v.latest })).sort((a, b) => b.count - a.count);
          return (
            <TableWrap title="Attraction Ratings" count={reviews.length} loading={loadingReviews} empty={rows.length === 0} emptyIcon={<Star className="w-12 h-12" />}>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Attraction ID</th>
                  <th className="px-5 py-3 text-left">Avg Rating</th>
                  <th className="px-5 py-3 text-left">Reviews</th>
                  <th className="px-5 py-3 text-left">Latest</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{row.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4" fill={i <= Math.round(row.avg) ? '#FFB400' : 'none'} stroke={i <= Math.round(row.avg) ? '#FFB400' : '#d1d5db'} />)}
                          </div>
                          <span className="text-sm font-bold text-gray-700">{row.avg.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{row.count} review{row.count !== 1 ? 's' : ''}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{row.latest ? new Date(row.latest).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          );
        })()}

        {/* ── CHANGE REQUESTS ────────────────────────────────── */}
        {activeTab === 'changerequests' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={<Clock className="w-5 h-5" />}       label="Pending"  value={changeRequests.filter(cr => cr.status === 'pending').length}  color="#F59E0B" />
              <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Done"     value={changeRequests.filter(cr => cr.status === 'done').length}     color="#10B981" />
              <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Rejected" value={changeRequests.filter(cr => cr.status === 'rejected').length} color="#EF4444" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">LBO Change Requests</h2>
                <span className="text-sm text-gray-400">{changeRequests.length} total</span>
              </div>

              {loadingCR ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
              ) : changeRequests.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <Inbox className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">No change requests yet</p>
                  <p className="text-xs mt-1">Requests submitted by LBO owners appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">LBO</th>
                      <th className="px-5 py-3 text-left">Attraction</th>
                      <th className="px-5 py-3 text-left">Field</th>
                      <th className="px-5 py-3 text-left">Current → Requested</th>
                      <th className="px-5 py-3 text-left">Reason</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {changeRequests.map(cr => {
                        const crStatus = cr.status || 'pending';
                        const statusColor = crStatus === 'done' ? 'bg-green-50 text-green-700'
                          : crStatus === 'rejected' ? 'bg-red-50 text-red-600'
                          : 'bg-yellow-50 text-yellow-700';
                        return (
                          <tr key={cr.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">{cr.lbo_name || '—'}</p>
                              <p className="text-xs text-gray-400">{cr.lbo_email}</p>
                            </td>
                            <td className="px-5 py-4 font-medium text-gray-800">{cr.attraction_name || '—'}</td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize">{cr.field_to_change || '—'}</span>
                            </td>
                            <td className="px-5 py-4 max-w-[220px]">
                              {cr.current_value && (
                                <p className="text-xs text-gray-400 line-clamp-1 mb-0.5"><span className="font-semibold">From:</span> {cr.current_value}</p>
                              )}
                              <p className="text-xs text-gray-800 line-clamp-2"><span className="font-semibold">To:</span> {cr.requested_value}</p>
                            </td>
                            <td className="px-5 py-4 max-w-[180px]">
                              <p className="text-xs text-gray-500 line-clamp-2">{cr.reason || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor}`}>{crStatus}</span>
                              {cr.editor_notes && (
                                <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">{cr.editor_notes}</p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                              {cr.created_at ? new Date(cr.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-5 py-4">
                              {crStatus === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setCrActionModal({ cr, action: 'done' }); setCrNotes(''); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                                    style={{ backgroundColor: '#10B981' }}>
                                    Mark Done
                                  </button>
                                  <button
                                    onClick={() => { setCrActionModal({ cr, action: 'rejected' }); setCrNotes(''); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VISITOR RECORDS ────────────────────────────────── */}
        {activeTab === 'visitorrecords' && (() => {
          const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const years = [...new Set(visitorRecords.map(r => String(r.year)))].sort((a,b) => Number(b)-Number(a));
          const filtered = visitorRecords.filter(r => {
            const matchYear   = vrYear === 'all' || String(r.year) === vrYear;
            const matchSearch = !vrSearch || (r.attraction_name || '').toLowerCase().includes(vrSearch.toLowerCase()) || (r.lbo_email || '').toLowerCase().includes(vrSearch.toLowerCase());
            return matchYear && matchSearch;
          });
          const rowTotal = (r: any) =>
            (r.local_male||0)+(r.local_female||0)+(r.other_city_male||0)+(r.other_city_female||0)+
            (r.other_province_male||0)+(r.other_province_female||0)+(r.foreign_male||0)+(r.foreign_female||0);
          const grandTotal = filtered.reduce((s, r) => s + rowTotal(r), 0);

          const exportYears = years.length > 0 ? years : [String(vrExportYear)];

          const handleExportExcel = () => {
            const exportRecords = [...visitorRecords]
              .filter(r => Number(r.month) === vrExportMonth && Number(r.year) === vrExportYear)
              .sort((a, b) => (a.attraction_name || '').localeCompare(b.attraction_name || ''));

            const headers = [
              'Attraction Name', 'LBO Email', 'Period',
              'Local (M)', 'Local (F)', 'Local Total',
              'Other City (M)', 'Other City (F)', 'Other City Total',
              'Other Province (M)', 'Other Province (F)', 'Other Province Total',
              'Foreign (M)', 'Foreign (F)', 'Foreign Total',
              'GRAND TOTAL',
            ];

            const dataRows = exportRecords.map(r => {
              const lM = r.local_male||0, lF = r.local_female||0;
              const cM = r.other_city_male||0, cF = r.other_city_female||0;
              const pM = r.other_province_male||0, pF = r.other_province_female||0;
              const fM = r.foreign_male||0, fF = r.foreign_female||0;
              return [
                r.attraction_name || '—', r.lbo_email || '—',
                `${MONTHS_FULL[vrExportMonth - 1]} ${vrExportYear}`,
                lM, lF, lM + lF,
                cM, cF, cM + cF,
                pM, pF, pM + pF,
                fM, fF, fM + fF,
                lM+lF+cM+cF+pM+pF+fM+fF,
              ];
            });

            const sum = (f: string) => exportRecords.reduce((s: number, r: any) => s + (r[f]||0), 0);
            const lMt = sum('local_male'), lFt = sum('local_female');
            const cMt = sum('other_city_male'), cFt = sum('other_city_female');
            const pMt = sum('other_province_male'), pFt = sum('other_province_female');
            const fMt = sum('foreign_male'), fFt = sum('foreign_female');
            const totalRow = [
              'TOTAL', '', '',
              lMt, lFt, lMt+lFt,
              cMt, cFt, cMt+cFt,
              pMt, pFt, pMt+pFt,
              fMt, fFt, fMt+fFt,
              lMt+lFt+cMt+cFt+pMt+pFt+fMt+fFt,
            ];

            const wsData = [headers, ...dataRows, totalRow];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [
              { wch: 32 }, { wch: 26 }, { wch: 18 },
              { wch: 10 }, { wch: 10 }, { wch: 12 },
              { wch: 12 }, { wch: 12 }, { wch: 14 },
              { wch: 15 }, { wch: 15 }, { wch: 18 },
              { wch: 12 }, { wch: 12 }, { wch: 14 },
              { wch: 14 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `${MONTHS_FULL[vrExportMonth - 1]} ${vrExportYear}`);
            XLSX.writeFile(wb, `visitor-records-${MONTHS_FULL[vrExportMonth - 1]}-${vrExportYear}.xlsx`);
            setVrExportOpen(false);
          };

          return (
            <>
              {/* Export Modal */}
              {vrExportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setVrExportOpen(false)} />
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900">Export to Excel</h3>
                      <button onClick={() => setVrExportOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-5">Select the month and year to export. Records will be sorted alphabetically by attraction name.</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                        <select value={vrExportMonth} onChange={e => setVrExportMonth(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                          {MONTHS_FULL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                        <select value={vrExportYear} onChange={e => setVrExportYear(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                          {exportYears.map(y => <option key={y} value={Number(y)}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    {(() => {
                      const previewCount = visitorRecords.filter(r => Number(r.month) === vrExportMonth && Number(r.year) === vrExportYear).length;
                      return previewCount === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                          No records found for {MONTHS_FULL[vrExportMonth - 1]} {vrExportYear}.
                        </p>
                      ) : (
                        <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 mb-4">
                          {previewCount} record{previewCount > 1 ? 's' : ''} will be exported for {MONTHS_FULL[vrExportMonth - 1]} {vrExportYear}.
                        </p>
                      );
                    })()}
                    <div className="flex gap-2">
                      <button onClick={() => setVrExportOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                      </button>
                      <button onClick={handleExportExcel}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                        <Download className="w-4 h-4" /> Export .xlsx
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={<Users className="w-5 h-5" />}       label="Total Visitors"  value={grandTotal.toLocaleString()} color="#00BFB3" />
                  <StatCard icon={<FileText className="w-5 h-5" />}    label="Records"          value={filtered.length}             color="#3B82F6" />
                  <StatCard icon={<Building2 className="w-5 h-5" />}   label="Attractions"      value={new Set(filtered.map(r => r.attraction_name)).size} color="#F59E0B" />
                  <StatCard icon={<MapPin className="w-5 h-5" />}      label="LBOs Reporting"   value={new Set(filtered.map(r => r.lbo_email)).size}       color="#8B5CF6" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search attraction or LBO…" value={vrSearch} onChange={e => setVrSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <select value={vrYear} onChange={e => setVrYear(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="all">All Years</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span className="text-xs text-gray-400 shrink-0">{filtered.length} records</span>
                  <button onClick={() => setVrExportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                    <Download className="w-4 h-4" /> Export to Excel
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Visitor Records</h2>
                    <span className="text-sm text-gray-400">{grandTotal.toLocaleString()} total visitors</span>
                  </div>
                  {loadingVR ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center text-gray-400">
                      <Users className="w-12 h-12 opacity-20 mb-3" />
                      <p className="font-semibold">No visitor records yet</p>
                      <p className="text-xs mt-1">Records submitted by LBOs appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          <th className="px-4 py-3 text-left">LBO / Attraction</th>
                          <th className="px-4 py-3 text-left">Period</th>
                          <th className="px-4 py-3 text-right">Local</th>
                          <th className="px-4 py-3 text-right">Other City</th>
                          <th className="px-4 py-3 text-right">Other Province</th>
                          <th className="px-4 py-3 text-right">Foreign</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-600">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {filtered.map(r => {
                            const local    = (r.local_male||0)+(r.local_female||0);
                            const city     = (r.other_city_male||0)+(r.other_city_female||0);
                            const province = (r.other_province_male||0)+(r.other_province_female||0);
                            const foreign  = (r.foreign_male||0)+(r.foreign_female||0);
                            const total    = local+city+province+foreign;
                            return (
                              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4">
                                  <p className="font-semibold text-gray-900">{r.attraction_name || '—'}</p>
                                  <p className="text-xs text-gray-400">{r.lbo_email}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                    {MONTHS_SHORT[(r.month||1)-1]} {r.year}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <p className="font-semibold text-gray-800">{local.toLocaleString()}</p>
                                  <p className="text-xs text-gray-400">{r.local_male||0}M / {r.local_female||0}F</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <p className="font-semibold text-gray-800">{city.toLocaleString()}</p>
                                  <p className="text-xs text-gray-400">{r.other_city_male||0}M / {r.other_city_female||0}F</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <p className="font-semibold text-gray-800">{province.toLocaleString()}</p>
                                  <p className="text-xs text-gray-400">{r.other_province_male||0}M / {r.other_province_female||0}F</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <p className="font-semibold text-gray-800">{foreign.toLocaleString()}</p>
                                  <p className="text-xs text-gray-400">{r.foreign_male||0}M / {r.foreign_female||0}F</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <span className="text-base font-bold text-gray-900">{total.toLocaleString()}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50 border-t-2 border-blue-200">
                            <td className="px-4 py-3 font-bold text-blue-900" colSpan={2}>TOTAL — All Attractions</td>
                            {(['local','other_city','other_province','foreign'] as const).map(key => {
                              const t = filtered.reduce((s,r) => s+(r[`${key}_male`]||0)+(r[`${key}_female`]||0),0);
                              return <td key={key} className="px-4 py-3 text-right font-bold text-blue-900">{t.toLocaleString()}</td>;
                            })}
                            <td className="px-4 py-3 text-right font-black text-teal-600 text-base">{grandTotal.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── ATTRACTION REQUESTS ────────────────────────────── */}
        {activeTab === 'attractionrequests' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<Clock className="w-5 h-5" />}       label="Pending"         value={attractionReqs.filter(r => r.status === 'pending').length}         color="#F59E0B" />
              <StatCard icon={<Eye className="w-5 h-5" />}         label="Under Review"    value={attractionReqs.filter(r => r.status === 'editor_reviewed').length}  color="#3B82F6" />
              <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Approved"        value={attractionReqs.filter(r => r.status === 'approved').length}         color="#10B981" />
              <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Rejected"        value={attractionReqs.filter(r => r.status === 'rejected').length}         color="#EF4444" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">New Attraction Listing Requests</h2>
                <span className="text-sm text-gray-400">{attractionReqs.length} total</span>
              </div>
              {loadingAR ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} /></div>
              ) : attractionReqs.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <MapPin className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">No attraction requests yet</p>
                  <p className="text-xs mt-1">Requests submitted by LBO owners appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">LBO</th>
                      <th className="px-5 py-3 text-left">Attraction Name</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Description</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {attractionReqs.map(req => {
                        const status = req.status || 'pending';
                        const statusColor = status === 'approved' ? 'bg-green-50 text-green-700'
                          : status === 'rejected'        ? 'bg-red-50 text-red-600'
                          : status === 'editor_reviewed' ? 'bg-blue-50 text-blue-700'
                          : 'bg-yellow-50 text-yellow-700';
                        const statusLabel = status === 'editor_reviewed' ? 'Under Review'
                          : status.charAt(0).toUpperCase() + status.slice(1);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">{req.lbo_name || '—'}</p>
                              <p className="text-xs text-gray-400">{req.lbo_email}</p>
                              <p className="text-xs text-gray-300">{req.business_name}</p>
                            </td>
                            <td className="px-5 py-4 font-medium text-gray-800">{req.attraction_name}</td>
                            <td className="px-5 py-4">
                              {req.category && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                                  style={{ backgroundColor: `${TYPE_COLORS[req.category] || '#94a3b8'}22`, color: TYPE_COLORS[req.category] || '#64748b' }}>
                                  {TYPE_LABELS[req.category] || req.category}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 max-w-[200px]">
                              <p className="text-xs text-gray-500 line-clamp-2">{req.description || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                              {req.editor_notes  && <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">Editor: {req.editor_notes}</p>}
                              {req.officer_notes && <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">Officer: {req.officer_notes}</p>}
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                              {req.created_at ? new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2 flex-wrap">
                                {/* Editor: pending → editor_reviewed or rejected */}
                                {(isAdmin || isChatoEditor) && status === 'pending' && (
                                  <>
                                    <button onClick={() => { setArActionModal({ req, action: 'editor_reviewed' }); setArNotes(''); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                                      style={{ backgroundColor: '#3B82F6' }}>
                                      Mark Reviewed
                                    </button>
                                    <button onClick={() => { setArActionModal({ req, action: 'rejected' }); setArNotes(''); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {/* Officer: editor_reviewed → approved or rejected */}
                                {(isAdmin || isChatoOfficer) && status === 'editor_reviewed' && (
                                  <>
                                    <button onClick={() => { setArActionModal({ req, action: 'approved' }); setArNotes(''); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                                      style={{ backgroundColor: '#10B981' }}>
                                      Approve
                                    </button>
                                    <button onClick={() => { setArActionModal({ req, action: 'rejected' }); setArNotes(''); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS ─────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <TableWrap title="CMS Audit Logs" count={auditLogs.length} loading={loadingAudit} empty={auditLogs.length === 0} emptyIcon={<Activity className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Event</th>
                <th className="px-5 py-3 text-left">Entry</th>
                <th className="px-5 py-3 text-left">Model</th>
                <th className="px-5 py-3 text-left">Performed By</th>
                <th className="px-5 py-3 text-left">When</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${EVENT_COLOR[log.event] || 'bg-gray-100 text-gray-600'}`}>
                        {log.event}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">{log.entry_title}</p>
                      <p className="text-xs text-gray-400 font-mono">{log.model}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{log.model}</span>
                    </td>
                    <td className="px-5 py-4">
                      {log.performed_by ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#00BFB3' }}>
                            {log.performed_by[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 truncate max-w-[140px]">{log.performed_by}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />{fmt(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}

        {/* ── REPORTS ──────────────────────────────────────── */}
        {activeTab === 'reports' && (() => {
          const now = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
          const generated = `Generated ${now}`;

          // ── Ratings summary ──
          const ratingsByAttr: Record<string, { name: string; count: number; total: number }> = {};
          reviews.forEach((r: any) => {
            const name = r.attributes?.attraction_name || r.attributes?.attraction?.data?.attributes?.name || 'Unknown';
            if (!ratingsByAttr[name]) ratingsByAttr[name] = { name, count: 0, total: 0 };
            ratingsByAttr[name].count++;
            ratingsByAttr[name].total += Number(r.attributes?.rating || 0);
          });
          const ratingsRows = Object.values(ratingsByAttr);
          const avgRating = reviews.length
            ? (reviews.reduce((s: number, r: any) => s + Number(r.attributes?.rating || 0), 0) / reviews.length).toFixed(2)
            : '—';

          // ── Submissions summary ──
          const subByType: Record<string, number> = {};
          submissions.forEach(s => { const t = s.attributes?.type || 'other'; subByType[t] = (subByType[t] || 0) + 1; });

          // ── Visitor records summary ──
          const vrByAttr: Record<string, number> = {};
          visitorRecords.forEach((v: any) => { const k = v.attraction_name || 'Unknown'; vrByAttr[k] = (vrByAttr[k] || 0) + (Number(v.visitor_count) || 1); });
          const totalVisitors = visitorRecords.reduce((s: number, v: any) => s + (Number(v.visitor_count) || 1), 0);

          const ReportCard = ({ title, sub, value, color }: { title: string; sub: string; value: string | number; color: string }) => (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          );

          const SectionHeader = ({ title, filename, headers, rows }: { title: string; filename: string; headers: string[]; rows: (string|number)[][] }) => (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">{title}</h3>
              <button
                onClick={() => downloadCSV(filename, headers, rows)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          );

          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                    <BarChart2 className="w-5 h-5" style={{ color: '#1565C0' }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Summary Reports</p>
                    <p className="text-xs text-gray-400">{generated} · All data is live from the system</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const allRows: (string|number)[][] = [
                      ['Section','Metric','Value'],
                      ['Analytics','Page Views', analytics?.pageViews ?? 0],
                      ['Analytics','Unique Visitors', analytics?.uniqueVisitors ?? 0],
                      ['Analytics','Bounce Rate', analytics?.bounceRate ?? '—'],
                      ['Ratings','Total Reviews', reviews.length],
                      ['Ratings','Average Rating', avgRating],
                      ...ratingsRows.map(r => ['Ratings', r.name, (r.total / r.count).toFixed(2)]),
                      ['Submissions','Total', submissions.length],
                      ...Object.entries(subByType).map(([t, c]) => ['Submissions', t, c]),
                      ['Visitor Records','Total Visitors', totalVisitors],
                      ...Object.entries(vrByAttr).map(([a, c]) => ['Visitor Records', a, c]),
                    ];
                    downloadCSV(`liliw-full-report-${Date.now()}.csv`, ['Section','Metric','Value'], allRows.slice(1));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: 'linear-gradient(135deg,#1565C0,#0B3D91)', boxShadow: '0 4px 14px rgba(21,101,192,.3)' }}>
                  <Download className="w-4 h-4" /> Export Full Report
                </button>
              </div>

              {/* ── Stat overview ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ReportCard title="Page Views"      sub="Total tracked views"    value={(analytics?.pageViews ?? 0).toLocaleString()} color="#1565C0" />
                <ReportCard title="Unique Visitors" sub="Distinct sessions"      value={(analytics?.uniqueVisitors ?? 0).toLocaleString()} color="#0B3D91" />
                <ReportCard title="Total Reviews"   sub="Attraction ratings"     value={reviews.length} color="#F59E0B" />
                <ReportCard title="Avg Rating"      sub="Across all attractions" value={avgRating} color="#10B981" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ReportCard title="Total Visitors"   sub="From LBO visitor logs" value={totalVisitors.toLocaleString()} color="#8B5CF6" />
                <ReportCard title="Submissions"      sub="Inquiries & feedback"  value={submissions.length} color="#EC4899" />
                <ReportCard title="Participations"   sub="Community engagements" value={participation.length} color="#00BFB3" />
                <ReportCard title="Event Sign-ups"   sub="Event registrations"   value={signups.length} color="#F97316" />
              </div>

              {/* ── Ratings by attraction ── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionHeader
                  title="Ratings by Attraction"
                  filename={`ratings-report-${Date.now()}.csv`}
                  headers={['Attraction', 'Total Reviews', 'Average Rating']}
                  rows={ratingsRows.map(r => [r.name, r.count, (r.total / r.count).toFixed(2)])} />
                {ratingsRows.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No ratings data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Attraction</th>
                        <th className="px-4 py-3 text-center">Reviews</th>
                        <th className="px-4 py-3 text-center">Avg Rating</th>
                        <th className="px-4 py-3 text-left">Distribution</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {ratingsRows.sort((a,b) => b.count - a.count).map(r => {
                          const avg = r.total / r.count;
                          return (
                            <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{r.count}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold" style={{ color: avg >= 4 ? '#10B981' : avg >= 3 ? '#F59E0B' : '#EF4444' }}>
                                  {avg.toFixed(1)} ★
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div className="h-2 rounded-full transition-all" style={{ width: `${(avg / 5) * 100}%`, backgroundColor: avg >= 4 ? '#10B981' : avg >= 3 ? '#F59E0B' : '#EF4444' }} />
                                  </div>
                                  <span className="text-xs text-gray-400 w-8">{((avg/5)*100).toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Submissions by type ── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionHeader
                  title="Submissions & Inquiries"
                  filename={`submissions-report-${Date.now()}.csv`}
                  headers={['Type', 'Count', 'Percentage']}
                  rows={Object.entries(subByType).map(([t, c]) => [t, c, `${((c/submissions.length)*100).toFixed(1)}%`])} />
                {submissions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No submissions yet</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(subByType).map(([type, count]) => (
                      <div key={type} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                        <p className="text-2xl font-black text-gray-800">{count}</p>
                        <p className="text-xs font-semibold text-gray-500 capitalize mt-1">{type}</p>
                        <p className="text-[11px] text-gray-400">{((count/submissions.length)*100).toFixed(0)}% of total</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Visitor records by attraction ── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionHeader
                  title="Visitor Records by Attraction"
                  filename={`visitor-records-report-${Date.now()}.csv`}
                  headers={['Attraction', 'Total Visitors']}
                  rows={Object.entries(vrByAttr).map(([a, c]) => [a, c])} />
                {Object.keys(vrByAttr).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No visitor records yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Attraction</th>
                        <th className="px-4 py-3 text-center">Total Visitors</th>
                        <th className="px-4 py-3 text-left">Share</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.entries(vrByAttr).sort((a,b) => b[1]-a[1]).map(([attr, cnt]) => (
                          <tr key={attr} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{attr}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700">{cnt.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div className="h-2 rounded-full" style={{ width: `${totalVisitors ? (cnt/totalVisitors)*100 : 0}%`, backgroundColor: '#1565C0' }} />
                                </div>
                                <span className="text-xs text-gray-400 w-10">{totalVisitors ? ((cnt/totalVisitors)*100).toFixed(0) : 0}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Analytics top pages ── */}
              {analytics?.topPages && analytics.topPages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <SectionHeader
                    title="Top Pages (Analytics)"
                    filename={`analytics-pages-report-${Date.now()}.csv`}
                    headers={['Page', 'Views']}
                    rows={analytics.topPages.map(p => [p.path, p.views])} />
                  <div className="space-y-2">
                    {analytics.topPages.map(p => (
                      <div key={p.path} className="flex items-center gap-3">
                        <p className="text-sm text-gray-700 font-medium w-48 truncate">{p.path}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(p.views / (analytics.topPages[0]?.views || 1)) * 100}%`, backgroundColor: '#0B3D91' }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-16 text-right">{p.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── ONLINE REVIEWS (Apify / Google Maps) ─────────── */}
        {activeTab === 'externalreviews' && (() => {
          const handleScrape = async (attr: Attraction) => {
            const id = attr.strapiId;
            setScrapingId(id);
            setScrapeMsg(null);
            try {
              const c = attr.attributes.coordinates;
              const lat = c?.latitude ?? c?.lat ?? null;
              const lng = c?.longitude ?? c?.lng ?? null;

              // Start the run
              const startRes = await fetch('/api/admin/scrape-reviews', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ strapiId: id, attractionName: attr.attributes.name, lat, lng }),
              });
              const { runId, error: startErr } = await startRes.json();
              if (!startRes.ok || !runId) throw new Error(startErr || 'Failed to start scrape');

              // Poll until done (max 3 min)
              const deadline = Date.now() + 180_000;
              while (Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 4000));
                const pollRes = await fetch(
                  `/api/admin/scrape-reviews?runId=${runId}&strapiId=${id}&attractionName=${encodeURIComponent(attr.attributes.name)}`
                );
                const poll = await pollRes.json();
                if (poll.status === 'SUCCEEDED') {
                  if (!poll.result) {
                    setScrapeMsg({ id, ok: false, text: poll.message || 'No matching place found on Google Maps' });
                  } else {
                    // Refresh cached data
                    fetch('/api/admin/external-reviews').then(r => r.json()).then(d => setExternalReviews(d.data || []));
                    setScrapeMsg({ id, ok: true, text: `Done! Found ${poll.result.reviewCount} reviews · ${poll.result.googleRating}★` });
                  }
                  break;
                }
                if (poll.status === 'FAILED' || poll.status === 'ABORTED') {
                  setScrapeMsg({ id, ok: false, text: 'Apify run failed. Try again.' });
                  break;
                }
              }
            } catch (e: any) {
              setScrapeMsg({ id, ok: false, text: e.message || 'Network error' });
            } finally {
              setScrapingId(null);
              setTimeout(() => setScrapeMsg(null), 6000);
            }
          };

          const cachedMap = Object.fromEntries(externalReviews.map(r => [r.strapi_id, r]));

          const handleScrapeAll = async () => {
            const unscraped = attractions.filter(a => !cachedMap[a.strapiId]);
            if (unscraped.length === 0) return;
            setScrapeAllActive(true);
            setScrapeAllProgress({ current: 0, total: unscraped.length });

            // Start all runs in parallel
            const runs = await Promise.all(unscraped.map(async attr => {
              try {
                const c = attr.attributes.coordinates;
                const lat = c?.latitude ?? c?.lat ?? null;
                const lng = c?.longitude ?? c?.lng ?? null;
                const res = await fetch('/api/admin/scrape-reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ strapiId: attr.strapiId, attractionName: attr.attributes.name, lat, lng }),
                });
                const { runId } = await res.json();
                return { attr, runId: runId || null };
              } catch { return { attr, runId: null }; }
            }));

            // Poll all in parallel until each finishes
            let completed = 0;
            await Promise.all(runs.filter(r => r.runId).map(async ({ attr, runId }) => {
              const deadline = Date.now() + 300_000;
              while (Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 5000));
                try {
                  const poll = await fetch(
                    `/api/admin/scrape-reviews?runId=${runId}&strapiId=${attr.strapiId}&attractionName=${encodeURIComponent(attr.attributes.name)}`
                  ).then(r => r.json());
                  if (poll.status === 'SUCCEEDED' || poll.status === 'FAILED' || poll.status === 'ABORTED') {
                    completed++;
                    setScrapeAllProgress(p => ({ ...p, current: completed }));
                    break;
                  }
                } catch {}
              }
            }));

            fetch('/api/admin/external-reviews').then(r => r.json()).then(d => setExternalReviews(d.data || []));
            setScrapeAllActive(false);
            setScrapeAllProgress({ current: 0, total: 0 });
          };

          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-gray-900">Online Reviews — Google Maps</h2>
                  <p className="text-xs text-gray-400 mt-1">Fetch real visitor reviews from Google Maps for each attraction using Apify. Data is cached and updated on each scrape.</p>
                </div>
                <button onClick={handleScrapeAll}
                  disabled={scrapeAllActive || !!scrapingId}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                  {scrapeAllActive
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Scraping {scrapeAllProgress.current}/{scrapeAllProgress.total}…</>
                    : <><RefreshCw className="w-4 h-4" /> Scrape All ({attractions.filter(a => !cachedMap[a.strapiId]).length} remaining)</>}
                </button>
              </div>

              {scrapeAllActive && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-700">Scraping all attractions via Apify…</p>
                    <p className="text-sm font-bold text-blue-900">{scrapeAllProgress.current} / {scrapeAllProgress.total}</p>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${scrapeAllProgress.total ? (scrapeAllProgress.current / scrapeAllProgress.total) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-blue-500 mt-2">This may take several minutes. Keep this tab open.</p>
                </div>
              )}

              {loadingAttr || loadingExternal ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} />
                </div>
              ) : attractions.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center text-gray-400">
                  <MapPin className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">No attractions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attractions.map(attr => {
                    const cached   = cachedMap[attr.strapiId];
                    const isScraping = scrapingId === attr.strapiId;
                    const msg      = scrapeMsg?.id === attr.strapiId ? scrapeMsg : null;
                    const isExpanded = expandedReview === attr.strapiId;
                    const c        = attr.attributes.coordinates;
                    const hasCoords = !!(c?.latitude ?? c?.lat);

                    return (
                      <div key={attr.strapiId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                          {/* Attraction info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm">{attr.attributes.name}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white capitalize"
                                style={{ backgroundColor: attr.type === 'heritage' ? '#F59E0B' : attr.type === 'spot' ? '#3B82F6' : '#EF4444' }}>
                                {attr.type}
                              </span>
                              {!hasCoords && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">No coordinates</span>
                              )}
                            </div>
                            {attr.attributes.location && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{attr.attributes.location}</p>
                            )}
                          </div>

                          {/* Cached rating */}
                          {cached ? (
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-center">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                                  <span className="font-bold text-gray-900">{cached.google_rating ?? '—'}</span>
                                </div>
                                <p className="text-xs text-gray-400">{(cached.review_count ?? 0).toLocaleString()} reviews</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Last scraped</p>
                                <p className="text-xs font-semibold text-gray-600">
                                  {cached.last_scraped_at ? new Date(cached.last_scraped_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 shrink-0 italic">Not scraped yet</p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {cached && (cached.reviews as any[]).length > 0 && (
                              <button onClick={() => setExpandedReview(isExpanded ? null : attr.strapiId)}
                                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center gap-1">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                Reviews
                              </button>
                            )}
                            <button onClick={() => handleScrape(attr)}
                              disabled={isScraping || !!scrapingId}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition hover:opacity-90 disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                              {isScraping
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scraping…</>
                                : <><RefreshCw className="w-3.5 h-3.5" /> {cached ? 'Re-scrape' : 'Scrape Now'}</>}
                            </button>
                          </div>
                        </div>

                        {/* Status message */}
                        {(isScraping || msg) && (
                          <div className={`px-5 py-2.5 text-xs font-semibold border-t flex items-center gap-2 ${
                            isScraping ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            msg?.ok    ? 'bg-green-50 border-green-100 text-green-700' :
                                         'bg-red-50 border-red-100 text-red-600'}`}>
                            {isScraping
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching reviews from Google Maps via Apify — this may take up to 2 minutes…</>
                              : msg?.ok
                                ? <><CheckCircle className="w-3.5 h-3.5" /> {msg.text}</>
                                : <><AlertCircle className="w-3.5 h-3.5" /> {msg?.text}</>}
                          </div>
                        )}

                        {/* Expanded reviews */}
                        {isExpanded && cached && (cached.reviews as any[]).length > 0 && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {(cached.reviews as any[]).map((rev: any, i: number) => (
                              <div key={i} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{rev.author || 'Anonymous'}</span>
                                      <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                          <Star key={s} className={`w-3 h-3 ${s <= (rev.rating||0) ? 'fill-amber-400 stroke-amber-400' : 'fill-gray-200 stroke-gray-200'}`} />
                                        ))}
                                      </div>
                                    </div>
                                    {rev.text && <p className="text-sm text-gray-600 leading-relaxed">{rev.text}</p>}
                                  </div>
                                  {rev.published && (() => {
                                    const d = new Date(rev.published);
                                    const label = isNaN(d.getTime()) ? rev.published : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                                    return <span className="text-xs text-gray-400 shrink-0">{label}</span>;
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ── LBO REGISTER MODAL ───────────────────────────── */}
      {lboRegModal && (() => {
        const a = lboRegModal.attributes || lboRegModal;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setLboRegModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Register LBO Account</h2>
                  <p className="text-xs text-gray-400">{a.business_name} · {a.email}</p>
                </div>
              </div>

              {/* Attraction assignment */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Assign to Existing Attraction <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Applied for: <span className="font-semibold text-gray-600">{a.attraction_name || '—'}</span></p>
                <div className="relative">
                  <input
                    type="text"
                    value={attrPickerQuery}
                    onChange={e => { setAttrPickerQuery(e.target.value); setPickedAttraction(null); setAttrPickerOpen(true); }}
                    onFocus={() => setAttrPickerOpen(true)}
                    placeholder="Search attractions…"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  {pickedAttraction && (
                    <button type="button" onClick={() => { setPickedAttraction(null); setAttrPickerQuery(''); setAttrPickerOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {attrPickerOpen && attrPickerQuery && !pickedAttraction && (() => {
                    const results = attractions.filter(attr =>
                      attr.attributes.name.toLowerCase().includes(attrPickerQuery.toLowerCase())
                    ).slice(0, 8);
                    return results.length > 0 ? (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {results.map(attr => (
                          <button key={attr.id} type="button"
                            onClick={() => { setPickedAttraction(attr); setAttrPickerQuery(attr.attributes.name); setAttrPickerOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 flex items-center gap-2.5 transition">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white shrink-0"
                              style={{ backgroundColor: TYPE_COLORS[attr.type] }}>{TYPE_LABELS[attr.type]}</span>
                            {attr.attributes.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs text-gray-400">
                        No attractions found matching "{attrPickerQuery}"
                      </div>
                    );
                  })()}
                </div>
                {pickedAttraction && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="text-xs text-teal-700 font-semibold">{pickedAttraction.attributes.name}</span>
                    <span className="text-xs text-teal-500">({TYPE_LABELS[pickedAttraction.type]})</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email (pre-filled from application)</label>
                  <input type="text" value={a.email || ''} readOnly
                    className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Username</label>
                  <input type="text" value={lboRegForm.username}
                    onChange={e => setLboRegForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Username for login" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                  <input type="password" value={lboRegForm.password}
                    onChange={e => setLboRegForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Minimum 6 characters" />
                </div>
              </div>

              {lboRegMsg && (
                <p className={`text-xs font-semibold mb-4 flex items-center gap-1.5 ${lboRegMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {lboRegMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {lboRegMsg.text}
                </p>
              )}

              <div className="flex gap-2">
                <button onClick={() => setLboRegModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleLboRegister}
                  disabled={savingLboReg || !lboRegForm.username || lboRegForm.password.length < 6}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#10B981' }}>
                  {savingLboReg ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Key className="w-4 h-4" /> Create Account</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LBO REJECT MODAL ─────────────────────────────── */}
      {rejectModal && (() => {
        const a = rejectModal.attributes || rejectModal;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Application</h2>
              <p className="text-xs text-gray-400 mb-5">{a.business_name} · {a.email}</p>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason / Notes (optional)</label>
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  placeholder="Reason for rejection…" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleLboRejectConfirm} disabled={savingReject}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: '#EF4444' }}>
                  {savingReject ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CHANGE REQUEST ACTION MODAL ─────────────────── */}
      {crActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCrActionModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${crActionModal.action === 'done' ? 'bg-green-50' : 'bg-red-50'}`}>
                {crActionModal.action === 'done'
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <X className="w-5 h-5 text-red-600" />
                }
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {crActionModal.action === 'done' ? 'Mark as Done' : 'Reject Request'}
                </h2>
                <p className="text-xs text-gray-400">{crActionModal.cr.attraction_name} · {crActionModal.cr.field_to_change}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Requested by</span><p className="text-gray-800 mt-0.5">{crActionModal.cr.lbo_name} ({crActionModal.cr.lbo_email})</p></div>
              <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Change</span><p className="text-gray-800 mt-0.5">{crActionModal.cr.field_to_change}: <span className="line-through text-gray-400">{crActionModal.cr.current_value || '—'}</span> → {crActionModal.cr.requested_value}</p></div>
              {crActionModal.cr.reason && <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reason</span><p className="text-gray-600 mt-0.5">{crActionModal.cr.reason}</p></div>}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Editor Notes (optional)</label>
              <textarea value={crNotes} onChange={e => setCrNotes(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                placeholder={crActionModal.action === 'done' ? 'e.g. Updated in Strapi CMS' : 'e.g. Insufficient information provided'} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCrActionModal(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleCRUpdate} disabled={savingCR}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: crActionModal.action === 'done' ? '#10B981' : '#EF4444' }}>
                {savingCR ? <Loader2 className="w-4 h-4 animate-spin" /> : crActionModal.action === 'done' ? <><CheckCircle className="w-4 h-4" /> Mark Done</> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTRACTION REQUEST ACTION MODAL ─────────────── */}
      {arActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setArActionModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${arActionModal.action === 'approved' ? 'bg-green-50' : arActionModal.action === 'editor_reviewed' ? 'bg-blue-50' : 'bg-red-50'}`}>
                {arActionModal.action === 'approved'        ? <CheckCircle className="w-5 h-5 text-green-600" />
                 : arActionModal.action === 'editor_reviewed' ? <Eye className="w-5 h-5 text-blue-600" />
                 : <X className="w-5 h-5 text-red-600" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {arActionModal.action === 'approved' ? 'Approve Request'
                   : arActionModal.action === 'editor_reviewed' ? 'Mark as Reviewed'
                   : 'Reject Request'}
                </h2>
                <p className="text-xs text-gray-400">{arActionModal.req.attraction_name} · {arActionModal.req.lbo_name}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">LBO</span><p className="text-gray-800 mt-0.5">{arActionModal.req.lbo_name} ({arActionModal.req.lbo_email})</p></div>
              <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Attraction</span><p className="text-gray-800 mt-0.5">{arActionModal.req.attraction_name}</p></div>
              {arActionModal.req.category && <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</span><p className="text-gray-800 mt-0.5 capitalize">{arActionModal.req.category}</p></div>}
              {arActionModal.req.description && <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</span><p className="text-gray-600 mt-0.5">{arActionModal.req.description}</p></div>}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {arActionModal.action === 'editor_reviewed' || (!isChatoOfficer && isAdmin) ? 'Editor Notes' : 'Officer Notes'} (optional)
              </label>
              <textarea value={arNotes} onChange={e => setArNotes(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                placeholder={arActionModal.action === 'approved' ? 'e.g. Will create the listing in Strapi shortly' : arActionModal.action === 'editor_reviewed' ? 'e.g. Verified business registration' : 'e.g. Insufficient documentation'} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setArActionModal(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleARUpdate} disabled={savingAR}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: arActionModal.action === 'approved' ? '#10B981' : arActionModal.action === 'editor_reviewed' ? '#3B82F6' : '#EF4444' }}>
                {savingAR ? <Loader2 className="w-4 h-4 animate-spin" />
                 : arActionModal.action === 'approved'        ? <><CheckCircle className="w-4 h-4" /> Approve</>
                 : arActionModal.action === 'editor_reviewed' ? <><Eye className="w-4 h-4" /> Mark Reviewed</>
                 : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ──────────────────────────── */}
      {pwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPwdModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-xs text-gray-400 mb-5">{pwdModal.email}</p>

            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={pwdInput}
              onChange={e => setPwdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 mb-3"
            />

            {pwdMsg && (
              <p className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${pwdMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {pwdMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {pwdMsg.text}
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setPwdModal(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={savingPwd || pwdInput.length < 6}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: '#00BFB3' }}>
                {savingPwd ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
