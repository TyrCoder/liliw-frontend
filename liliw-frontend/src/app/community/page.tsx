'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare, Users, Briefcase, Eye, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import ParticipationModal from '@/components/ParticipationModal';
import CommunityEventsList from '@/components/CommunityEventsList';
import { stripHtml } from '@/lib/text';
import PageBanner from '@/components/liliw/PageBanner';
import ThumbPlaceholder from '@/components/liliw/ThumbPlaceholder';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign:'middle' }}>
      <line x1="0" y1={cy} x2={W} y2={cy} stroke="#9CA3AF" strokeWidth="1.2" />
      {PENNANT.map((color, idx) => {
        const cx = r + idx * spacing;
        return (
          <g key={idx}>
            {Array.from({ length: panels }).map((_, i) => {
              const a1 = -Math.PI / 2 + i * arc;
              const a2 = -Math.PI / 2 + (i + 1) * arc;
              const x1 = (cx + r * Math.cos(a1)).toFixed(2);
              const y1 = (cy + r * Math.sin(a1)).toFixed(2);
              const x2 = (cx + r * Math.cos(a2)).toFixed(2);
              const y2 = (cy + r * Math.sin(a2)).toFixed(2);
              return <path key={i} d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={i % 2 === 0 ? color : color + 'bb'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

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
  if (typeof raw === 'string') return raw.split('\n').map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  if (Array.isArray(raw)) return raw.map((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '').join('').replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  return [];
}

type Activity = { type: string; title: string; description: string; items: string[]; cta: string };

export default function CommunityPage() {
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activeActivity, setActiveActivity] = useState<{ activity: Activity; step: 'detail' | 'form' } | null>(null);
  const [joinableEvents, setJoinableEvents] = useState<any[]>([]);
  const [loadingJE, setLoadingJE] = useState(true);

  useEffect(() => {
    fetch('/api/content/events')
      .then(r => r.json())
      .then(d => setJoinableEvents((d.data || [])
        .filter((e: any) => e.attributes?.is_joinable || e.is_joinable)
        .map((e: any) => ({
          id: e.id,
          slug: e.attributes?.slug || e.slug,
          title: e.attributes?.title || e.title,
          date_start: e.attributes?.date_start || e.date_start,
          category: e.attributes?.category || e.category,
          // _media first — that is where CMS uploads live. The two legacy
          // Strapi shapes stay as a fallback for older rows.
          coverUrl: e._media?.[0]?.url
            || e.attributes?.cover_image?.data?.attributes?.url
            || e.cover_image?.url
            || null,
        }))))
      .catch(() => {})
      .finally(() => setLoadingJE(false));
  }, []);

  useEffect(() => {
    fetch('/api/content/participation-options')
      .then(r => r.json())
      .then(data => {
        const items: any[] = data.data || [];
        if (items.length > 0) {
          setActivities(items.map(item => {
            const a = item.attributes || item;
            return { type: a.card_type || 'feedback', title: a.title || '', description: a.description || '', items: parseBullets(a.bullet_points), cta: a.button_text || 'Sign Up' };
          }));
        }
      })
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
  }, []);

  return (
    <div className="min-h-screen page-ground" suppressHydrationWarning>

      <PageBanner
        title="Community Engagement"
        subtitle="Be part of Liliw's tourism story — volunteer, partner, or share your feedback."
      />

      <div className="page-wrap px-4 py-16 space-y-20">

        {/* Ways to Participate */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <p className="section-label mb-2" style={{ color: '#1565C0' }}>How to Join</p>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Ways to Participate</h2>
            <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-gray-500 text-sm max-w-lg" style={{ fontFamily: BL }}>
              Whether you have time, skills, or a business — there&apos;s a place for you in the Liliw community.
            </p>
            {/* The three cards below cover volunteering, partnership and
                feedback. Cultural mapping and artisan listing exist only on
                /participate, and nothing had linked there since the cards were
                switched to in-page modals — so two request types the office
                accepts were unreachable from anywhere on the site. */}
            <Link href="/participate"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold hover:gap-2.5 transition-all"
              style={{ color: '#1565C0', fontFamily: BL }}>
              Something else — cultural mapping, artisan listing or a general request
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {activitiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-white h-72 animate-pulse border border-gray-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activities.map((act, idx) => (
                <motion.div key={`${act.type}-${idx}`}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="h-1" style={{ backgroundColor: '#F5C518' }} />
                  <div className="flex flex-col flex-1 p-6">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: 'rgba(11,61,145,0.08)', color: '#0B3D91' }}>
                      {ICON_MAP[act.type] ?? <Users className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#1A1A2E', fontFamily: HL }}>{act.title}</h3>
                    {act.description && <p className="text-sm text-gray-400 mb-5" style={{ fontFamily: BL }}>{stripHtml(act.description)}</p>}
                    {act.items.length > 0 && (
                      <ul className="space-y-2.5 mb-7 flex-1">
                        {act.items.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600" style={{ fontFamily: BL }}>
                            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: '#F5C518', color: '#0B3D91' }}>✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex gap-2">
                      <button onClick={() => setActiveActivity({ activity: act, step: 'detail' })}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-gray-50 flex items-center justify-center gap-1.5"
                        style={{ borderColor: '#0B3D91', color: '#0B3D91', fontFamily: BL }}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => setActiveActivity({ activity: act, step: 'form' })}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
                        Sign Up <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Community Events — the concrete opportunities behind the three
            general "ways to participate" cards above. The header is handed to
            the list so that both disappear together when nothing is posted;
            a section title standing over an empty space is worse than no
            section at all. */}
        <CommunityEventsList
          showHeading={false}
          header={
            <div className="mb-8">
              <p className="section-label mb-2" style={{ color: '#1565C0' }}>Get Involved</p>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Community Events</h2>
              <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
              <p className="text-gray-500 text-sm max-w-lg" style={{ fontFamily: BL }}>
                Activities you can take part in right now — posted by the tourism office.
              </p>
            </div>
          }
        />

        {/* Joinable Events */}
        {(loadingJE || joinableEvents.length > 0) && (
          <section>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <p className="section-label mb-2" style={{ color: '#1565C0' }}>Event Sign-Ups</p>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Join an Upcoming Event</h2>
              <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
              <p className="text-gray-500 text-sm max-w-lg" style={{ fontFamily: BL }}>
                Sign up directly for events open to the community.
              </p>
            </motion.div>

            {loadingJE ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-white h-48 animate-pulse border border-gray-100" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {joinableEvents.map((event, idx) => (
                  <motion.div key={event.slug}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="h-1" style={{ backgroundColor: '#0B3D91' }} />
                    {/* Same reasoning as the news list: an event without a
                        cover kept its card 144px shorter than the ones beside
                        it, and these sit in a row where that is obvious. */}
                    {event.coverUrl ? (
                      <div className="h-36 overflow-hidden">
                        <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <ThumbPlaceholder seed={event.slug || event.title} className="h-36" label="Event" />
                    )}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {event.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize">{event.category}</span>
                        )}
                        {event.date_start && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-4 leading-snug flex-1" style={{ fontFamily: HL }}>{event.title}</h3>
                      <div className="flex gap-2 mt-auto">
                        {/* The sign-up form itself lives on the event's own
                            page (gated there by the same is_joinable flag),
                            so one button to it replaces what used to be a
                            separate "Sign Up" button opening its own modal. */}
                        <Link href={`/community/events/${event.slug}`}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
                          <Eye className="w-3.5 h-3.5" /> View &amp; Sign Up
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Why It Matters */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="section-label mb-2" style={{ color: '#1565C0' }}>Why Participate</p>
            <h2 className="text-3xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>Your Participation Matters</h2>
            <div className="w-8 h-0.5 rounded-full mt-3" style={{ backgroundColor: '#F5C518' }} />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: 'Share Your Voice',              body: "Your feedback helps create better experiences for residents and visitors alike." },
              { title: 'Build Real Connections',        body: 'Volunteer opportunities let you meet people from around the world and grow your network.' },
              { title: 'Create Economic Opportunities', body: 'Partnerships and community enterprises generate income while preserving local culture.' },
              { title: 'Learn & Grow Together',         body: 'Develop new skills through workshops and gain perspective from visitors and fellow residents.' },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white shadow-sm border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
                <h4 className="font-bold mb-2" style={{ color: '#0B3D91', fontFamily: HL }}>{card.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: BL }}>{card.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {activeActivity && (
        <ParticipationModal
          activity={activeActivity.activity}
          initialStep={activeActivity.step}
          onClose={() => setActiveActivity(null)}
        />
      )}

    </div>
  );
}
