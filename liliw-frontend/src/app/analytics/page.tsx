'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Users, Clock, Eye, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionTime: string;
  bounceRate: string;
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ source: string; count: number }>;
  deviceTypes: Array<{ type: string; percentage: number }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();
        setAnalytics({
          pageViews: data.pageViews || 0,
          uniqueVisitors: data.uniqueVisitors || 0,
          avgSessionTime: data.avgSessionTime || '0m 0s',
          bounceRate: data.bounceRate || '0%',
          topPages: data.topPages || [],
          referrers: data.referrers || [],
          deviceTypes: data.deviceTypes || [],
        });
      } catch {
        setAnalytics({ pageViews: 0, uniqueVisitors: 0, avgSessionTime: '0m 0s', bounceRate: '0%', topPages: [], referrers: [], deviceTypes: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { icon: Eye,        label: 'Page Views',       value: analytics?.pageViews.toLocaleString() ?? '—',   color: '#1565C0' },
    { icon: Users,      label: 'Unique Visitors',   value: analytics?.uniqueVisitors.toLocaleString() ?? '—', color: '#0B3D91' },
    { icon: Clock,      label: 'Avg Session Time',  value: analytics?.avgSessionTime ?? '—',               color: '#1565C0' },
    { icon: TrendingUp, label: 'Bounce Rate',       value: analytics?.bounceRate ?? '—',                   color: '#F5C518' },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0B3D91 0%,#1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-7xl mx-auto px-4 pt-14 pb-6">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors" style={{ fontFamily: BL }}>
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-9 h-9 text-white" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wide" style={{ fontFamily: HL }}>
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-white/70 text-sm mt-1" style={{ fontFamily: BL }}>Real-time visitor analytics and engagement metrics · updates every 30 seconds</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 pb-24">

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[1,2,3,4].map(i => <div key={i} className="rounded-2xl bg-gray-100 h-28 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '18' }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: stat.color, fontFamily: HL }}>Live</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-1" style={{ fontFamily: BL }}>{stat.label}</p>
                  <p className="text-3xl font-extrabold" style={{ color: '#1A1A2E', fontFamily: HL }}>{stat.value}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Charts */}
        {!loading && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top Pages */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-all duration-300">
              <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E', fontFamily: HL }}>Top Pages</h2>
              {analytics.topPages.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPages.map((page, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-700 font-semibold truncate pr-2" style={{ fontFamily: BL }}>{page.path}</span>
                        <span className="text-xs text-gray-500 shrink-0" style={{ fontFamily: BL }}>{page.views} views</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${(page.views / (analytics.topPages[0]?.views || 1)) * 100}%`, backgroundColor: '#1565C0' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8" style={{ fontFamily: BL }}>No page views recorded yet</p>
              )}
            </motion.div>

            {/* Traffic Sources */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-all duration-300">
              <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E', fontFamily: HL }}>Traffic Sources</h2>
              {analytics.referrers.length > 0 ? (
                <div className="space-y-4">
                  {analytics.referrers.map((ref, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: BL }}>{ref.source}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                          <div className="h-1.5 rounded-full"
                            style={{ width: `${(ref.count / (analytics.referrers[0]?.count || 1)) * 100}%`, backgroundColor: '#1565C0' }} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-bold shrink-0" style={{ fontFamily: HL }}>{ref.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8" style={{ fontFamily: BL }}>No traffic sources recorded yet</p>
              )}
            </motion.div>

            {/* Device Types */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E', fontFamily: HL }}>Device Types</h2>
              {analytics.deviceTypes.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {analytics.deviceTypes.map((device, idx) => (
                    <div key={idx} className="text-center p-5 rounded-2xl border border-gray-100">
                      <p className="text-3xl font-extrabold mb-1" style={{ color: '#0B3D91', fontFamily: HL }}>{device.percentage}%</p>
                      <p className="text-sm text-gray-600 font-semibold" style={{ fontFamily: BL }}>{device.type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8" style={{ fontFamily: BL }}>No device data recorded yet</p>
              )}
            </motion.div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10" style={{ fontFamily: BL }}>
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
