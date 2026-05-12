'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Eye, TrendingUp, ExternalLink,
  FileText, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronLeft, Mail, Phone, Calendar, MessageSquare, Star, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

/* ─── types ──────────────────────────────────────────────── */

interface Submission {
  id: number;
  attributes: {
    name: string;
    email: string;
    phone: string;
    message: string;
    type: string;
    status: string;
    createdAt: string;
  };
}

interface EventSignup {
  id: number;
  attributes: {
    full_name: string;
    email: string;
    phone: string;
    notes: string;
    username: string;
    status: string;
    createdAt: string;
    event: { data: { id: number; attributes: { title: string; date_start: string } } };
  };
}

interface DeviceStat { count: number; pct: number; }
interface Analytics {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionTime: string;
  bounceRate: string;
  topPages: { path: string; views: number }[];
  devices?: { desktop: DeviceStat; mobile: DeviceStat; tablet: DeviceStat };
}

/* ─── stat card ──────────────────────────────────────────── */

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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

/* ─── badge ──────────────────────────────────────────────── */

const STATUS_BADGE: Record<string, string> = {
  new:      'bg-blue-50 text-blue-700',
  reviewed: 'bg-yellow-50 text-yellow-700',
  resolved: 'bg-green-50 text-green-700',
};
const TYPE_BADGE: Record<string, string> = {
  feedback:    'bg-purple-50 text-purple-700',
  volunteer:   'bg-teal-50 text-teal-700',
  partnership: 'bg-orange-50 text-orange-700',
};

/* ─── page ───────────────────────────────────────────────── */

