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
  Monitor, Smartphone, Tablet, Wifi,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

/* ─── types ──────────────────────────────────────────────── */
interface Submission { id: any; attributes: { name: string; email: string; phone: string; message: string; type: string; status: string; createdAt: string }; }
interface EventSignup { id: any; attributes: { full_name: string; email: string; phone: string; notes: string; username: string; status: string; createdAt: string; event: { data: { id: number; attributes: { title: string; date_start: string } } } }; }
interface Analytics { pageViews: number; uniqueVisitors: number; avgSessionTime: string; bounceRate: string; topPages: { path: string; views: number }[]; devices?: { desktop: { count: number; pct: number }; mobile: { count: number; pct: number }; tablet: { count: number; pct: number } }; }
interface AuditLog { id: string; event: string; model: string; uid?: string; entry_id: string; entry_title: string; performed_by?: string; changes?: any; created_at: string; }
interface Participation { id: string; full_name: string; email: string; phone?: string; type?: string; message?: string; created_at: string; }
interface Attraction { id: string; strapiId: string; type: 'heritage' | 'spot' | 'dining'; attributes: { name: string; location?: string; category?: string; rating?: number; photos?: any[] }; }

type Tab = 'overview' | 'users' | 'submissions' | 'participation' | 'signups' | 'attractions' | 'ratings' | 'audit';

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
  const { user, loading, isAdmin, token } = useAuth();
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

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/');
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch('/api/admin/submissions',   { headers: h }).then(r => r.json()).then(d => setSubmissions(d.data || [])).catch(() => {}).finally(() => setLoadingSubs(false));
    fetch('/api/admin/participation',  { headers: h }).then(r => r.json()).then(d => setParticipation(d.data || [])).catch(() => {}).finally(() => setLoadingPart(false));
    fetch('/api/event-signup',         { headers: h }).then(r => r.json()).then(d => setSignups(d.data || [])).catch(() => {}).finally(() => setLoadingSignups(false));
    fetch('/api/analytics/track').then(r => r.json()).then(d => setAnalytics(d)).catch(() => {}).finally(() => setLoadingStats(false));
    fetch('/api/strapi/reviews').then(r => r.json()).then(d => setReviews(d.data || [])).catch(() => {}).finally(() => setLoadingReviews(false));
    fetch('/api/admin/users',          { headers: h }).then(r => r.json()).then(d => setUsers(d.data || [])).catch(() => {}).finally(() => setLoadingUsers(false));
    fetch('/api/strapi/attractions').then(r => r.json()).then(d => setAttractions(d.data || [])).catch(() => {}).finally(() => setLoadingAttr(false));
    fetch('/api/admin/audit-logs',     { headers: h }).then(r => r.json()).then(d => setAuditLogs(d.data || [])).catch(() => {}).finally(() => setLoadingAudit(false));
  }, [isAdmin, token]);

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

  const handleSyncSearch = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/admin/sync-search', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      res.ok ? (setSyncCount(data.synced), setSyncStatus('done')) : setSyncStatus('error');
    } catch { setSyncStatus('error'); }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} /></div>;
  if (!user || !isAdmin) return null;

  const newCount      = submissions.filter(s => s.attributes?.status === 'new').length;
  const feedbackCount = submissions.filter(s => s.attributes?.type === 'feedback').length;
  const volunteerCount= submissions.filter(s => s.attributes?.type === 'volunteer').length;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview',      label: 'Overview' },
    { key: 'users',         label: 'Users',         badge: users.length },
    { key: 'submissions',   label: 'Submissions',   badge: newCount },
    { key: 'participation', label: 'Participation', badge: participation.length },
    { key: 'signups',       label: 'Event Sign-ups',badge: signups.length },
    { key: 'attractions',   label: 'Attractions',   badge: attractions.length },
    { key: 'ratings',       label: 'Ratings',       badge: reviews.length },
    { key: 'audit',         label: 'Audit Logs',    badge: auditLogs.length },
  ];

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
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome back, {user.username}</p>
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
              <StatCard icon={<Eye className="w-5 h-5" />}       label="Page Views"        value={loadingStats ? '—' : (analytics?.pageViews ?? 0).toLocaleString()} color="#00BFB3" />
              <StatCard icon={<Users className="w-5 h-5" />}     label="Unique Visitors"   value={loadingStats ? '—' : (analytics?.uniqueVisitors ?? 0).toLocaleString()} color="#3B82F6" />
              <StatCard icon={<UserCheck className="w-5 h-5" />} label="Registered Users"  value={loadingUsers ? '—' : users.length} sub="tourist accounts" color="#10B981" />
              <StatCard icon={<MapPin className="w-5 h-5" />}    label="Attractions"        value={loadingAttr ? '—' : attractions.length} sub="in Strapi" color="#F59E0B" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<FileText className="w-5 h-5" />}    label="Submissions"       value={loadingSubs ? '—' : submissions.length}   sub={`${newCount} new`} color="#8B5CF6" />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Participations"  value={loadingPart ? '—' : participation.length} sub="requests" color="#EC4899" />
              <StatCard icon={<Calendar className="w-5 h-5" />}    label="Event Sign-ups"   value={loadingSignups ? '—' : signups.length} sub="total" color="#F59E0B" />
              <StatCard icon={<Activity className="w-5 h-5" />}    label="CMS Changes"       value={loadingAudit ? '—' : auditLogs.length} sub="audit log entries" color="#6366F1" />
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
          <TableWrap title="Attractions" count={attractions.length} loading={loadingAttr} empty={attractions.length === 0} emptyIcon={<MapPin className="w-12 h-12" />}>
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
                {attractions.map(a => (
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

      </div>
    </div>
  );
}
