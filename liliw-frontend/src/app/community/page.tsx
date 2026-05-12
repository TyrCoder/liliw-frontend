'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Bell, Calendar, MapPin,
  MessageSquare, Users, Briefcase,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import EventModal from '@/components/EventModal';
import ParticipationModal from '@/components/ParticipationModal';

// ── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ── Fallback participation activities ────────────────────────────────────────
const DEFAULT_ACTIVITIES = [
  {
    icon: 'volunteer',
    title: 'Volunteer with Us',
    description: 'Give your time, gain a world of experience',
    items: ['Tour guide for local and foreign visitors', 'Festival and cultural event support', 'Youth cultural ambassador programs', 'Community workshop facilitation'],
    cta_label: 'Sign Up to Volunteer',
  },
  {
    icon: 'partnership',
    title: 'Business Partnerships',
    description: 'Grow your business through tourism',
    items: ['Tourism enterprise development', 'Artisan cooperative formation', 'Hospitality and accommodation ties', 'Craft, product & souvenir collaborations'],
    cta_label: 'Become a Partner',
  },
  {
    icon: 'feedback',
    title: 'Share Your Feedback',
    description: 'Your voice shapes Liliw\'s future',
    items: ['Tourist satisfaction surveys', 'Event and service evaluation forms', 'Improvement suggestions and ideas', 'Experience sharing and testimonials'],
    cta_label: 'Give Feedback',
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  feedback:    <MessageSquare className="w-5 h-5" />,
  volunteer:   <Users className="w-5 h-5" />,
  partnership: <Briefcase className="w-5 h-5" />,
};

const CARD_ACCENT: Record<string, string> = {
  feedback:    '#8B5CF6',
  volunteer:   '#00BFB3',
  partnership: '#3B82F6',
};

// ── Category badge colors ────────────────────────────────────────────────────
const CATEGORY_BADGE: Record<string, string> = {
  festival:    'bg-purple-100 text-purple-700',
  cultural:    'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
  other:       'bg-gray-100 text-gray-600',
};

export default function CommunityPage() {
  const [activities, setActivities]   = useState(DEFAULT_ACTIVITIES);
  const [events, setEvents]           = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // event modal state
  const [selectedEvent, setSelectedEvent]   = useState<any>(null);
  const [eventModalStep, setEventModalStep] = useState<'details' | 'form'>('details');

  // participation modal state
  const [activeActivity, setActiveActivity] = useState<{ title: string; type: string } | null>(null);

  useEffect(() => {
    // Fetch dynamic participation activities from Strapi
    fetch('/api/strapi/participation-options')
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length > 0) {
          setActivities(items.map((item: any) => {
            const a = item.attributes || item;
            return {
              icon: a.card_type || 'feedback',
              title: a.title || '',
              description: a.description || '',
              items: typeof a.bullet_points === 'string'
                ? a.bullet_points.split('\n').map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
                : [],
              cta_label: a.button_text || 'Sign Up',
            };
          }));
        }
      })
      .catch(() => {});

    // Fetch events
    fetch('/api/strapi/events')
      .then(r => r.json())
      .then(d => setEvents(d.data || []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  const openEventDetails = (item: any) => { setEventModalStep('details'); setSelectedEvent(item); };
  const openEventJoin    = (item: any) => { setEventModalStep('form');    setSelectedEvent(item); };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#00BFB3 0%,#009E99 55%,#007A75 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center text-white/80 hover:text-white text-sm font-semibold mb-8 group transition">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 tracking-wider uppercase">
                Community Engagement
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Be Part of<br />Liliw&apos;s Story
              </h1>
              <p className="text-white/85 text-lg mb-8 leading-relaxed">
                Volunteer, partner, or share your feedback — every contribution helps shape Liliw as a world-class destination.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => document.getElementById('activities')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-white font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-lg"
                  style={{ color: '#00BFB3' }}
                >
                  Get Involved
                </button>
                <button
                  onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-white/15 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition"
                >
                  View Events
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Participation Activities ── */}
      <section id="activities" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00BFB3' }}>How to Join</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Ways to Participate</h2>
            <p className="text-gray-400 text-sm max-w-lg">
              Whether you have time, skills, or a business — there&apos;s a place for you in the Liliw community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((act, idx) => {
              const accent = CARD_ACCENT[act.icon] ?? '#00BFB3';
              return (
                <motion.div key={idx} variants={fadeUp}
                  className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
                  <div className="flex flex-col flex-1 p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${accent}18`, color: accent }}>
                      {ICON_MAP[act.icon] ?? <Users className="w-5 h-5" />}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1">{act.title}</h3>
                    <p className="text-sm text-gray-400 mb-5">{act.description}</p>

                    {act.items.length > 0 && (
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {act.items.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[9px] font-bold"
                              style={{ backgroundColor: accent }}>
                              ✓
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={() => setActiveActivity({ title: act.title, type: act.icon })}
                      className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                      style={{ backgroundColor: accent }}
                    >
                      {act.cta_label}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── Upcoming Events ── */}
      <section id="events" className="border-t border-gray-100 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00BFB3' }}>Open to Everyone</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-400 text-sm mt-2">Join an event and be part of the Liliw community in action.</p>
            </motion.div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <motion.div variants={fadeUp} className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(0,191,179,.1)', color: '#00BFB3' }}>
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">No upcoming events yet</p>
                <p className="text-sm text-gray-400">Check back soon — new events are added regularly.</p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {events.map(item => {
                  const a = item.attributes || item;

                  const description = (() => {
                    const d = a.description;
                    if (!d) return '';
                    if (typeof d === 'string') return d;
                    if (Array.isArray(d)) return d.map((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '').join(' ')).join(' ');
                    return '';
                  })();

                  const dateStart = a.date_start ? new Date(a.date_start) : null;
                  const schedule = a.schedule ||
                    (dateStart ? dateStart.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null);

                  return (
                    <motion.div key={item.id} variants={fadeUp}
                      className="group bg-white border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all flex overflow-hidden rounded-xl"
                    >
                      <div className="w-1 shrink-0" style={{ backgroundColor: '#00BFB3' }} />
                      <div className="flex-1 px-5 py-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Bell className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                            {a.category && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${CATEGORY_BADGE[a.category] || 'bg-gray-100 text-gray-600'}`}>
                                {a.category}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">Event</span>
                          </div>
                          {schedule && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                              <Calendar className="w-3.5 h-3.5" />{schedule}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{a.title}</h3>
                        {description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{description}</p>}

                        {/* Bottom row — venue + actions */}
                        <div className="flex items-center justify-between gap-3 mt-1 flex-wrap">
                          {a.venue ? (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3 shrink-0" />{a.venue}
                            </span>
                          ) : <span />}

                          <div className="flex items-center gap-3 ml-auto shrink-0">
                            <button
                              onClick={() => openEventDetails(item)}
                              className="text-xs font-semibold flex items-center gap-1 hover:underline transition text-gray-400 hover:text-gray-600"
                            >
                              Details <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEventJoin(item)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition"
                              style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}
                            >
                              Join This Event
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Why It Matters ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00BFB3' }}>Why Participate</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Participation Matters</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: 'Share Your Voice',              body: 'Your feedback helps create better experiences for residents and visitors alike. Every opinion shapes Liliw\'s future.' },
              { title: 'Build Real Connections',        body: 'Volunteer opportunities let you meet people from around the world and grow your network in a welcoming community.' },
              { title: 'Create Economic Opportunities', body: 'Partnerships and community enterprises generate income while preserving local culture and supporting sustainable tourism.' },
              { title: 'Learn & Grow Together',         body: 'Develop new skills through workshops. Share your knowledge and gain perspective from visitors and fellow residents.' },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeUp}
                className="p-6 rounded-2xl border"
                style={{ backgroundColor: 'rgba(0,191,179,.05)', borderColor: 'rgba(0,191,179,.25)' }}>
                <h4 className="font-bold text-gray-900 mb-2">{card.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Modals ── */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          defaultStep={eventModalStep}
          onClose={() => setSelectedEvent(null)}
        />
      )}
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