export default function AdminDashboard() {
  const { user, loading, isAdmin, token } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions]   = useState<Submission[]>([]);
  const [signups, setSignups]           = useState<EventSignup[]>([]);
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [loadingSubs, setLoadingSubs]   = useState(true);
  const [loadingSignups, setLoadingSignups] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reviews, setReviews]           = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [activeTab, setActiveTab]       = useState<'overview' | 'submissions' | 'signups' | 'ratings'>('overview');
  const [syncStatus, setSyncStatus]     = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncCount, setSyncCount]       = useState<number | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [user, loading, isAdmin, router]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin || !token) return;

    const authHeader = { Authorization: `Bearer ${token}` };

    fetch('/api/admin/submissions', { headers: authHeader })
      .then(r => r.json())
      .then(d => setSubmissions(d.data || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubs(false));

    fetch('/api/event-signup', { headers: authHeader })
      .then(r => r.json())
      .then(d => setSignups(d.data || []))
      .catch(() => setSignups([]))
      .finally(() => setLoadingSignups(false));

    fetch('/api/analytics/track')
      .then(r => r.json())
      .then(d => setAnalytics(d))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingStats(false));

    fetch('/api/strapi/reviews')
      .then(r => r.json())
      .then(d => setReviews(d.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [isAdmin, token]);

  const handleSyncSearch = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/admin/sync-search', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncCount(data.synced);
        setSyncStatus('done');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const newCount      = submissions.filter(s => s.attributes?.status === 'new').length;
  const feedbackCount = submissions.filter(s => s.attributes?.type === 'feedback').length;
  const volunteerCount= submissions.filter(s => s.attributes?.type === 'volunteer').length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-sm font-semibold mb-4 group" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Site
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome back, {user.username}</p>
            </div>
            <a
              href={`${STRAPI_URL}/admin`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 4px 16px rgba(0,191,179,.35)' }}
            >
              <ExternalLink className="w-4 h-4" /> Open Strapi Admin
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {(['overview', 'ratings', 'submissions', 'signups'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-3.5 text-sm font-semibold capitalize transition-colors border-b-2 ${
                activeTab === t ? 'border-teal-400 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'signups' ? 'Event Sign-ups' : t === 'ratings' ? 'Ratings' : t}
              {t === 'submissions' && newCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#00BFB3' }}>{newCount}</span>
              )}
              {t === 'signups' && signups.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#00BFB3' }}>{signups.length}</span>
              )}
              {t === 'ratings' && reviews.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#F59E0B' }}>{reviews.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard icon={<Eye className="w-5 h-5" />} label="Page Views"
                value={loadingStats ? '—' : (analytics?.pageViews ?? 0).toLocaleString()} color="#00BFB3" />
              <StatCard icon={<Users className="w-5 h-5" />} label="Unique Visitors"
                value={loadingStats ? '—' : (analytics?.uniqueVisitors ?? 0).toLocaleString()} color="#3B82F6" />
              <StatCard icon={<FileText className="w-5 h-5" />} label="Submissions"
                value={loadingSubs ? '—' : submissions.length}
                sub={`${newCount} new`} color="#8B5CF6" />
              <StatCard icon={<Calendar className="w-5 h-5" />} label="Event Sign-ups"
                value={loadingSignups ? '—' : signups.length}
                sub="total registrations" color="#F59E0B" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Bounce Rate"
                value={loadingStats ? '—' : (analytics?.bounceRate ?? '—')} color="#F59E0B" />
            </div>

            {/* Search index sync */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-900">Search Index</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {syncStatus === 'done' ? `Synced ${syncCount} items to Algolia` :
                   syncStatus === 'error' ? 'Sync failed — check Algolia credentials' :
                   'Sync Strapi content to Algolia so the search bar is always up to date'}
                </p>
              </div>
              <button
                onClick={handleSyncSearch}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: syncStatus === 'error' ? '#EF4444' : syncStatus === 'done' ? '#10B981' : '#00BFB3' }}
              >
                {syncStatus === 'syncing'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
                  : syncStatus === 'done'
                  ? <><CheckCircle className="w-4 h-4" /> Synced</>
                  : syncStatus === 'error'
                  ? <><AlertCircle className="w-4 h-4" /> Retry Sync</>
                  : <><RefreshCw className="w-4 h-4" /> Sync Search</>}
              </button>
            </div>

            {/* Participation breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Participation Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Feedback', count: feedbackCount, icon: <MessageSquare className="w-5 h-5" />, color: '#8B5CF6' },
                  { label: 'Volunteer', count: volunteerCount, icon: <Users className="w-5 h-5" />, color: '#00BFB3' },
                  { label: 'Partnership', count: submissions.filter(s => s.attributes?.type === 'partnership').length, icon: <BarChart3 className="w-5 h-5" />, color: '#F59E0B' },
                ].map(({ label, count, icon, color }) => (
                  <div key={label} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{loadingSubs ? '—' : count}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device breakdown */}
            {analytics?.devices && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Visitors by Device</h2>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { key: 'desktop', label: 'Desktop', emoji: '🖥️', color: '#00BFB3' },
                    { key: 'mobile',  label: 'Mobile',  emoji: '📱', color: '#3B82F6' },
                    { key: 'tablet',  label: 'Tablet',  emoji: '📟', color: '#8B5CF6' },
                  ] as const).map(({ key, label, emoji, color }) => {
                    const d = (analytics.devices as any)[key] || { count: 0, pct: 0 };
                    return (
                      <div key={key} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100">
                        <span className="text-2xl">{emoji}</span>
                        <p className="text-2xl font-bold text-gray-900">{d.pct}%</p>
                        <p className="text-xs text-gray-500">{label}</p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: color }} />
                        </div>
                        <p className="text-xs text-gray-400">{d.count} sessions</p>
                      </div>
                    );
                  })}
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

            {/* Top attractions */}
            {analytics?.topPages && analytics.topPages.filter(p => p.path.startsWith('/attractions/')).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Most Visited Attractions</h2>
                <div className="space-y-3">
                  {analytics.topPages.filter(p => p.path.startsWith('/attractions/')).slice(0, 6).map(({ path, views }) => {
                    const max = analytics.topPages.filter(p => p.path.startsWith('/attractions/'))[0]?.views || 1;
                    return (
                      <div key={path} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-48 shrink-0 truncate">{path.replace('/attractions/', 'Attraction #')}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(views / max) * 100}%`, backgroundColor: '#F59E0B' }} />
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

        {activeTab === 'signups' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Event Sign-ups</h2>
              <span className="text-sm text-gray-400">{signups.length} total</span>
            </div>
            {loadingSignups ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} />
              </div>
            ) : signups.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-gray-400">
                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-semibold">No sign-ups yet</p>
                <p className="text-sm mt-1">Sign-ups will appear here once tourists register for events</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Name</th>
                      <th className="px-5 py-3 text-left">Contact</th>
                      <th className="px-5 py-3 text-left">Event</th>
                      <th className="px-5 py-3 text-left">Notes</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {signups.map(s => {
                      const a = s.attributes;
                      const eventTitle = a.event?.data?.attributes?.title || '—';
                      const eventDate  = a.event?.data?.attributes?.date_start
                        ? new Date(a.event.data.attributes.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : null;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{a.full_name}</p>
                            {a.username && <p className="text-xs text-gray-400">@{a.username}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <p className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3 shrink-0" />{a.email}</p>
                            {a.phone && <p className="flex items-center gap-1 text-gray-400 mt-0.5"><Phone className="w-3 h-3 shrink-0" />{a.phone}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900 text-sm">{eventTitle}</p>
                            {eventDate && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{eventDate}</p>}
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-gray-500 text-xs line-clamp-2">{a.notes || '—'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                              a.status === 'confirmed' ? 'bg-green-50 text-green-700'
                              : a.status === 'cancelled' ? 'bg-red-50 text-red-500'
                              : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {a.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {a.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && (() => {
          // Group reviews by item_id
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Attraction Ratings</h2>
                <span className="text-sm text-gray-400">{reviews.length} total reviews</span>
              </div>
              {loadingReviews ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} />
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <Star className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-semibold">No reviews yet</p>
                  <p className="text-sm mt-1">Reviews will appear here once visitors rate attractions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Attraction ID</th>
                        <th className="px-5 py-3 text-left">Avg Rating</th>
                        <th className="px-5 py-3 text-left">Reviews</th>
                        <th className="px-5 py-3 text-left">Latest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-gray-900">{row.id}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} className="w-4 h-4" fill={i <= Math.round(row.avg) ? '#FFB400' : 'none'} stroke={i <= Math.round(row.avg) ? '#FFB400' : '#d1d5db'} />
                                ))}
                              </div>
                              <span className="text-sm font-bold text-gray-700">{row.avg.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{row.count} review{row.count !== 1 ? 's' : ''}</td>
                          <td className="px-5 py-4 text-gray-400 text-xs">
                            {row.latest ? new Date(row.latest).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'submissions' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Participate Submissions</h2>
              <span className="text-sm text-gray-400">{submissions.length} total</span>
            </div>

            {loadingSubs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00BFB3' }} />
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-semibold">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Name</th>
                      <th className="px-5 py-3 text-left">Contact</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Message</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {submissions.map((s) => {
                      const a = s.attributes;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{a.name}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-3 h-3 shrink-0" />{a.email}
                            </p>
                            {a.phone && (
                              <p className="flex items-center gap-1 text-gray-400 mt-0.5">
                                <Phone className="w-3 h-3 shrink-0" />{a.phone}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE[a.type] || 'bg-gray-100 text-gray-600'}`}>
                              {a.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-gray-600 line-clamp-2">{a.message}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[a.status] || 'bg-gray-100 text-gray-600'}`}>
                              {a.status === 'new' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              {a.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
