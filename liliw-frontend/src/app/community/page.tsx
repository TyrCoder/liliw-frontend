'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Bell, Calendar, MapPin,
  MessageSquare, Users, Briefcase, Heart, Globe, Lightbulb, Star,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import EventModal from '@/components/EventModal';

// ── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

// ── Static participation cards ───────────────────────────────────────────────
const WAYS = [
  {
    type: 'volunteer',
    icon: <Users className="w-6 h-6" />,
    color: '#00BFB3',
    bg: 'rgba(0,191,179,.1)',
    title: 'Volunteer with Us',
    tagline: 'Give your time, gain a world of experience',
    bullets: [
      'Tour guide for local and foreign visitors',
      'Festival and cultural event support',
      'Youth cultural ambassador programs',
      'Community workshop facilitation',
    ],
    cta: 'Become a Volunteer',
  },
  {
    type: 'partnership',
    icon: <Briefcase className="w-6 h-6" />,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,.1)',
    title: 'Business Partnerships',
    tagline: 'Grow your business through tourism',
    bullets: [
      'Tourism enterprise development',
      'Artisan cooperative formation',
      'Hospitality and accommodation ties',
      'Craft, product & souvenir collaborations',
    ],
    cta: 'Explore Partnerships',
  },
  {
    type: 'feedback',
    icon: <MessageSquare className="w-6 h-6" />,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,.1)',
    title: 'Share Your Feedback',
    tagline: 'Your voice shapes Liliw\'s future',
    bullets: [
      'Tourist satisfaction surveys',
      'Event and service evaluation forms',
      'Improvement suggestions & ideas',
      'Experience sharing and testimonials',
    ],
    cta: 'Give Feedback',
  },
];

// ── Impact stats ─────────────────────────────────────────────────────────────
const IMPACT = [
  { icon: <Heart className="w-5 h-5" />, label: 'Local Volunteers', value: '120+' },
  { icon: <Globe className="w-5 h-5" />, label: 'Annual Visitors', value: '50K+' },
  { icon: <Lightbulb className="w-5 h-5" />, label: 'Community Events', value: '30+' },
  { icon: <Star className="w-5 h-5" />, label: 'Partner Businesses', value: '80+' },
];

// ── Category badge colors ────────────────────────────────────────────────────
const CATEGORY_BADGE: Record<string, string> = {
  festival:    'bg-purple-100 text-purple-700',
  cultural:    'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
  other:       'bg-gray-100 text-gray-600',
};

export default function CommunityPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/strapi/events')
      .then(r => r.json())
      .then(d => setEvents(d.data || []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#00BFB3 0%,#009E99 60%,#007A75 100%)' }}>
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />

        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center text-white/80 hover:text-white text-sm font-semibold mb-8 group transition">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 tracking-wide uppercase">
                Community Engagement
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Be Part of<br />Liliw&apos;s Story
              </h1>
              <p className="text-white/85 text-lg sm:text-xl mb-8 leading-relaxed">
                Join our growing community of volunteers, partners, and tourism advocates. Together, we shape the future of Liliw as a world-class destination.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => document.getElementById('ways')?.scrollIntoView({ behavior: 'smooth' })}
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

      {/* ── Impact Stats ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {IMPACT.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: 'rgba(0,191,179,.1)', color: '#00BFB3' }}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Ways to Participate ── */}
      <section id="ways" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#00BFB3' }}>How to Join</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Three Ways to Get Involved</h2>
            <p className="text-gray-500 max-w-xl">Whether you have time, skills, or a business — there&apos;s a place for you in the Liliw community.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WAYS.map((w) => (
              <motion.div
                key={w.type}
                variants={fadeUp}
                className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Color top bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: w.color }} />

                <div className="flex flex-col flex-1 p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: w.bg, color: w.color }}>
                    {w.icon}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{w.title}</h3>
                  <p className="text-sm text-gray-400 mb-5">{w.tagline}</p>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {w.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold"
                          style={{ backgroundColor: w.color }}>
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => router.push(`/participate?type=${w.type}`)}
                    className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.cta}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Upcoming Events ── */}
      <section id="events" className="border-t border-gray-100 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-8 flex items-end justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#00BFB3' }}>Open to All</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
            </motion.div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-36 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <motion.div variants={fadeUp} className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(0,191,179,.1)', color: '#00BFB3' }}>
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">No events right now</p>
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
                      whileHover={{ x: 3 }}
                      className="group bg-white border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all flex overflow-hidden rounded-xl"
                    >
                      <div className="w-1 shrink-0" style={{ backgroundColor: '#00BFB3' }} />
                      <div className="flex-1 px-5 py-4">
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
                        {description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{description}</p>}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          {a.venue && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3 shrink-0" />{a.venue}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedEvent(item)}
                            className="text-xs font-bold shrink-0 ml-auto flex items-center gap-1 hover:underline transition"
                            style={{ color: '#00BFB3' }}
                          >
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
            <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#00BFB3' }}>Why Participate</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Participation Matters</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: 'Share Your Voice', body: 'Your feedback helps create better experiences for residents and visitors alike. Every opinion shapes Liliw\'s future as a tourism destination.' },
              { title: 'Build Real Connections', body: 'Volunteer opportunities let you meet people from around the world and grow your network in a vibrant, welcoming community.' },
              { title: 'Create Economic Opportunities', body: 'Business partnerships and community enterprises generate income while preserving local culture and supporting sustainable tourism.' },
              { title: 'Learn & Grow Together', body: 'Develop new skills through training programs and workshops. Share your knowledge and gain perspective from visitors and fellow residents.' },
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

      {/* ── Contact CTA ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#00BFB3 0%,#009E99 60%,#007A75 100%)' }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Get Involved?</h3>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">
                  Reach out to the Liliw Tourism Office or fill out our participation form and we&apos;ll get back to you.
                </p>
                <button
                  onClick={() => router.push('/participate')}
                  className="px-6 py-3 bg-white font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-md"
                  style={{ color: '#00BFB3' }}
                >
                  Submit a Request
                </button>
              </div>
              <div className="space-y-2 text-sm text-white/90">
                <p className="font-bold text-white text-base mb-3">Liliw Tourism Office</p>
                <p>Municipal Hall, Liliw, Laguna 4004</p>
                <p>+63 (2) XXXX-XXXX</p>
                <p>tourism@liliw.gov.ph</p>
                <p className="pt-2 opacity-70">Mon – Fri, 8:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
