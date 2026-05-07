'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Calendar, MapPin, Users, Clock,
  CheckCircle, LogIn, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

const STRAPI      = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/* ─── helpers ─────────────────────────────────────────────── */

function getPhotoUrl(p: any): string | null {
  if (!p) return null;
  const raw = p.url || p.data?.attributes?.url || p.attributes?.url || null;
  if (!raw) return null;
  return raw.startsWith('/') ? `${STRAPI}${raw}` : raw;
}

function blocksToHtml(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(b => {
    const text = (b.children || []).map((c: any) => c.text || '').join('');
    switch (b.type) {
      case 'heading':   return `<h${b.level} class="font-bold text-gray-900 mt-3 mb-1">${text}</h${b.level}>`;
      case 'paragraph': return `<p class="text-gray-600 leading-relaxed mb-2">${text}</p>`;
      case 'list':
        const items = (b.children || []).map((li: any) =>
          `<li>${(li.children || []).map((c: any) => c.text || '').join('')}</li>`
        ).join('');
        return b.format === 'ordered'
          ? `<ol class="list-decimal pl-5 mb-2 space-y-1 text-gray-600">${items}</ol>`
          : `<ul class="list-disc pl-5 mb-2 space-y-1 text-gray-600">${items}</ul>`;
      default: return `<p class="text-gray-600 mb-2">${text}</p>`;
    }
  }).join('');
}

const CATEGORY_BADGE: Record<string, string> = {
  festival:    'bg-purple-100 text-purple-700',
  cultural:    'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
  other:       'bg-gray-100 text-gray-600',
};

/* ─── page ─────────────────────────────────────────────────── */

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user }  = useAuth();
  const router    = useRouter();

  const [event, setEvent]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [authModal, setAuthModal] = useState(false);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [notes, setNotes]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');
  const [alreadySignedUp, setAlreadySignedUp] = useState(false);

  useEffect(() => {
    fetch(`${STRAPI}/api/events?filters[slug][$eq]=${slug}&populate=cover_image,photos&publicationState=live`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    })
      .then(r => r.json())
      .then(data => {
        const item = data.data?.[0];
        if (!item) { router.replace('/community'); return; }
        setEvent(item);
      })
      .catch(() => router.replace('/community'))
      .finally(() => setLoading(false));
  }, [slug, router]);

  // Pre-fill form from logged-in user
  useEffect(() => {
    if (user) {
      setFullName(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthModal(true); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/event-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          full_name: fullName,
          email,
          phone,
          notes,
          strapi_user_id: user.id,
          username: user.username,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BFB3' }} />
      </div>
    );
  }

  if (!event) return null;

  const a            = event.attributes || event;
  const coverUrl     = getPhotoUrl(a.cover_image?.data?.attributes || a.cover_image?.attributes || a.cover_image);
  const descHtml     = blocksToHtml(Array.isArray(a.description) ? a.description : []);
  const programHtml  = blocksToHtml(Array.isArray(a.program) ? a.program : []);
  const category     = a.category || 'other';
  const dateStart    = a.date_start ? new Date(a.date_start) : null;
  const dateEnd      = a.date_end   ? new Date(a.date_end)   : null;

  const fmt = (d: Date) => d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#f8fafc]" suppressHydrationWarning>

      {/* Hero */}
      <div className="relative h-64 sm:h-80 bg-gray-900 overflow-hidden">
        {coverUrl
          ? <img src={coverUrl} alt={a.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0F1F3C,#1a3a5c)' }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-3xl mx-auto">
          <Link href="/community" className="inline-flex items-center text-sm font-semibold mb-3 group" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Participate
          </Link>
          {a.category && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize mb-2 ${CATEGORY_BADGE[category]}`}>
              {category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{a.title}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Info chips */}
        <div className="flex flex-wrap gap-3">
          {dateStart && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: '#00BFB3' }} />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-semibold text-gray-900">{fmt(dateStart)}</p>
                {dateEnd && dateEnd.toDateString() !== dateStart.toDateString() && (
                  <p className="text-xs text-gray-500">to {fmt(dateEnd)}</p>
                )}
              </div>
            </div>
          )}
          {dateStart && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <Clock className="w-4 h-4 shrink-0" style={{ color: '#00BFB3' }} />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm font-semibold text-gray-900">{fmtTime(dateStart)}{dateEnd ? ` – ${fmtTime(dateEnd)}` : ''}</p>
              </div>
            </div>
          )}
          {a.venue && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: '#00BFB3' }} />
              <div>
                <p className="text-xs text-gray-400">Venue</p>
                <p className="text-sm font-semibold text-gray-900">{a.venue}</p>
              </div>
            </div>
          )}
          {a.max_participants && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <Users className="w-4 h-4 shrink-0" style={{ color: '#00BFB3' }} />
              <div>
                <p className="text-xs text-gray-400">Slots</p>
                <p className="text-sm font-semibold text-gray-900">Max {a.max_participants} participants</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {descHtml && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">About this Event</h2>
            <div dangerouslySetInnerHTML={{ __html: descHtml }} />
          </div>
        )}

        {/* Program */}
        {programHtml && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Program</h2>
            <div dangerouslySetInnerHTML={{ __html: programHtml }} />
          </div>
        )}

        {/* Sign-up form */}
        {a.is_joinable && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden" style={{ borderColor: '#00BFB3' }}>

            <div className="px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg,rgba(0,191,179,.06),rgba(0,191,179,.02))' }}>
              <h2 className="text-lg font-bold text-gray-900">Join this Event</h2>
              <p className="text-sm text-gray-500 mt-0.5">Sign up to reserve your spot</p>
            </div>

            <div className="p-6">
              {submitted ? (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                    <CheckCircle className="w-7 h-7" style={{ color: '#00BFB3' }} />
                  </div>
                  <p className="text-lg font-bold text-gray-900">You&apos;re signed up!</p>
                  <p className="text-sm text-gray-500">We&apos;ll be in touch with more details closer to the event.</p>
                </div>
              ) : !user ? (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                    <LogIn className="w-7 h-7" style={{ color: '#00BFB3' }} />
                  </div>
                  <p className="font-bold text-gray-900">Login to Sign Up</p>
                  <p className="text-sm text-gray-500 max-w-xs">You need a Liliw account to join events.</p>
                  <button onClick={() => setAuthModal(true)}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 4px 14px rgba(0,191,179,.35)' }}>
                    Login / Register
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                      <input required value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                        placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                        placeholder="your@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (optional)</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                      placeholder="+63 9XX XXX XXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition resize-none"
                      placeholder="Any questions or special requests?" />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={submitting}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
                    style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Sign Up'}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {authModal && <AuthModal defaultTab="login" onClose={() => setAuthModal(false)} />}
    </div>
  );
}
