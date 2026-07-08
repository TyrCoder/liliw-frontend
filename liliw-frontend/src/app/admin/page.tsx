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
  Download, BarChart2, Plus, Trash2, ArrowUp, ArrowDown, ClipboardList, Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BadgeSVG, { BADGE_ICONS } from '@/components/BadgeSVG';
import * as XLSX from 'xlsx-js-style';

/* ─── types ──────────────────────────────────────────────── */
interface Submission { id: any; attributes: { name: string; email: string; phone: string; message: string; type: string; status: string; createdAt: string }; }
interface EventSignup { id: any; attributes: { full_name: string; email: string; phone: string; notes: string; username: string; status: string; createdAt: string; event: { data: { id: number; attributes: { title: string; date_start: string } } } }; }
interface Analytics { pageViews: number; uniqueVisitors: number; avgSessionTime: string; bounceRate: string; topPages: { path: string; views: number }[]; devices?: { desktop: { count: number; pct: number }; mobile: { count: number; pct: number }; tablet: { count: number; pct: number } }; }
interface AuditLog { id: string; event: string; model: string; uid?: string; entry_id: string; entry_title: string; performed_by?: string; changes?: any; created_at: string; }
interface StrapiActivity { id: string; contentType: string; entryName: string; action: string; at: string; performer: { name: string; email: string; role: string } | null; }
interface Participation { id: string; full_name: string; email: string; phone?: string; type?: string; message?: string; created_at: string; }
interface Attraction { id: string; strapiId: string; type: 'heritage' | 'spot' | 'dining'; attributes: { name: string; location?: string; category?: string; rating?: number; photos?: any[]; coordinates?: { latitude?: number; longitude?: number; lat?: number; lng?: number } }; }

type Tab = 'overview' | 'users' | 'roles' | 'achievements' | 'lbo' | 'changerequests' | 'visitorrecords' | 'attractionrequests' | 'submissions' | 'participation' | 'signups' | 'attractions' | 'ratings' | 'audit' | 'reports' | 'externalreviews' | 'eventforms' | 'eventresponses';

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  event_count: 'Event sign-ups',
  review_count: 'Reviews written',
  attraction_visit_count: 'Tourist spots visited',
  total_points: 'Total points earned',
};

