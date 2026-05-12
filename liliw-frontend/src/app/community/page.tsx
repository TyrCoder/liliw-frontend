'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Briefcase, MessageSquare, Calendar, MapPin, ChevronRight, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import EventModal from '@/components/EventModal';

const CATEGORY_BADGE: Record<string, string> = {
  festival: 'bg-purple-100 text-purple-700',
  cultural: 'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  feedback:    <MessageSquare className="w-5 h-5" />,
  volunteer:   <Users className="w-5 h-5" />,
  partnership: <Briefcase className="w-5 h-5" />,
};

const DEFAULT_OPTIONS = [
  {
    icon: 'feedback',
    title: 'Share Your Feedback',
    description: 'Help us improve tourism experiences in Liliw',
    items: ['Tourist satisfaction surveys', 'Event evaluation forms', 'Service improvement suggestions', 'Experience sharing and testimonials'],
    cta_label: 'Give Feedback',
  },
  {
    icon: 'volunteer',
    title: 'Volunteer with Us',
    description: 'Join our community in welcoming visitors',
    items: ['Tour guide opportunities', 'Festival and event support', 'Cultural ambassador programs', 'Community workshop facilitation'],
    cta_label: 'Become a Volunteer',
  },
  {
    icon: 'partnership',
    title: 'Business Partnerships',
    description: 'Connect your business with tourism',
    items: ['Tourism enterprise development', 'Artisan cooperative formation', 'Hospitality service partnerships', 'Craft and product collaborations'],
    cta_label: 'Explore Partnerships',
  },
];

export default function CommunityPage() {
  const [joinableEvents, setJoinableEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [participationOptions, setParticipationOptions] = useState(DEFAULT_OPTIONS);

  useEffect(() => {
    fetch('/api/strapi/events')
      .then(r => r.json())
      .then(data => setJoinableEvents(data.data || []))
      .catch(() => setJoinableEvents([]))
      .finally(() => setEventsLoading(false));

    fetch('/api/strapi/participation-options')
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length > 0) {
          setParticipationOptions(items.map((item: any) => {
            const a = item.attributes || item;
            return {
              icon: a.card_type || a.icon || 'feedback',
              title: a.title || '',
              description: a.description || '',
              items: typeof a.bullet_points === 'string'
                ? a.bullet_points.split('\n').map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
                : typeof a.items === 'string'
                ? a.items.split('\n').map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
                : [],
              cta_label: a.button_text || a.cta_label || 'Learn More',
            };
          }));
        }
      })
      .catch(() => {});
  }, []);


  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>Community Engagement</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Be part of Liliw&apos;s tourism story</p>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Joinable Events */}
          {(eventsLoading || joinableEvents.length > 0) && (
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Open Events — Join Now</h2>
              {eventsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {joinableEvents.map(item => {
                    const a = item.attributes || item;

                    // Extract plain text from rich-text blocks or plain string
                    const description = (() => {
                      const d = a.description;
                      if (!d) return '';
                      if (typeof d === 'string') return d;
                      if (Array.isArray(d)) {
                        return d.map((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '').join(' ')).join(' ');
                      }
                      return '';
                    })();

                    const dateStart = a.date_start ? new Date(a.date_start) : null;
                    const schedule = a.schedule ||
                      (dateStart ? dateStart.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null);

                    const pricingLabel: string = a.pricing_label || (a.is_free ? 'Free entry' : a.price ? `Starting at ₱${a.price}` : '');
                    const pricingColor =
                      pricingLabel.toLowerCase().includes('free') ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      pricingLabel.toLowerCase().includes('limited') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200';

                    return (
                      <motion.div key={item.id}
                        whileHover={{ x: 2 }}
                        className="group bg-white border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all flex overflow-hidden rounded-lg"
                      >
                        {/* Left teal accent bar */}
                        <div className="w-1 shrink-0" style={{ backgroundColor: '#00BFB3' }} />

                        <div className="flex-1 px-4 py-4">
                          {/* Top row: bell + badges + date */}
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Bell className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                              {a.category && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${CATEGORY_BADGE[a.category] || 'bg-gray-100 text-gray-600'}`}>
                                  {a.category}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                                Event
                              </span>
                            </div>
                            {schedule && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                                {schedule}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5">{a.title}</h3>

                          {/* Description */}
                          {description && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{description}</p>
                          )}

                          {/* Bottom row: venue + Read More */}
                          <div className="flex items-center justify-between gap-2 mt-1">
                            {a.venue && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {a.venue}
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedEvent(item)}
                              className="text-xs font-semibold shrink-0 ml-auto flex items-center gap-1 hover:underline transition"
                              style={{ color: '#00BFB3' }}
                            >
                              Read More <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Participation Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {participationOptions.map((option, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Colored top bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: '#00BFB3' }} />

                <div className="flex flex-col flex-1 p-6">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(0,191,179,.12)', color: '#00BFB3' }}>
                    {ICON_MAP[option.icon] ?? <MessageSquare className="w-5 h-5" />}
                  </div>

                  {/* Title + description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{option.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{option.description}</p>

                  {/* Bullet points */}
                  {option.items.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {option.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="font-bold mt-0.5 shrink-0" style={{ color: '#00BFB3' }}>✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA button — scrolls to form */}
                  <button
                    onClick={() => document.getElementById('participate-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-auto w-full py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: '#00BFB3' }}
                  >
                    {option.cta_label}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Why Participate */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Why Your Participation Matters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Share Your Voice</h4>
                <p className="text-gray-700">
                  Your feedback helps us create better experiences for residents and visitors alike. 
                  Every opinion matters in shaping Liliw's future as a tourism destination.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Build Connections</h4>
                <p className="text-gray-700">
                  Join a vibrant community of locals and travelers. Volunteer opportunities allow you to 
                  meet people from around the world and grow your network.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Create Economic Opportunities</h4>
                <p className="text-gray-700">
                  Business partnerships and community enterprises generate income while preserving local culture.
                  Support sustainable tourism that benefits everyone.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Learn & Grow</h4>
                <p className="text-gray-700">
                  Develop new skills through training programs and workshops. Share your knowledge with 
                  visitors and fellow community members.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact & Resources */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Get Involved Today</h2>
            <div className="text-white rounded-2xl p-8" style={{ backgroundColor: '#00BFB3' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Liliw Tourism Office</h4>
                  <p className="mb-2">Municipal Hall, Liliw, Laguna 4004</p>
                  <p className="mb-2">Contact: +63 (2) XXXX-XXXX</p>
                  <p className="mb-4">Email: tourism@liliw.gov.ph</p>
                  <p className="opacity-90">Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-3">Follow Us Online</h4>
                  <p className="mb-3">Stay updated on community initiatives and opportunities</p>
                  <div className="space-y-2">
                    <p>Facebook: @LiliwTourism</p>
                    <p>Instagram: @LiliwTourism</p>
                    <p>Website: tourism.liliw.gov.ph</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

{selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
