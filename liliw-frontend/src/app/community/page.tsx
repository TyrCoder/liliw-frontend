'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import ParticipationModal from '@/components/ParticipationModal';

const TEAL = '#00BFB3';

const ICON_MAP: Record<string, React.ReactNode> = {
  volunteer:   <Users className="w-5 h-5" />,
  partnership: <Briefcase className="w-5 h-5" />,
  feedback:    <MessageSquare className="w-5 h-5" />,
};

const DEFAULT_ACTIVITIES = [
  {
    type: 'volunteer',
    title: 'Volunteer with Us',
    description: 'Give your time, gain a world of experience',
    items: ['Tour guide for local and foreign visitors', 'Festival and cultural event support', 'Youth cultural ambassador programs', 'Community workshop facilitation'],
    cta: 'Sign Up to Volunteer',
  },
  {
    type: 'partnership',
    title: 'Business Partnerships',
    description: 'Grow your business through tourism',
    items: ['Tourism enterprise development', 'Artisan cooperative formation', 'Hospitality and accommodation ties', 'Craft, product & souvenir collaborations'],
    cta: 'Become a Partner',
  },
  {
    type: 'feedback',
    title: 'Share Your Feedback',
    description: "Your voice shapes Liliw's future",
    items: ['Tourist satisfaction surveys', 'Event and service evaluation forms', 'Improvement suggestions and ideas', 'Experience sharing and testimonials'],
    cta: 'Give Feedback',
  },
];

function parseBullets(raw: any): string[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw.split('\n').map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((block: any) => (block?.children ?? []).map((c: any) => c?.text ?? '').join('').replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

type Activity = { type: string; title: string; description: string; items: string[]; cta: string };

export default function CommunityPage() {
  const [activities, setActivities]             = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activeActivity, setActiveActivity]     = useState<{ title: string; type: string } | null>(null);

  useEffect(() => {
    fetch('/api/strapi/participation-options')
      .then(r => r.json())
      .then(data => {
        const items: any[] = data.data || [];
        if (items.length > 0) {
          setActivities(items.map(item => {
            const a = item.attributes || item;
            return {
              type:        a.card_type || 'feedback',
              title:       a.title || '',
              description: a.description || '',
              items:       parseBullets(a.bullet_points),
              cta:         a.button_text || 'Sign Up',
            };
          }));
        }
      })
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* ── Page Header ── */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <Link href="/" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: TEAL }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: TEAL }}>
            Community Engagement
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Be part of Liliw&apos;s tourism story — volunteer, partner, or share your feedback.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-20">

        {/* ── Ways to Participate ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: TEAL }}>How to Join</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ways to Participate</h2>
            <p className="text-gray-500 text-sm max-w-lg">
              Whether you have time, skills, or a business — there&apos;s a place for you in the Liliw community.
            </p>
          </motion.div>

          {activitiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="h-1.5 w-full bg-teal-200 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-4/6 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activities.map((act, idx) => (
                <motion.div
                  key={`${act.type}-${idx}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: TEAL }} />
                  <div className="flex flex-col flex-1 p-6">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: 'rgba(0,191,179,.12)', color: TEAL }}
                    >
                      {ICON_MAP[act.type] ?? <Users className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{act.title}</h3>
                    {act.description && (
                      <p className="text-sm text-gray-400 mb-5">{act.description}</p>
                    )}
                    {act.items.length > 0 && (
                      <ul className="space-y-2.5 mb-7 flex-1">
                        {act.items.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[9px] font-bold"
                              style={{ backgroundColor: TEAL }}
                            >
                              ✓
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => setActiveActivity({ title: act.title, type: act.type })}
                      className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                      style={{ backgroundColor: TEAL }}
                    >
                      {act.cta} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── Why It Matters ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: TEAL }}>Why Participate</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Participation Matters</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: 'Share Your Voice',              body: "Your feedback helps create better experiences for residents and visitors alike. Every opinion shapes Liliw's future." },
              { title: 'Build Real Connections',        body: 'Volunteer opportunities let you meet people from around the world and grow your network in a welcoming community.' },
              { title: 'Create Economic Opportunities', body: 'Partnerships and community enterprises generate income while preserving local culture and sustainable tourism.' },
              { title: 'Learn & Grow Together',         body: 'Develop new skills through workshops. Share your knowledge and gain perspective from visitors and fellow residents.' },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-6 rounded-2xl border"
                style={{ backgroundColor: 'rgba(0,191,179,.05)', borderColor: 'rgba(0,191,179,.2)' }}
              >
                <h4 className="font-bold text-gray-900 mb-2">{card.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {activeActivity && (
        <ParticipationModal
          activityTitle={activeActivity.title}
          activityType={activeActivity.type}
          onClose={() => setActiveActivity(null)}
        />
      )}
    </div>
  );
}
