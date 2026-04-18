'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
    // Simulate analytics data from localStorage or API
    const fetchAnalytics = async () => {
      try {
        // In production, this would fetch from a real analytics service
        const stored = localStorage.getItem('site_analytics');
        if (stored) {
          setAnalytics(JSON.parse(stored));
        } else {
          // Default demo data
          setAnalytics({
            pageViews: 1250,
            uniqueVisitors: 450,
            avgSessionTime: '4m 32s',
            bounceRate: '32%',
            topPages: [
              { path: '/attractions', views: 380 },
              { path: '/heritage', views: 290 },
              { path: '/itineraries', views: 240 },
              { path: '/news', views: 190 },
            ],
            referrers: [
              { source: 'Google', count: 320 },
              { source: 'Facebook', count: 180 },
              { source: 'Direct', count: 150 },
            ],
            deviceTypes: [
              { type: 'Mobile', percentage: 68 },
              { type: 'Desktop', percentage: 28 },
              { type: 'Tablet', percentage: 4 },
            ],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-4xl" style={{ color: '#00BFB3' }}>
          ⟳
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const statCards = [
    {
      icon: Eye,
      label: 'Page Views',
      value: analytics.pageViews.toLocaleString(),
      trend: '+12%',
      color: '#00BFB3',
    },
    {
      icon: Users,
      label: 'Unique Visitors',
      value: analytics.uniqueVisitors.toLocaleString(),
      trend: '+8%',
      color: '#FF6B6B',
    },
    {
      icon: Clock,
      label: 'Avg Session Time',
      value: analytics.avgSessionTime,
      trend: '+5%',
      color: '#4ECDC4',
    },
    {
      icon: TrendingUp,
      label: 'Bounce Rate',
      value: analytics.bounceRate,
      trend: '-3%',
      color: '#45B7D1',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: '#0F1F3C' }}>
            <BarChart3 size={40} style={{ color: '#00BFB3' }} />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Real-time visitor analytics and engagement metrics</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon size={32} style={{ color: stat.color }} />
                  <span className="text-green-500 text-sm font-bold">{stat.trend}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold" style={{ color: '#0F1F3C' }}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Pages */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C' }}>
              🏆 Top Pages
            </h2>
            <div className="space-y-4">
              {analytics.topPages.map((page, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">{page.path}</span>
                    <span className="text-sm text-gray-500">{page.views} views</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(page.views / analytics.topPages[0].views) * 100}%`,
                        backgroundColor: '#00BFB3',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Traffic Sources */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C' }}>
              🔗 Traffic Sources
            </h2>
            <div className="space-y-4">
              {analytics.referrers.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">{ref.source}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(ref.count / analytics.referrers[0].count) * 100}%`,
                          backgroundColor: '#4ECDC4',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 font-bold">{ref.count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Device Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-xl shadow-lg lg:col-span-2"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C' }}>
              📱 Device Types
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {analytics.deviceTypes.map((device, idx) => (
                <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold" style={{ color: '#00BFB3' }}>
                    {device.percentage}%
                  </p>
                  <p className="text-gray-600 font-semibold">{device.type}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-gray-600 text-sm"
        >
          <p>Last updated: {new Date().toLocaleString()}</p>
        </motion.div>
      </div>
    </div>
  );
}
