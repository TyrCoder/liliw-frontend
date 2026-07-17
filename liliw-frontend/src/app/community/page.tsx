'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Briefcase, Eye, Calendar, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ParticipationModal from '@/components/ParticipationModal';
import { stripHtml } from '@/lib/text';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

type FormField = { id: string; type: string; label: string; required: boolean; options: string[] };

function EventSignUpModal({ event, onClose }: { event: { id: any; slug: string; title: string; date_start?: string }; onClose: () => void }) {
  const [form, setForm]   = useState<{ id: string; fields: FormField[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch(`/api/event-forms/${event.slug}`)
      .then(r => r.json())
      .then(d => setForm(d.form))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [event.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setStatus('submitting'); setErrMsg('');
    try {
      const res = await fetch(`/api/event-forms/${event.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: form.id, respondent_name: name, respondent_email: email, answers }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
      setStatus('success');
    } catch (err: any) {
      setErrMsg(err.message); setStatus('error');
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <AnimatePresence>
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ backgroundColor: 'rgba(10,20,50,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-gray-900">Sign Up for Event</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>}

          {!loading && !form && (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">The sign-up form for this event hasn&apos;t been set up yet.<br />Check back soon!</p>
            </div>
          )}

          {!loading && form && status === 'success' && (
            <div className="text-center py-10">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">You&apos;re signed up!</h3>
              <p className="text-sm text-gray-400">Your response has been recorded. See you at the event!</p>
            </div>
          )}

          {!loading && form && status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
                </div>
              </div>

              {form.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === 'short_text' && (
                    <input value={answers[field.id] || ''} onChange={e => setAnswers(a => ({...a, [field.id]: e.target.value}))} className={inputCls} />
                  )}
                  {field.type === 'paragraph' && (
                    <textarea value={answers[field.id] || ''} onChange={e => setAnswers(a => ({...a, [field.id]: e.target.value}))} rows={3} className={`${inputCls} resize-none`} />
                  )}
                  {field.type === 'number' && (
                    <input type="number" value={answers[field.id] || ''} onChange={e => setAnswers(a => ({...a, [field.id]: e.target.value}))} className={inputCls} />
                  )}
                  {field.type === 'dropdown' && (
                    <select value={answers[field.id] || ''} onChange={e => setAnswers(a => ({...a, [field.id]: e.target.value}))} className={`${inputCls} bg-white`}>
                      <option value="">Select an option</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {field.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {field.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={field.id} value={opt} checked={answers[field.id] === opt} onChange={() => setAnswers(a => ({...a, [field.id]: opt}))} className="accent-blue-600" />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkboxes' && (
                    <div className="space-y-2">
                      {field.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(answers[field.id] || []).includes(opt)}
                            onChange={e => setAnswers(a => { const cur: string[] = a[field.id] || []; return {...a, [field.id]: e.target.checked ? [...cur, opt] : cur.filter((x: string) => x !== opt)}; })}
                            className="accent-blue-600 w-4 h-4" />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                  <AlertCircle className="w-4 h-4" />{errMsg}
                </div>
              )}

              <button type="submit" disabled={status === 'submitting'}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0B3D91' }}>
                {status === 'submitting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Sign-Up'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}

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
  const [signUpEvent, setSignUpEvent] = useState<any | null>(null);

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
          coverUrl: e.attributes?.cover_image?.data?.attributes?.url || e.cover_image?.url || null,
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
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>Community Engagement</h1>
              <Bunting flip />
            </div>
            <p className="text-white/70 text-sm sm:text-base text-center" style={{ fontFamily: BL }}>
              Be part of Liliw&apos;s tourism story — volunteer, partner, or share your feedback.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">

        {/* Ways to Participate */}
        <section>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <p className="section-label mb-2" style={{ color: '#1565C0' }}>How to Join</p>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Ways to Participate</h2>
            <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-gray-500 text-sm max-w-lg" style={{ fontFamily: BL }}>
              Whether you have time, skills, or a business — there&apos;s a place for you in the Liliw community.
            </p>
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
                    {event.coverUrl && (
                      <div className="h-36 overflow-hidden">
                        <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
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
                        <Link href={`/events/${event.slug}`}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-gray-50 flex items-center justify-center gap-1.5"
                          style={{ borderColor: '#0B3D91', color: '#0B3D91', fontFamily: BL }}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <button onClick={() => setSignUpEvent(event)}
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

      {signUpEvent && (
        <EventSignUpModal event={signUpEvent} onClose={() => setSignUpEvent(null)} />
      )}
    </div>
  );
}