type FieldType = 'short_text' | 'paragraph' | 'number' | 'dropdown' | 'multiple_choice' | 'checkboxes';
interface FormField { id: string; type: FieldType; label: string; required: boolean; options: string[]; }
const FIELD_TYPE_LABELS: Record<FieldType, string> = { short_text: 'Short Text', paragraph: 'Paragraph', number: 'Number', dropdown: 'Dropdown', multiple_choice: 'Multiple Choice', checkboxes: 'Checkboxes' };
const FIELD_TYPES: FieldType[] = ['short_text', 'paragraph', 'number', 'dropdown', 'multiple_choice', 'checkboxes'];
function makeField(): FormField { return { id: `f_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'short_text', label: '', required: false, options: [] }; }

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

/* ─── excel styles ────────────────────────────────────────── */
const XL_BORDER = { top:{style:'thin',color:{rgb:'E5E7EB'}}, bottom:{style:'thin',color:{rgb:'E5E7EB'}}, left:{style:'thin',color:{rgb:'E5E7EB'}}, right:{style:'thin',color:{rgb:'E5E7EB'}} };
const XL_BORDER_GOLD_BOTTOM = { ...XL_BORDER, bottom:{style:'medium',color:{rgb:'F5C518'}} };
const XL_BORDER_NAVY_TOP = { ...XL_BORDER, top:{style:'medium',color:{rgb:'0B3D91'}}, bottom:{style:'medium',color:{rgb:'0B3D91'}} };
const XL_STYLES = {
  titleBlue:   { font:{bold:true,sz:14,color:{rgb:'FFFFFF'}}, fill:{patternType:'solid',fgColor:{rgb:'0B3D91'}}, alignment:{horizontal:'center',vertical:'center'} },
  titleFill:   { fill:{patternType:'solid',fgColor:{rgb:'0B3D91'}} },
  subtitleFill:{ font:{italic:true,sz:10,color:{rgb:'4B5563'}}, fill:{patternType:'solid',fgColor:{rgb:'EFF6FF'}}, alignment:{horizontal:'center'} },
  subtitleRest:{ fill:{patternType:'solid',fgColor:{rgb:'EFF6FF'}} },
  header:      { font:{bold:true,sz:10,color:{rgb:'FFFFFF'}}, fill:{patternType:'solid',fgColor:{rgb:'0B3D91'}}, alignment:{horizontal:'center',vertical:'center',wrapText:true}, border:XL_BORDER_GOLD_BOTTOM },
  section:     (bg: string) => ({ font:{bold:true,sz:10,color:{rgb:'1A237E'}}, fill:{patternType:'solid',fgColor:{rgb:bg}}, border:XL_BORDER }),
  dataEven:    { fill:{patternType:'solid',fgColor:{rgb:'F0F5FF'}}, border:XL_BORDER },
  dataOdd:     { fill:{patternType:'solid',fgColor:{rgb:'FFFFFF'}}, border:XL_BORDER },
  totalRow:    { font:{bold:true,color:{rgb:'0B3D91'}}, fill:{patternType:'solid',fgColor:{rgb:'FEF08A'}}, border:XL_BORDER_NAVY_TOP, alignment:{horizontal:'center'} },
  totalName:   { font:{bold:true,color:{rgb:'0B3D91'}}, fill:{patternType:'solid',fgColor:{rgb:'FEF08A'}}, border:XL_BORDER_NAVY_TOP },
};
const XL_SECTION_BG: Record<string,string> = {
  'Analytics':'DBEAFE', 'Ratings':'FEF9C3', 'Submissions':'F3E8FF', 'Visitor Records':'D1FAE5',
};
function xlStyle(ws: any, r: number, c: number, s: any) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (ws[addr]) ws[addr].s = s;
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

const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage', spot: 'Spot', dining: 'Dining' };
const TYPE_COLORS: Record<string, string> = { heritage: '#F59E0B', spot: '#3B82F6', dining: '#EF4444' };

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
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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
  const [auditLogs,       setAuditLogs]       = useState<AuditLog[]>([]);
  const [strapiActivity,  setStrapiActivity]  = useState<StrapiActivity[]>([]);
  const [liveVisitors,    setLiveVisitors]    = useState<{ session_id: string; page: string; device: string; last_seen: string }[]>([]);

  const [loadingSubs,      setLoadingSubs]      = useState(true);
  const [loadingPart,      setLoadingPart]      = useState(true);
  const [loadingSignups,   setLoadingSignups]   = useState(true);
  const [loadingStats,     setLoadingStats]     = useState(true);
  const [loadingReviews,   setLoadingReviews]   = useState(true);
  const [loadingUsers,     setLoadingUsers]     = useState(false);
  const [loadingAttr,      setLoadingAttr]      = useState(true);
  const [loadingAudit,     setLoadingAudit]     = useState(true);
  const [loadingActivity,  setLoadingActivity]  = useState(true);

  const [roleUsers,     setRoleUsers]     = useState<any[]>([]);
  const [availRoles,    setAvailRoles]    = useState<any[]>([]);
  const [loadingRoles,  setLoadingRoles]  = useState(true);
  const [savingRole,    setSavingRole]    = useState<number | null>(null);
  const [roleMsg,       setRoleMsg]       = useState<{ id: number; ok: boolean; text: string } | null>(null);
  const [pwdModal,      setPwdModal]      = useState<{ id: number; email: string } | null>(null);
  const [pwdInput,      setPwdInput]      = useState('');
  const [savingPwd,     setSavingPwd]     = useState(false);
  const [pwdMsg,        setPwdMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  const [achievements,  setAchievements]  = useState<any[]>([]);
  const [loadingAch,    setLoadingAch]    = useState(true);
  const [achForm,       setAchForm]       = useState<{
    id: string | null; name: string; description: string; icon: string; badge_color: string;
    trigger_type: string; trigger_value: number; points_reward: number; sort_order: number; is_active: boolean;
  }>({ id: null, name: '', description: '', icon: '🏆', badge_color: '#F59E0B', trigger_type: 'event_count', trigger_value: 1, points_reward: 10, sort_order: 0, is_active: true });
  const [savingAch,     setSavingAch]     = useState(false);
  const [achMsg,        setAchMsg]        = useState<{ ok: boolean; text: string } | null>(null);
  const [deletingAchId, setDeletingAchId] = useState<string | null>(null);

  const [lboApps,       setLboApps]       = useState<any[]>([]);
  const [loadingLbo,    setLoadingLbo]    = useState(false);
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

  const [attrSearch,      setAttrSearch]      = useState('');
  const [attrType,        setAttrType]        = useState<string>('all');
  const [userRoleFilter,  setUserRoleFilter]  = useState<string>('all');

  // Event forms (editor)
  const [eventForms,       setEventForms]       = useState<any[]>([]);
  const [loadingEF,        setLoadingEF]        = useState(false);
  const [joinableEvents,   setJoinableEvents]   = useState<any[]>([]);
  const [loadingJE,        setLoadingJE]        = useState(false);
  const [activeFormSlug,   setActiveFormSlug]   = useState<string | null>(null);
  const [formBuilderFields, setFormBuilderFields] = useState<FormField[]>([]);
  const [formIsActive,     setFormIsActive]     = useState(true);
  const [savingForm,       setSavingForm]       = useState(false);
  const [formSaveMsg,      setFormSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  // Event form responses (officer)
  const [efResponseData,   setEfResponseData]   = useState<{ form: any; responses: any[] } | null>(null);
  const [loadingEFR,       setLoadingEFR]       = useState(false);
  const [selectedFormId,   setSelectedFormId]   = useState<string | null>(null);

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

  // Submission / participation detail + reply state
  const [subDetailModal,  setSubDetailModal]  = useState<{ type: 'submission' | 'participation'; data: Record<string, any> } | null>(null);
  const [replyCompose,    setReplyCompose]    = useState(false);
  const [replySubject,    setReplySubject]    = useState('');
  const [replyMessage,    setReplyMessage]    = useState('');
  const [sendingReply,    setSendingReply]    = useState(false);
  const [replyResult,     setReplyResult]     = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) router.replace('/');
  }, [user, loading, isStaff, router]);

  // Set default tab based on role
  useEffect(() => {
    if (!loading && isStaff) {
      if (isChatoEditor) setActiveTab('lbo');
      else if (isChatoOfficer) setActiveTab('lbo');
    }
  }, [loading, isStaff, isChatoEditor, isChatoOfficer]);

  useEffect(() => {
    if (!isStaff || !token) return;
    const h = { Authorization: `Bearer ${token}` };

    // Editor + Officer — attractions & reviews
    fetch('/api/strapi/attractions').then(r => r.json()).then(d => setAttractions(d.data || [])).catch(() => {}).finally(() => setLoadingAttr(false));
    fetch('/api/strapi/reviews').then(r => r.json()).then(d => setReviews(d.data || [])).catch(() => {}).finally(() => setLoadingReviews(false));

    // Admin — analytics, users, audit, reports
    if (isAdmin) {
      setLoadingUsers(true);
      fetch('/api/admin/users',           { headers: h }).then(r => r.json()).then(d => setUsers(d.data || [])).catch(() => {}).finally(() => setLoadingUsers(false));
      fetch('/api/analytics/track').then(r => r.json()).then(d => setAnalytics(d)).catch(() => {}).finally(() => setLoadingStats(false));
      fetch('/api/admin/audit-logs',      { headers: h }).then(r => r.json()).then(d => setAuditLogs(d.data || [])).catch(() => {}).finally(() => setLoadingAudit(false));
      fetch('/api/admin/strapi-activity', { headers: h }).then(r => r.json()).then(d => setStrapiActivity(d.data || [])).catch(() => {}).finally(() => setLoadingActivity(false));
      fetch('/api/admin/assign-role', { headers: h }).then(r => r.json()).then(d => {
        setRoleUsers(d.users || []);
        setAvailRoles(d.roles || []);
      }).catch(() => {}).finally(() => setLoadingRoles(false));
      setLoadingAch(true);
      fetch('/api/admin/achievements', { headers: h }).then(r => r.json()).then(d => setAchievements(d.data || [])).catch(() => {}).finally(() => setLoadingAch(false));
    }

    // Officer — requests & submissions
    if (isChatoOfficer) {
      fetch('/api/admin/submissions',   { headers: h }).then(r => r.json()).then(d => setSubmissions(d.data || [])).catch(() => {}).finally(() => setLoadingSubs(false));
      fetch('/api/admin/participation',  { headers: h }).then(r => r.json()).then(d => setParticipation(d.data || [])).catch(() => {}).finally(() => setLoadingPart(false));
      fetch('/api/event-signup',         { headers: h }).then(r => r.json()).then(d => setSignups(d.data || [])).catch(() => {}).finally(() => setLoadingSignups(false));
      setLoadingVR(true);
      fetch('/api/admin/visitor-records', { headers: h }).then(r => r.json()).then(d => setVisitorRecords(d.data || [])).catch(() => {}).finally(() => setLoadingVR(false));
      setLoadingExternal(true);
      fetch('/api/admin/external-reviews', { headers: h }).then(r => r.json()).then(d => setExternalReviews(d.data || [])).catch(() => {}).finally(() => setLoadingExternal(false));
    }

    // Officer + Editor — LBO applications & change requests
    if (isChatoOfficer || isChatoEditor) {
      setLoadingLbo(true);
      fetch('/api/admin/lbo-applications',{ headers: h }).then(r => r.json()).then(d => { if (d._error) console.error('[LBO] Strapi error:', d._error, 'status:', d._status); setLboApps(d.data || []); }).catch(() => {}).finally(() => setLoadingLbo(false));
      setLoadingCR(true);
      fetch('/api/admin/change-requests', { headers: h }).then(r => r.json()).then(d => setChangeRequests(d.data || [])).catch(() => {}).finally(() => setLoadingCR(false));
    }

    // Officer + Editor — attraction requests
    setLoadingAR(true);
    fetch('/api/admin/attraction-requests', { headers: h }).then(r => r.json()).then(d => {
      if (d.error) console.error('[AttractionReqs]', d.error);
      setAttractionReqs(d.data || []);
    }).catch(() => {}).finally(() => setLoadingAR(false));

    // Editor — event forms + joinable events
    if (isChatoEditor) {
      setLoadingEF(true);
      setLoadingJE(true);
      fetch('/api/admin/event-forms', { headers: h }).then(r => r.json()).then(d => setEventForms(d.data || [])).catch(() => {}).finally(() => setLoadingEF(false));
      fetch('/api/strapi/events').then(r => r.json()).then(d => setJoinableEvents((d.data || []).filter((e: any) => e.attributes?.is_joinable || e.is_joinable).map((e: any) => ({ id: e.id, slug: e.attributes?.slug || e.slug, title: e.attributes?.title || e.title, date_start: e.attributes?.date_start || e.date_start })))).catch(() => {}).finally(() => setLoadingJE(false));
    }

    // Officer — event form list for responses viewer
    if (isChatoOfficer) {
      setLoadingEF(true);
      fetch('/api/admin/event-forms', { headers: h }).then(r => r.json()).then(d => setEventForms(d.data || [])).catch(() => {}).finally(() => setLoadingEF(false));
    }
  }, [isAdmin, isChatoOfficer, isChatoEditor, isStaff, token]);

  // Live visitors polling — every 10 seconds (admin + officer both see the overview tab)
  useEffect(() => {
    if ((!isAdmin && !isChatoOfficer) || !token) return;
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
  }, [isAdmin, isChatoOfficer, token]);

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

  const resetAchForm = () => {
    setAchForm({ id: null, name: '', description: '', icon: '🏆', badge_color: '#F59E0B', trigger_type: 'event_count', trigger_value: 1, points_reward: 10, sort_order: 0, is_active: true });
  };

  const handleAchEdit = (a: any) => {
    setAchForm({
      id: a.id, name: a.name, description: a.description, icon: a.icon, badge_color: a.badge_color,
      trigger_type: a.trigger_type, trigger_value: a.trigger_value, points_reward: a.points_reward,
      sort_order: a.sort_order, is_active: a.is_active,
    });
    setAchMsg(null);
  };

  const handleAchSave = async () => {
    if (!achForm.name.trim() || !achForm.description.trim()) { setAchMsg({ ok: false, text: 'Name and description are required' }); return; }
    setSavingAch(true); setAchMsg(null);
    try {
      const res = await fetch('/api/admin/achievements', {
        method: achForm.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(achForm),
      });
      const data = await res.json();
      if (res.ok) {
        setAchievements(prev => achForm.id
          ? prev.map(a => a.id === data.data.id ? data.data : a)
          : [...prev, data.data].sort((a, b) => a.sort_order - b.sort_order));
        setAchMsg({ ok: true, text: achForm.id ? 'Achievement updated' : 'Achievement created' });
        resetAchForm();
      } else {
        setAchMsg({ ok: false, text: data.error || 'Failed to save' });
      }
    } catch { setAchMsg({ ok: false, text: 'Network error' }); }
    setSavingAch(false);
  };

  const handleAchDelete = async (id: string) => {
    if (!confirm('Delete this achievement? Any users who already earned it will lose that record.')) return;
    setDeletingAchId(id);
    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setAchievements(prev => prev.filter(a => a.id !== id));
    } catch {}
    setDeletingAchId(null);
  };

  const handleAchToggleActive = async (a: any) => {
    const res = await fetch('/api/admin/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: a.id, is_active: !a.is_active }),
    });
    if (res.ok) {
      const data = await res.json();
      setAchievements(prev => prev.map(x => x.id === a.id ? data.data : x));
    }
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

  const handleSendReply = async () => {
    if (!subDetailModal || !replyMessage.trim()) return;
    setSendingReply(true);
    setReplyResult(null);
    try {
      const res = await fetch('/api/admin/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to:      subDetailModal.data.email,
          name:    subDetailModal.data.name || subDetailModal.data.full_name,
          subject: replySubject,
          message: replyMessage,
        }),
      });
      const d = await res.json();
      setReplyResult(d.success
        ? { ok: true,  text: `Email sent to ${subDetailModal.data.email}` }
        : { ok: false, text: d.error || 'Failed to send email' });
    } catch {
      setReplyResult({ ok: false, text: 'Network error. Please try again.' });
    }
    setSendingReply(false);
  };

  const openSubDetail = (type: 'submission' | 'participation', data: Record<string, any>) => {
    setSubDetailModal({ type, data });
    setReplyCompose(false);
    setReplyMessage('');
    setReplyResult(null);
    setReplySubject(`Re: Your ${data.type || type} inquiry to Liliw Tourism`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} /></div>;
  if (!user || !isStaff) return null;

  const newCount      = submissions.filter(s => s.attributes?.status === 'new').length;
  const feedbackCount = submissions.filter(s => s.attributes?.type === 'feedback').length;
  const volunteerCount= submissions.filter(s => s.attributes?.type === 'volunteer').length;

  const filteredAttractions = attractions.filter(a => {
    const matchType = attrType === 'all' || a.type === attrType;
    const matchSearch = !attrSearch || a.attributes.name.toLowerCase().includes(attrSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // ── Event form builder helpers ──────────────────────────────
  const openFormBuilder = (event: any) => {
    const existing = eventForms.find(f => f.event_slug === event.slug);
    setActiveFormSlug(event.slug);
    setFormBuilderFields(existing?.fields ? JSON.parse(JSON.stringify(existing.fields)) : [makeField()]);
    setFormIsActive(existing?.is_active ?? true);
    setFormSaveMsg(null);
  };

  const saveEventForm = async (event: any) => {
    if (!token) return;
    setSavingForm(true); setFormSaveMsg(null);
    try {
      const res = await fetch('/api/admin/event-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_slug: event.slug, event_title: event.title, fields: formBuilderFields, is_active: formIsActive }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setEventForms(prev => { const idx = prev.findIndex(f => f.event_slug === event.slug); return idx >= 0 ? prev.map((f,i) => i === idx ? d.data : f) : [...prev, d.data]; });
      setFormSaveMsg({ ok: true, text: 'Form saved!' });
      setActiveFormSlug(null);
    } catch (e: any) {
      setFormSaveMsg({ ok: false, text: e.message });
    } finally {
      setSavingForm(false);
    }
  };

  const loadFormResponses = async (formId: string) => {
    if (!token) return;
    setSelectedFormId(formId); setLoadingEFR(true); setEfResponseData(null);
    try {
      const res = await fetch(`/api/admin/event-forms/${formId}/responses`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (res.ok) setEfResponseData(d);
    } catch {}
    finally { setLoadingEFR(false); }
  };

  const downloadResponsesCSV = () => {
    if (!efResponseData) return;
    const { form, responses } = efResponseData;
    const fields: FormField[] = form.fields || [];
    const headers = ['Submitted At', 'Name', 'Email', ...fields.map((f: FormField) => f.label)];
    const rows = responses.map((r: any) => [
      new Date(r.submitted_at).toLocaleString(),
      r.respondent_name || '—',
      r.respondent_email || '—',
      ...fields.map((f: FormField) => { const a = r.answers?.[f.id]; return Array.isArray(a) ? a.join(', ') : (a ?? ''); }),
    ]);
    const csv = [headers, ...rows].map(row => row.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${form.event_title}-responses.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const dashboardTitle = isAdmin ? 'Admin Dashboard' : isChatoOfficer ? 'CHATO Officer Dashboard' : 'CHATO Editor Dashboard';
  const dashboardSub   = isAdmin ? 'Analytics & user management' : isChatoOfficer ? 'Requests & submissions' : 'LBO & attractions management';

  // Tab visibility per role
  const ALL_TABS: { key: Tab; label: string; badge?: number; roles: string[] }[] = [
    // Admin: analytics + user management
    { key: 'overview',           label: 'Analytics',           badge: undefined,                                                                                    roles: ['admin'] },
    { key: 'users',              label: 'Users',                badge: users.length,                                                                                 roles: ['admin'] },
    { key: 'roles',              label: 'Role Management',      badge: roleUsers.length,                                                                             roles: ['admin'] },
    { key: 'achievements',       label: 'Achievements',         badge: achievements.length,                                                                          roles: ['admin'] },
    { key: 'audit',              label: 'Audit Logs',           badge: strapiActivity.length,                                                                        roles: ['admin'] },
    { key: 'reports',            label: 'Reports',              badge: undefined,                                                                                    roles: ['admin'] },
    // Officer: all requests & submissions
    { key: 'lbo',                label: 'LBO Applications',     badge: lboApps.filter(a => (a.attributes?.status || a.status) === 'pending').length,                roles: ['officer', 'editor'] },
    { key: 'changerequests',     label: 'Change Requests',      badge: changeRequests.filter(cr => cr.status === 'pending').length,                                  roles: ['officer', 'editor'] },
    { key: 'attractionrequests', label: 'Attraction Requests',  badge: attractionReqs.filter(r => r.status === 'pending' || r.status === 'editor_reviewed').length,  roles: ['officer', 'editor'] },
    { key: 'submissions',        label: 'Submissions',          badge: newCount,                                                                                     roles: ['officer'] },
    { key: 'participation',      label: 'Participation',        badge: participation.length,                                                                         roles: ['officer'] },
    { key: 'signups',            label: 'Event Sign-ups',       badge: signups.length,                                                                               roles: ['officer'] },
    { key: 'visitorrecords',     label: 'Visitor Records',      badge: undefined,                                                                                    roles: ['officer'] },
    { key: 'externalreviews',    label: 'Online Reviews',       badge: undefined,                                                                                    roles: ['officer'] },
    { key: 'ratings',            label: 'Ratings',              badge: reviews.length,                                                                               roles: ['officer'] },
    // Editor: LBO + attractions management
    { key: 'attractions',        label: 'Attractions',          badge: attractions.length,                                                                           roles: ['editor'] },
    { key: 'eventforms',         label: 'Event Forms',          badge: eventForms.length,                                                                            roles: ['editor'] },
    // Officer: event form responses
    { key: 'eventresponses',     label: 'Event Responses',      badge: undefined,                                                                                    roles: ['officer'] },
  ];

  const myRole = isAdmin ? 'admin' : isChatoOfficer ? 'officer' : 'editor';
  const TABS = ALL_TABS.filter(t => t.roles.includes(myRole));

  const roleBadge = isAdmin ? 'Admin' : isChatoOfficer ? 'Officer' : 'Editor';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-7">
        <div className="max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-xs font-semibold mb-5 group opacity-70 hover:opacity-100 transition" style={{ color: '#1565C0' }}>
            <ChevronLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition" /> Back to Site
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,191,179,0.15)', border: '1px solid rgba(0,191,179,0.3)' }}>
                <Shield className="w-6 h-6" style={{ color: '#1565C0' }} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <h1 className="text-2xl font-bold text-white">{dashboardTitle}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border" style={{ color: '#1565C0', borderColor: 'rgba(0,191,179,0.4)', background: 'rgba(0,191,179,0.1)' }}>
                    {roleBadge}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Welcome back, <span className="text-gray-300 font-medium">{user.username}</span> · {dashboardSub}</p>
              </div>
            </div>
            <Link href="/cms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1565C0,#009E99)', boxShadow: '0 4px 14px rgba(0,191,179,.3)' }}>
              <Edit className="w-4 h-4" /> Content Management
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap gap-1">
          {TABS.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === key
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              style={activeTab === key ? { backgroundColor: '#1565C0' } : undefined}>
              {label}
              {badge !== undefined && badge > 0 && (
                <span className={`px-1.5 rounded-full text-[10px] font-bold leading-[18px] ${
                  activeTab === key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
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
              <StatCard icon={<Eye className="w-5 h-5" />}       label="Page Views"       value={loadingStats ? '—' : (analytics?.pageViews ?? 0).toLocaleString()} color="#1565C0" />
              <StatCard icon={<Users className="w-5 h-5" />}     label="Unique Visitors"  value={loadingStats ? '—' : (analytics?.uniqueVisitors ?? 0).toLocaleString()} color="#3B82F6" />
              <StatCard icon={<MapPin className="w-5 h-5" />}    label="Attractions"       value={loadingAttr ? '—' : attractions.length} sub="in Strapi" color="#F59E0B" />
              <StatCard icon={<Activity className="w-5 h-5" />}  label="CMS Changes"       value={loadingActivity ? '—' : strapiActivity.length} sub="content edits tracked" color="#6366F1" />
            </div>
            <div className={`grid grid-cols-2 lg:grid-cols-${isAdmin ? 4 : 2} gap-4`}>
              <StatCard icon={<FileText className="w-5 h-5" />}    label="Submissions"     value={loadingSubs ? '—' : submissions.length} sub={`${newCount} new`} color="#8B5CF6" />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Participations" value={loadingPart ? '—' : participation.length} sub="requests" color="#EC4899" />
              {isAdmin && <StatCard icon={<UserCheck className="w-5 h-5" />} label="Registered Users" value={loadingUsers ? '—' : users.filter((u: any) => { const rn = (u.role?.name || '').toLowerCase(); return rn.includes('authenticated') || rn.includes('tourist') || rn === ''; }).length} sub="tourist accounts" color="#10B981" />}
              {isAdmin && <StatCard icon={<Calendar className="w-5 h-5" />}  label="Event Sign-ups"   value={loadingSignups ? '—' : signups.length} sub="total" color="#F59E0B" />}
            </div>

            {/* Sync search — admin only */}
            {isAdmin && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-900">Search Index</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {syncStatus === 'done' ? `Synced ${syncCount} items to Algolia` : syncStatus === 'error' ? 'Sync failed — check Algolia credentials' : 'Sync Strapi content to Algolia for up-to-date search'}
                </p>
              </div>
              <button onClick={handleSyncSearch} disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: syncStatus === 'error' ? '#EF4444' : syncStatus === 'done' ? '#10B981' : '#1565C0' }}>
                {syncStatus === 'syncing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
                 : syncStatus === 'done' ? <><CheckCircle className="w-4 h-4" /> Synced</>
                 : syncStatus === 'error' ? <><AlertCircle className="w-4 h-4" /> Retry Sync</>
                 : <><RefreshCw className="w-4 h-4" /> Sync Search</>}
              </button>
            </div>}

            {/* Live Visitors */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Wifi className="w-5 h-5" style={{ color: '#1565C0' }} />
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
                  { label: 'Mobile',  icon: <Smartphone className="w-4 h-4" />, count: liveVisitors.filter(v => v.device === 'mobile').length,  color: '#1565C0' },
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
                  {liveVisitors.filter(v => {
                    const INTERNAL = ['/admin', '/lbo', '/login', '/register'];
                    return !INTERNAL.some(prefix => v.page === prefix || v.page?.startsWith(prefix + '/'));
                  }).map((v) => {
                    const secsAgo = Math.floor((Date.now() - new Date(v.last_seen).getTime()) / 1000);
                    const timeAgo = secsAgo < 60 ? 'just now' : secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m ago` : `${Math.floor(secsAgo / 3600)}h ago`;
                    const DeviceIcon = v.device === 'mobile' ? Smartphone : v.device === 'tablet' ? Tablet : Monitor;
                    const deviceColor = v.device === 'mobile' ? '#1565C0' : v.device === 'tablet' ? '#8B5CF6' : '#3B82F6';
                    const staticLabels: Record<string, string> = {
                      '/': 'Home', '/attractions': 'Attractions', '/map': 'Map',
                      '/about': 'About', '/heritage': 'Heritage Sites', '/dining': 'Dining',
                      '/itineraries': 'Itineraries', '/news': 'News & Events',
                      '/community': 'Community', '/immersive': 'Immersive Tour', '/stories': 'Stories',
                    };
                    const attrMatch = v.page?.match(/^\/attractions\/(.+)$/);
                    const attrName = attrMatch ? attractions.find(a => a.id === attrMatch[1])?.attributes?.name : null;
                    const pageLabel = attrName || staticLabels[v.page] || v.page || '/';
                    return (
                      <div key={v.session_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${deviceColor}18`, color: deviceColor }}>
                          <DeviceIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{pageLabel}</p>
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
                  { label: 'Volunteer',   count: volunteerCount,                                                     icon: <Users className="w-5 h-5" />,         color: '#1565C0' },
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

            {/* Recent CMS activity preview */}
            {strapiActivity.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Recent CMS Activity</h2>
                  <button onClick={() => setActiveTab('audit')} className="text-xs font-semibold" style={{ color: '#1565C0' }}>View all →</button>
                </div>
                <div className="space-y-3">
                  {strapiActivity.slice(0, 5).map(act => (
                    <div key={act.id} className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${act.action === 'created' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {act.action}
                      </span>
                      <span className="font-medium text-gray-800 truncate">{act.entryName}</span>
                      <span className="text-gray-400 text-xs shrink-0">{act.contentType}</span>
                      {act.performer && (
                        <span className="text-gray-500 text-xs shrink-0 truncate max-w-[120px]">{act.performer.email}</span>
                      )}
                      <span className="text-gray-300 text-xs ml-auto shrink-0">{new Date(act.at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top pages */}
            {analytics?.topPages && analytics.topPages.length > 0 && (() => {
              const INTERNAL = ['/admin', '/lbo', '/login', '/register'];
              const isInternal = (p: string) => INTERNAL.some(prefix => p === prefix || p.startsWith(prefix + '/'));
              const staticLabels: Record<string, string> = {
                '/': 'Home', '/attractions': 'Attractions', '/map': 'Map',
                '/about': 'About', '/heritage': 'Heritage Sites', '/dining': 'Dining',
                '/itineraries': 'Itineraries', '/news': 'News & Events',
                '/community': 'Community', '/immersive': 'Immersive Tour', '/stories': 'Stories',
              };
              const getLabel = (p: string) => {
                const attrMatch = p?.match(/^\/attractions\/(.+)$/);
                const attrName = attrMatch ? attractions.find(a => a.id === attrMatch[1])?.attributes?.name : null;
                return attrName || staticLabels[p] || p || '/';
              };
              const publicPages = analytics.topPages.filter(({ path }) => !isInternal(path));
              const max = publicPages[0]?.views || 1;
              return publicPages.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-5">Top Pages</h2>
                  <div className="space-y-3">
                    {publicPages.slice(0, 8).map(({ path, views }) => (
                      <div key={path} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-40 shrink-0 truncate">{getLabel(path)}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(views / max) * 100}%`, backgroundColor: '#1565C0' }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ── USERS ──────────────────────────────────────────── */}
        {activeTab === 'users' && (() => {
          // Build set of approved LBO emails from lbo_applications
          const approvedLboEmails = new Set(
            lboApps
              .filter((a: any) => (a.attributes?.status || a.status) === 'approved')
              .map((a: any) => ((a.attributes?.email || a.email) || '').toLowerCase())
              .filter(Boolean)
          );
          const isLbo = (u: any) => approvedLboEmails.has((u.email || '').toLowerCase());

          const ROLE_FILTERS = [
            { key: 'all',       label: 'All' },
            { key: 'lbo',       label: 'LBO / Business' },
            { key: 'tourist',   label: 'Tourist / Local' },
            { key: 'officer',   label: 'CHATO Officer' },
            { key: 'editor',    label: 'CHATO Editor' },
            { key: 'admin',     label: 'Admin' },
          ];

          const filteredUsers = users.filter((u: any) => {
            if (userRoleFilter === 'all') return true;
            const rn = (u.role?.name || '').toLowerCase().replace(/[\s_-]/g, '');
            if (userRoleFilter === 'lbo')     return isLbo(u);
            if (userRoleFilter === 'tourist') return !isLbo(u) && (rn.includes('authenticated') || rn.includes('tourist') || rn === '');
            if (userRoleFilter === 'officer') return rn.includes('chatoofficer') || rn.includes('officer');
            if (userRoleFilter === 'editor')  return rn.includes('chatoeditor')  || rn.includes('editor');
            if (userRoleFilter === 'admin')   return rn.includes('admin');
            return true;
          });

          return (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {ROLE_FILTERS.map(f => (
                <button key={f.key} onClick={() => setUserRoleFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    userRoleFilter === f.key
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                  style={userRoleFilter === f.key ? { backgroundColor: '#0B3D91', borderColor: '#0B3D91' } : {}}>
                  {f.label}
                  {f.key !== 'all' && (
                    <span className="ml-1.5 opacity-70">
                      ({users.filter((u: any) => {
                        const rn = (u.role?.name || '').toLowerCase().replace(/[\s_-]/g, '');
                        if (f.key === 'lbo')     return isLbo(u);
                        if (f.key === 'tourist') return !isLbo(u) && (rn.includes('authenticated') || rn.includes('tourist') || rn === '');
                        if (f.key === 'officer') return rn.includes('chatoofficer') || rn.includes('officer');
                        if (f.key === 'editor')  return rn.includes('chatoeditor')  || rn.includes('editor');
                        if (f.key === 'admin')   return rn.includes('admin');
                        return false;
                      }).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

          <TableWrap title="All Users" count={filteredUsers.length} loading={loadingUsers} empty={filteredUsers.length === 0} emptyIcon={<Users className="w-12 h-12" />}>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u: any) => {
                  const roleName  = u.role?.name || 'Authenticated';
                  const rn        = roleName.toLowerCase();
                  const userIsLbo = isLbo(u);
                  const isSuperAdmin = rn.includes('super admin') || rn.includes('super-admin');
                  const isOfficer   = rn.includes('officer');
                  const isEditor    = rn.includes('editor');
                  const isTourist   = rn.includes('authenticated') || rn.includes('tourist');
                  const isPanel     = u.source === 'admin';
                  const roleColor = isSuperAdmin ? { bg: 'bg-red-600 text-white',        avatar: '#DC2626' }
                    : isOfficer   ? { bg: 'bg-[#0F1F3C] text-white',                     avatar: '#0F1F3C' }
                    : isEditor    ? { bg: 'bg-purple-50 text-purple-700',                 avatar: '#8B5CF6' }
                    : userIsLbo   ? { bg: 'bg-orange-50 text-orange-700',                avatar: '#EA580C' }
                    : isTourist   ? { bg: 'bg-teal-50 text-teal-700',                    avatar: '#1565C0' }
                    :               { bg: 'bg-gray-100 text-gray-700',                   avatar: '#6B7280' };
                  const RoleIcon = isSuperAdmin ? Shield : isOfficer ? Shield : isEditor ? Edit : userIsLbo ? Building2 : UserCheck;
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor.bg}`}>
                            <RoleIcon className="w-3 h-3" />{userIsLbo && isTourist ? 'Authenticated' : roleName}
                          </span>
                          {userIsLbo && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                              <Building2 className="w-3 h-3" />LBO
                            </span>
                          )}
                        </div>
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
          </div>
          );
        })()}

        {/* ── ROLE MANAGEMENT ───────────────────────────────── */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Assign User Roles</h2>
              <p className="text-xs text-gray-400">Changes are saved immediately to Strapi. Roles come from Users &amp; Permissions.</p>
            </div>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#1565C0' }}>
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
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50">
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

        {/* ── ACHIEVEMENTS ──────────────────────────────────── */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">{achForm.id ? 'Edit Achievement' : 'Create New Achievement'}</h2>
                    <p className="text-xs text-gray-400">Any emoji you pick renders in the same badge style as the existing achievements — no image editing needed.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                      <input value={achForm.name} onChange={e => setAchForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="e.g. Weekend Wanderer" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
                      <input value={achForm.icon} onChange={e => setAchForm(f => ({ ...f, icon: e.target.value }))}
                        maxLength={20}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="🏆 or pick a vector icon below" />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(BADGE_ICONS).map(([name, Icon]) => (
                          <button key={name} type="button" title={name}
                            onClick={() => setAchForm(f => ({ ...f, icon: name }))}
                            className={`p-1.5 rounded-lg border transition ${
                              achForm.icon === name ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                            }`}>
                            <Icon size={16} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input value={achForm.description} onChange={e => setAchForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="e.g. Sign up for 2 weekend events" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Badge Color</label>
                      <input type="color" value={achForm.badge_color} onChange={e => setAchForm(f => ({ ...f, badge_color: e.target.value }))}
                        className="w-full h-9 border border-gray-200 rounded-lg cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Trigger Type</label>
                      <select value={achForm.trigger_type} onChange={e => setAchForm(f => ({ ...f, trigger_type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Threshold</label>
                      <input type="number" min={1} value={achForm.trigger_value}
                        onChange={e => setAchForm(f => ({ ...f, trigger_value: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Points Reward</label>
                      <input type="number" min={0} value={achForm.points_reward}
                        onChange={e => setAchForm(f => ({ ...f, points_reward: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>

                  {achMsg && (
                    <p className={`text-xs font-semibold flex items-center gap-1.5 ${achMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {achMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {achMsg.text}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={handleAchSave} disabled={savingAch}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                      style={{ backgroundColor: '#1565C0' }}>
                      {savingAch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {achForm.id ? 'Save Changes' : 'Create Achievement'}
                    </button>
                    {achForm.id && (
                      <button onClick={() => { resetAchForm(); setAchMsg(null); }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Live preview */}
                <div className="flex flex-col items-center gap-2 shrink-0 mx-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Preview</span>
                  <BadgeSVG icon={achForm.icon || '🏆'} color={achForm.badge_color} earned size={100} />
                </div>
              </div>
            </div>

            {loadingAch ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">All Achievements</h2>
                  <span className="text-sm text-gray-400">{achievements.length} total</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {achievements.map((a: any) => (
                    <div key={a.id} className={`flex items-center gap-4 px-6 py-4 transition ${!a.is_active ? 'opacity-50' : ''}`}>
                      <BadgeSVG icon={a.icon} color={a.badge_color} earned size={56} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                        <p className="text-xs text-gray-400 truncate">{a.description}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {TRIGGER_TYPE_LABELS[a.trigger_type] || a.trigger_type} ≥ {a.trigger_value} · +{a.points_reward} pts
                        </p>
                      </div>
                      <button onClick={() => handleAchToggleActive(a)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                          a.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {a.is_active ? 'Active' : 'Disabled'}
                      </button>
                      <button onClick={() => handleAchEdit(a)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition shrink-0" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAchDelete(a.id)} disabled={deletingAchId === a.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0 disabled:opacity-50" title="Delete">
                        {deletingAchId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                  {achievements.length === 0 && (
                    <div className="flex flex-col items-center py-16 text-center text-gray-400">
                      <p className="font-semibold">No achievements yet</p>
                    </div>
                  )}
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
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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
                <th className="px-5 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map(s => {
                  const a = s.attributes;
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                        onClick={() => openSubDetail('submission', { name: a.name, email: a.email, phone: a.phone, type: a.type, message: a.message, status: a.status, createdAt: a.createdAt })}>
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
                      <td className="px-4 py-4 text-right">
                        <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg" style={{ color: '#1565C0', backgroundColor: '#1565C010' }}>View →</span>
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
                <th className="px-5 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {participation.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => openSubDetail('participation', { full_name: p.full_name, email: p.email, phone: p.phone, type: p.type, message: p.message, created_at: p.created_at })}>
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
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg" style={{ color: '#1565C0', backgroundColor: '#1565C010' }}>View →</span>
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
            {/* CHATO Editor — Content Management link */}
            {isChatoEditor && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">Content Management</p>
                  <p className="text-xs text-gray-400 mt-0.5">Create, update, or publish content for the Liliw Tourism website</p>
                </div>
                <Link href="/cms"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#1565C0,#009E99)', boxShadow: '0 4px 16px rgba(0,191,179,.35)' }}>
                  <Edit className="w-4 h-4" /> Open CMS
                </Link>
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
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <select
                value={attrType}
                onChange={e => setAttrType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
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
                        <Link href={`/attractions/${a.id}`} target="_blank" className="font-semibold text-gray-900 hover:text-blue-600 transition flex items-center gap-1">
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
                        <Link href={`/attractions/${a.id}`} target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 text-white"
                          style={{ backgroundColor: '#1565C0' }}>
                          <ExternalLink className="w-3 h-3" /> View Page
                        </Link>
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
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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

            const NC = 16; // total columns
            const period = `${MONTHS_FULL[vrExportMonth - 1]} ${vrExportYear}`;

            const dataRows = exportRecords.map(r => {
              const lM = r.local_male||0, lF = r.local_female||0;
              const cM = r.other_city_male||0, cF = r.other_city_female||0;
              const pM = r.other_province_male||0, pF = r.other_province_female||0;
              const fM = r.foreign_male||0, fF = r.foreign_female||0;
              return [
                r.attraction_name || '—', r.lbo_email || '—', period,
                lM, lF, lM+lF, cM, cF, cM+cF,
                pM, pF, pM+pF, fM, fF, fM+fF,
                lM+lF+cM+cF+pM+pF+fM+fF,
              ];
            });

            const sum = (f: string) => exportRecords.reduce((s: number, r: any) => s + (r[f]||0), 0);
            const lMt = sum('local_male'), lFt = sum('local_female');
            const cMt = sum('other_city_male'), cFt = sum('other_city_female');
            const pMt = sum('other_province_male'), pFt = sum('other_province_female');
            const fMt = sum('foreign_male'), fFt = sum('foreign_female');
            const totalRow: (string|number)[] = [
              'TOTAL', '', '',
              lMt, lFt, lMt+lFt, cMt, cFt, cMt+cFt,
              pMt, pFt, pMt+pFt, fMt, fFt, fMt+fFt,
              lMt+lFt+cMt+cFt+pMt+pFt+fMt+fFt,
            ];

            // 4-row header: title / subtitle / category group / sub-headers
            const blank16 = () => Array(NC).fill('');
            const categoryRow = [...blank16()];
            categoryRow[3] = 'LOCAL'; categoryRow[6] = 'OTHER CITY';
            categoryRow[9] = 'OTHER PROVINCE'; categoryRow[12] = 'FOREIGN';
            categoryRow[15] = 'GRAND TOTAL';

            const wsData: (string|number)[][] = [
              ['LILIW TOURISM — VISITOR RECORDS REPORT', ...Array(NC-1).fill('')],
              [`${period}  ·  ${exportRecords.length} attraction(s)`, ...Array(NC-1).fill('')],
              categoryRow,
              ['Attraction Name','LBO Email','Period','Male','Female','Total','Male','Female','Total','Male','Female','Total','Male','Female','Total','TOTAL'],
              ...dataRows,
              totalRow,
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [
              {wch:32},{wch:26},{wch:18},
              {wch:9},{wch:9},{wch:11},
              {wch:9},{wch:9},{wch:11},
              {wch:9},{wch:9},{wch:13},
              {wch:9},{wch:9},{wch:11},
              {wch:13},
            ];
            ws['!rows'] = [{hpt:32},{hpt:18},{hpt:26},{hpt:30}];
            ws['!merges'] = [
              {s:{r:0,c:0},e:{r:0,c:NC-1}},
              {s:{r:1,c:0},e:{r:1,c:NC-1}},
              {s:{r:2,c:0},e:{r:2,c:2}},
              {s:{r:2,c:3},e:{r:2,c:5}},
              {s:{r:2,c:6},e:{r:2,c:8}},
              {s:{r:2,c:9},e:{r:2,c:11}},
              {s:{r:2,c:12},e:{r:2,c:14}},
            ];

            // Group palette: [category bg, sub-header bg, data alt bg]
            const G = {
              local:    {cat:'1565C0', sub:'3B82F6', alt:'EFF6FF'},
              city:     {cat:'047857', sub:'10B981', alt:'ECFDF5'},
              province: {cat:'B45309', sub:'F59E0B', alt:'FEF3C7'},
              foreign:  {cat:'6D28D9', sub:'8B5CF6', alt:'F5F3FF'},
              grand:    {cat:'92400E', sub:'D97706', alt:'FEF9C3'},
            };
            const mkCat = (rgb: string) => ({font:{bold:true,sz:11,color:{rgb:'FFFFFF'}}, fill:{patternType:'solid',fgColor:{rgb}}, alignment:{horizontal:'center',vertical:'center'}, border:XL_BORDER});
            const mkSub = (rgb: string) => ({font:{bold:true,sz:10,color:{rgb:'FFFFFF'}}, fill:{patternType:'solid',fgColor:{rgb}}, alignment:{horizontal:'center',vertical:'center'}, border:XL_BORDER});
            const mkData = (bg: string, center = true) => ({fill:{patternType:'solid',fgColor:{rgb:bg}}, border:XL_BORDER, alignment:{horizontal:center?'center':'left',vertical:'center'}});
            const mkDataBold = (bg: string) => ({font:{bold:true}, fill:{patternType:'solid',fgColor:{rgb:bg}}, border:XL_BORDER, alignment:{horizontal:'center',vertical:'center'}});

            // Row 0: title
            xlStyle(ws, 0, 0, XL_STYLES.titleBlue);
            for (let c=1;c<NC;c++) xlStyle(ws, 0, c, XL_STYLES.titleFill);
            // Row 1: subtitle
            xlStyle(ws, 1, 0, XL_STYLES.subtitleFill);
            for (let c=1;c<NC;c++) xlStyle(ws, 1, c, XL_STYLES.subtitleRest);
            // Row 2: category headers
            for (let c=0;c<3;c++) xlStyle(ws, 2, c, {fill:{patternType:'solid',fgColor:{rgb:'0B3D91'}}, border:XL_BORDER});
            for (let c=3;c<=5;c++)   xlStyle(ws, 2, c, mkCat(G.local.cat));
            for (let c=6;c<=8;c++)   xlStyle(ws, 2, c, mkCat(G.city.cat));
            for (let c=9;c<=11;c++)  xlStyle(ws, 2, c, mkCat(G.province.cat));
            for (let c=12;c<=14;c++) xlStyle(ws, 2, c, mkCat(G.foreign.cat));
            xlStyle(ws, 2, 15, mkCat(G.grand.cat));
            // Row 3: sub-headers
            for (let c=0;c<3;c++) xlStyle(ws, 3, c, XL_STYLES.header);
            for (let c=3;c<=5;c++)   xlStyle(ws, 3, c, mkSub(G.local.sub));
            for (let c=6;c<=8;c++)   xlStyle(ws, 3, c, mkSub(G.city.sub));
            for (let c=9;c<=11;c++)  xlStyle(ws, 3, c, mkSub(G.province.sub));
            for (let c=12;c<=14;c++) xlStyle(ws, 3, c, mkSub(G.foreign.sub));
            xlStyle(ws, 3, 15, mkSub(G.grand.sub));
            // Data rows (start at row 4)
            for (let i=0;i<dataRows.length;i++) {
              const r = i + 4;
              const even = i % 2 === 0;
              const base = even ? 'FFFFFF' : 'F8FAFF';
              for (let c=0;c<3;c++) xlStyle(ws, r, c, mkData(base, false));
              for (let c=3;c<=5;c++)   xlStyle(ws, r, c, mkData(even ? 'FFFFFF' : G.local.alt));
              for (let c=6;c<=8;c++)   xlStyle(ws, r, c, mkData(even ? 'FFFFFF' : G.city.alt));
              for (let c=9;c<=11;c++)  xlStyle(ws, r, c, mkData(even ? 'FFFFFF' : G.province.alt));
              for (let c=12;c<=14;c++) xlStyle(ws, r, c, mkData(even ? 'FFFFFF' : G.foreign.alt));
              xlStyle(ws, r, 15, mkDataBold(even ? 'FFFBEB' : G.grand.alt));
            }
            // Total row
            const totalR = dataRows.length + 4;
            xlStyle(ws, totalR, 0, XL_STYLES.totalName);
            for (let c=1;c<NC;c++) xlStyle(ws, totalR, c, XL_STYLES.totalRow);

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, period);
            XLSX.writeFile(wb, `visitor-records-${MONTHS_FULL[vrExportMonth-1]}-${vrExportYear}.xlsx`);
            setVrExportOpen(false);
          };

          const handleExportCSV = () => {
            const exportRecords = [...visitorRecords]
              .filter(r => Number(r.month) === vrExportMonth && Number(r.year) === vrExportYear)
              .sort((a, b) => (a.attraction_name || '').localeCompare(b.attraction_name || ''));
            const period = `${MONTHS_FULL[vrExportMonth - 1]} ${vrExportYear}`;
            const esc = (v: string | number) => {
              const s = String(v ?? '');
              return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const rows: (string | number)[][] = [
              ['Attraction Name','LBO Email','Period','Local Male','Local Female','Local Total','Other City Male','Other City Female','Other City Total','Other Province Male','Other Province Female','Other Province Total','Foreign Male','Foreign Female','Foreign Total','Grand Total'],
              ...exportRecords.map(r => {
                const lM=r.local_male||0, lF=r.local_female||0, cM=r.other_city_male||0, cF=r.other_city_female||0;
                const pM=r.other_province_male||0, pF=r.other_province_female||0, fM=r.foreign_male||0, fF=r.foreign_female||0;
                return [r.attraction_name||'—', r.lbo_email||'—', period, lM,lF,lM+lF, cM,cF,cM+cF, pM,pF,pM+pF, fM,fF,fM+fF, lM+lF+cM+cF+pM+pF+fM+fF];
              }),
            ];
            const csv = rows.map(r => r.map(esc).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `visitor-records-${MONTHS_FULL[vrExportMonth-1]}-${vrExportYear}.csv`;
            a.click(); URL.revokeObjectURL(url);
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
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                          {MONTHS_FULL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                        <select value={vrExportYear} onChange={e => setVrExportYear(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
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
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
                          {previewCount} record{previewCount > 1 ? 's' : ''} will be exported for {MONTHS_FULL[vrExportMonth - 1]} {vrExportYear}.
                        </p>
                      );
                    })()}
                    <div className="flex gap-2">
                      <button onClick={() => setVrExportOpen(false)}
                        className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                      </button>
                      <button onClick={handleExportCSV}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition hover:opacity-90 border"
                        style={{ borderColor: '#1565C0', color: '#1565C0', backgroundColor: '#EFF6FF' }}>
                        <Download className="w-4 h-4" /> .csv
                      </button>
                      <button onClick={handleExportExcel}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                        <Download className="w-4 h-4" /> .xlsx
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={<Users className="w-5 h-5" />}       label="Total Visitors"  value={grandTotal.toLocaleString()} color="#1565C0" />
                  <StatCard icon={<FileText className="w-5 h-5" />}    label="Records"          value={filtered.length}             color="#3B82F6" />
                  <StatCard icon={<Building2 className="w-5 h-5" />}   label="Attractions"      value={new Set(filtered.map(r => r.attraction_name)).size} color="#F59E0B" />
                  <StatCard icon={<MapPin className="w-5 h-5" />}      label="LBOs Reporting"   value={new Set(filtered.map(r => r.lbo_email)).size}       color="#8B5CF6" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search attraction or LBO…" value={vrSearch} onChange={e => setVrSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <select value={vrYear} onChange={e => setVrYear(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
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
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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
                            <td className="px-4 py-3 text-right font-black text-blue-700 text-base">{grandTotal.toLocaleString()}</td>
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
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{attractionReqs.length} total</span>
                  <button
                    onClick={() => {
                      if (!token) return;
                      setLoadingAR(true);
                      fetch('/api/admin/attraction-requests', { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.json())
                        .then(d => { if (d.error) console.error('[AttractionReqs]', d.error); setAttractionReqs(d.data || []); })
                        .catch(() => {})
                        .finally(() => setLoadingAR(false));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    disabled={loadingAR}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAR ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              {loadingAR ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
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
        {activeTab === 'audit' && (() => {
          const ROLE_STYLE: Record<string, string> = {
            'Super Admin':   'bg-red-50 text-red-700',
            'CHATO Officer': 'bg-teal-50 text-teal-700',
            'CHATO Editor':  'bg-yellow-50 text-yellow-700',
          };
          return (
            <div className="space-y-6">
              <TableWrap title="Strapi Content Changes" count={strapiActivity.length} loading={loadingActivity} empty={strapiActivity.length === 0} emptyIcon={<Activity className="w-12 h-12" />}>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Action</th>
                    <th className="px-5 py-3 text-left">Entry</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Edited By</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">When</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {strapiActivity.map(act => (
                      <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${act.action === 'created' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                            {act.action}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{act.entryName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{act.contentType}</span>
                        </td>
                        <td className="px-5 py-4">
                          {act.performer ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#0B3D91' }}>
                                {act.performer.name[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[160px]">{act.performer.name}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[160px]">{act.performer.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {act.performer ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLE[act.performer.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {act.performer.role}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1" />{fmt(act.at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>

              {auditLogs.length > 0 && (
                <TableWrap title="Raw Audit Trail" count={auditLogs.length} loading={loadingAudit} empty={false} emptyIcon={<Activity className="w-12 h-12" />}>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Event</th>
                      <th className="px-5 py-3 text-left">Entry</th>
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
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{log.entry_title}</p>
                            <p className="text-xs text-gray-400">{log.model}</p>
                          </td>
                          <td className="px-5 py-4">
                            {log.performed_by ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#1565C0' }}>
                                  {log.performed_by[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-700 truncate max-w-[140px]">{log.performed_by}</span>
                              </div>
                            ) : <span className="text-gray-300 text-xs">—</span>}
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
            </div>
          );
        })()}

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
                    const reportDate = new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
                    const dataRows: (string|number)[][] = [
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
                    const wsData: (string|number)[][] = [
                      ['LILIW TOURISM — FULL ANALYTICS REPORT', '', ''],
                      [`Generated: ${reportDate}`, '', ''],
                      ['', '', ''],
                      ['Section', 'Metric', 'Value'],
                      ...dataRows,
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    ws['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 18 }];
                    ws['!rows'] = [{ hpt: 32 }, { hpt: 18 }, { hpt: 8 }, { hpt: 26 }];
                    ws['!merges'] = [
                      { s:{r:0,c:0}, e:{r:0,c:2} },
                      { s:{r:1,c:0}, e:{r:1,c:2} },
                    ];
                    // Title row
                    xlStyle(ws, 0, 0, XL_STYLES.titleBlue);
                    xlStyle(ws, 0, 1, XL_STYLES.titleFill);
                    xlStyle(ws, 0, 2, XL_STYLES.titleFill);
                    // Subtitle row
                    xlStyle(ws, 1, 0, XL_STYLES.subtitleFill);
                    xlStyle(ws, 1, 1, XL_STYLES.subtitleRest);
                    xlStyle(ws, 1, 2, XL_STYLES.subtitleRest);
                    // Column header row (row 3)
                    for (let c = 0; c < 3; c++) xlStyle(ws, 3, c, XL_STYLES.header);
                    // Data rows (starting at row 4)
                    let prevSect = '';
                    for (let i = 0; i < dataRows.length; i++) {
                      const r = i + 4;
                      const sect = String(dataRows[i][0]);
                      const isNew = sect !== prevSect;
                      if (sect) prevSect = sect;
                      const bg = isNew ? XL_SECTION_BG[sect] ?? 'EFF6FF' : (i % 2 === 0 ? 'FFFFFF' : 'F0F5FF');
                      const base = isNew ? XL_STYLES.section(bg) : (i % 2 === 0 ? XL_STYLES.dataOdd : XL_STYLES.dataEven);
                      for (let c = 0; c < 3; c++) xlStyle(ws, r, c, { ...base, alignment:{ horizontal: c===2 ? 'center' : 'left', vertical:'center' } });
                    }
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Full Report');
                    XLSX.writeFile(wb, `liliw-full-report-${Date.now()}.xlsx`);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: 'linear-gradient(135deg,#1565C0,#0B3D91)', boxShadow: '0 4px 14px rgba(21,101,192,.3)' }}>
                  <Download className="w-4 h-4" /> Export .xlsx
                </button>
                <button
                  onClick={() => {
                    const reportDate = new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
                    const esc = (v: string | number) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s; };
                    const rows: (string|number)[][] = [
                      ['LILIW TOURISM — FULL ANALYTICS REPORT'],
                      [`Generated: ${reportDate}`],
                      [],
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
                    const csv = rows.map(r => r.map(esc).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `liliw-full-report-${Date.now()}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border"
                  style={{ borderColor: '#1565C0', color: '#1565C0', backgroundColor: '#EFF6FF' }}>
                  <Download className="w-4 h-4" /> Export .csv
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
                <ReportCard title="Participations"   sub="Community engagements" value={participation.length} color="#1565C0" />
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

              const authH = { Authorization: `Bearer ${token}` };
              // Start the run
              const startRes = await fetch('/api/admin/scrape-reviews', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', ...authH },
                body:    JSON.stringify({ strapiId: id, attractionName: attr.attributes.name, lat, lng }),
              });
              const { runId, error: startErr } = await startRes.json();
              if (!startRes.ok || !runId) throw new Error(startErr || 'Failed to start scrape');

              // Poll until done (max 3 min)
              const deadline = Date.now() + 180_000;
              while (Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 4000));
                const pollRes = await fetch(
                  `/api/admin/scrape-reviews?runId=${runId}&strapiId=${id}&attractionName=${encodeURIComponent(attr.attributes.name)}`,
                  { headers: authH }
                );
                const poll = await pollRes.json();
                if (poll.status === 'SUCCEEDED') {
                  if (!poll.result) {
                    setScrapeMsg({ id, ok: false, text: poll.message || 'No matching place found on Google Maps' });
                  } else if (poll.dbError) {
                    setScrapeMsg({ id, ok: false, text: `Scraped but DB save failed: ${poll.dbError}` });
                  } else {
                    // Refresh cached data
                    fetch('/api/admin/external-reviews', { headers: authH }).then(r => r.json()).then(d => setExternalReviews(d.data || []));
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
          const attractionsWithCoords = attractions.filter(a => {
            const c = a.attributes.coordinates as any;
            return !!(c?.latitude ?? c?.lat);
          });

          const scrapeOne = async (attr: any): Promise<void> => {
            const c = attr.attributes.coordinates as any;
            const lat = c?.latitude ?? c?.lat ?? null;
            const lng = c?.longitude ?? c?.lng ?? null;
            const authH = { Authorization: `Bearer ${token}` };
            try {
              const startRes = await fetch('/api/admin/scrape-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH },
                body: JSON.stringify({ strapiId: attr.strapiId, attractionName: attr.attributes.name, lat, lng }),
              });
              const { runId } = await startRes.json();
              if (!runId) return;
              const deadline = Date.now() + 180_000;
              while (Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 5000));
                const poll = await fetch(
                  `/api/admin/scrape-reviews?runId=${runId}&strapiId=${attr.strapiId}&attractionName=${encodeURIComponent(attr.attributes.name)}`,
                  { headers: authH }
                ).then(r => r.json()).catch(() => ({}));
                if (poll.status === 'SUCCEEDED' || poll.status === 'FAILED' || poll.status === 'ABORTED') break;
              }
            } catch {}
          };

          const handleScrapeAll = async () => {
            const unscraped = attractionsWithCoords.filter(a => !cachedMap[a.strapiId]);
            if (unscraped.length === 0) return;
            setScrapeAllActive(true);
            setScrapeAllProgress({ current: 0, total: unscraped.length });

            // Process in batches of 3 to respect Apify concurrency limits
            const BATCH = 3;
            let completed = 0;
            for (let i = 0; i < unscraped.length; i += BATCH) {
              const batch = unscraped.slice(i, i + BATCH);
              await Promise.all(batch.map(attr => scrapeOne(attr)));
              completed = Math.min(i + BATCH, unscraped.length);
              setScrapeAllProgress({ current: completed, total: unscraped.length });
            }

            fetch('/api/admin/external-reviews', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setExternalReviews(d.data || []));
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
                    : <><RefreshCw className="w-4 h-4" /> Scrape All ({attractionsWithCoords.filter(a => !cachedMap[a.strapiId]).length} remaining)</>}
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
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} />
                </div>
              ) : attractionsWithCoords.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center text-gray-400">
                  <MapPin className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">No attractions with coordinates found</p>
                  <p className="text-sm mt-1">Add coordinates to attractions in Strapi to enable review scraping.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attractionsWithCoords.map(attr => {
                    const cached   = cachedMap[attr.strapiId];
                    const isScraping = scrapingId === attr.strapiId;
                    const msg      = scrapeMsg?.id === attr.strapiId ? scrapeMsg : null;
                    const isExpanded = expandedReview === attr.strapiId;

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

        {/* ── EVENT FORMS (Editor) ─────────────────────────── */}
        {activeTab === 'eventforms' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Event Forms</h2>
              <p className="text-sm text-gray-400 mt-0.5">Build sign-up forms for joinable events.</p>
            </div>

            {loadingJE ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : joinableEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No joinable events found in Strapi.<br />Enable <strong>is_joinable</strong> on an event first.</p>
              </div>
            ) : joinableEvents.map(event => {
              const form = eventForms.find(f => f.event_slug === event.slug);
              const isBuilding = activeFormSlug === event.slug;
              return (
                <div key={event.slug} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 truncate">{event.title}</p>
                        {form ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {form.is_active ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">No form yet</span>
                        )}
                      </div>
                      {event.date_start && <p className="text-xs text-gray-400 mt-0.5">{new Date(event.date_start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isBuilding && (
                        <button onClick={() => openFormBuilder(event)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                          style={{ backgroundColor: '#1565C0' }}>
                          {form ? 'Edit Form' : 'Create Form'}
                        </button>
                      )}
                      {isBuilding && (
                        <button onClick={() => { setActiveFormSlug(null); setFormSaveMsg(null); }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Builder */}
                  {isBuilding && (
                    <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">Form Questions</p>

                      {formBuilderFields.map((field, idx) => (
                        <div key={field.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <button type="button" disabled={idx === 0} onClick={() => setFormBuilderFields(f => { const a = [...f]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; return a; })} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"><ArrowUp className="w-3 h-3" /></button>
                              <button type="button" disabled={idx === formBuilderFields.length-1} onClick={() => setFormBuilderFields(f => { const a = [...f]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; return a; })} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"><ArrowDown className="w-3 h-3" /></button>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input value={field.label} onChange={e => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, label: e.target.value} : x))}
                                placeholder="Question label *"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              <select value={field.type} onChange={e => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, type: e.target.value as FieldType, options: []} : x))}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                                {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>)}
                              </select>
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                              <input type="checkbox" checked={field.required} onChange={e => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, required: e.target.checked} : x))} className="accent-blue-600" />
                              Required
                            </label>
                            <button onClick={() => setFormBuilderFields(f => f.filter((_,i) => i !== idx))} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Options for choice-based fields */}
                          {['dropdown','multiple_choice','checkboxes'].includes(field.type) && (
                            <div className="pl-8 space-y-1.5">
                              <p className="text-xs font-semibold text-gray-500">Options</p>
                              {(field.options || []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input value={opt} onChange={e => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, options: x.options.map((o,j) => j===oi ? e.target.value : o)} : x))}
                                    placeholder={`Option ${oi+1}`}
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                  <button onClick={() => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, options: x.options.filter((_,j) => j!==oi)} : x))} className="p-1 text-gray-400 hover:text-red-500 transition">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button onClick={() => setFormBuilderFields(f => f.map((x,i) => i===idx ? {...x, options: [...x.options, '']} : x))}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
                                <Plus className="w-3 h-3" /> Add option
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      <button onClick={() => setFormBuilderFields(f => [...f, makeField()])}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add Question
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Form is active (users can sign up)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          {formSaveMsg && (
                            <span className={`text-xs font-semibold flex items-center gap-1 ${formSaveMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                              {formSaveMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {formSaveMsg.text}
                            </span>
                          )}
                          <button onClick={() => saveEventForm(event)} disabled={savingForm || formBuilderFields.some(f => !f.label.trim())}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            style={{ backgroundColor: '#1565C0' }}>
                            {savingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {savingForm ? 'Saving…' : 'Save Form'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── EVENT RESPONSES (Officer) ──────────────────────── */}
        {activeTab === 'eventresponses' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Event Form Responses</h2>
              <p className="text-sm text-gray-400 mt-0.5">View sign-up responses submitted by users for each event.</p>
            </div>

            {loadingEF ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : eventForms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No event forms created yet. Ask the editor to build one first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventForms.map(form => (
                  <button key={form.id} onClick={() => loadFormResponses(form.id)}
                    className={`bg-white rounded-2xl border p-5 text-left transition hover:shadow-md ${selectedFormId === form.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                    <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{form.event_title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400">{(form.fields || []).length} questions</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {loadingEFR && <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>}

            {efResponseData && !loadingEFR && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-gray-900">{efResponseData.form.event_title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{efResponseData.responses.length} response{efResponseData.responses.length !== 1 ? 's' : ''}</p>
                  </div>
                  {efResponseData.responses.length > 0 && (
                    <button onClick={downloadResponsesCSV}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  )}
                </div>

                {efResponseData.responses.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">No responses yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Submitted</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
                          {(efResponseData.form.fields as FormField[]).map((f: FormField) => (
                            <th key={f.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {efResponseData.responses.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(r.submitted_at).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{r.respondent_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{r.respondent_email || '—'}</td>
                            {(efResponseData.form.fields as FormField[]).map((f: FormField) => {
                              const ans = r.answers?.[f.id];
                              return <td key={f.id} className="px-4 py-3 text-gray-700 max-w-xs truncate">{Array.isArray(ans) ? ans.join(', ') : (ans ?? '—')}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


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
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-2.5 transition">
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
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-700 font-semibold">{pickedAttraction.attributes.name}</span>
                    <span className="text-xs text-blue-500">({TYPE_LABELS[pickedAttraction.type]})</span>
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
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Username for login" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                  <input type="password" value={lboRegForm.password}
                    onChange={e => setLboRegForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
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
                style={{ backgroundColor: '#1565C0' }}>
                {savingPwd ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submission / Participation detail + reply modal ─── */}
      {subDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) { setSubDetailModal(null); setReplyCompose(false); }}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                {replyCompose && (
                  <button onClick={() => setReplyCompose(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition -ml-1">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                <h2 className="font-bold text-gray-900 text-base">
                  {replyCompose ? 'Send Reply' : subDetailModal.type === 'submission' ? 'Submission Details' : 'Participation Request'}
                </h2>
              </div>
              <button onClick={() => { setSubDetailModal(null); setReplyCompose(false); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Detail view */}
            {!replyCompose && (() => {
              const d = subDetailModal.data;
              const name = d.name || d.full_name || '—';
              const date = d.createdAt || d.created_at;
              return (
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Name</p>
                      <p className="font-semibold text-gray-900">{name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date Submitted</p>
                      <p className="text-gray-600 text-sm">{date ? fmt(date) : '—'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="flex items-center gap-1.5 text-gray-700 text-sm"><Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />{d.email}</p>
                  </div>

                  {d.phone && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                      <p className="flex items-center gap-1.5 text-gray-700 text-sm"><Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />{d.phone}</p>
                    </div>
                  )}

                  {d.type && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE[d.type] || 'bg-gray-100 text-gray-600'}`}>{d.type}</span>
                    </div>
                  )}

                  {subDetailModal.type === 'submission' && d.status && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-600'}`}>
                        {d.status === 'new' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}{d.status}
                      </span>
                    </div>
                  )}

                  {d.message && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Message</p>
                      <div className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{d.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => { setReplyCompose(true); setReplyResult(null); }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: '#1565C0' }}>
                      <Mail className="w-4 h-4" /> Reply via Email
                    </button>
                    <button onClick={() => setSubDetailModal(null)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Compose / reply view */}
            {replyCompose && (
              <div className="px-6 py-5 space-y-4">
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1">
                  <p className="text-xs text-gray-400">To: <span className="font-semibold text-gray-700">{subDetailModal.data.email}</span></p>
                  <p className="text-xs text-gray-400">From: <span className="font-semibold text-gray-700">Liliw CHATO Office</span></p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Subject</label>
                  <input
                    value={replySubject}
                    onChange={e => setReplySubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Message</label>
                  <textarea
                    rows={8}
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder={`Hi ${subDetailModal.data.name || subDetailModal.data.full_name || ''},\n\nThank you for reaching out to us. We appreciate your ${subDetailModal.data.type || 'inquiry'}.\n\n`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none transition"
                  />
                </div>

                {replyResult && (
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium ${replyResult.ok ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {replyResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {replyResult.text}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 hover:opacity-90"
                    style={{ backgroundColor: '#1565C0' }}>
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {sendingReply ? 'Sending…' : 'Send Email'}
                  </button>
                  <button onClick={() => { setReplyCompose(false); setReplyResult(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
