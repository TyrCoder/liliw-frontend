'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EventModalProps {
  event: any;
  onClose: () => void;
  defaultStep?: 'details' | 'form';
}

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '').join(' '))
      .join('\n\n');
  }
  return '';
}

export default function EventModal({ event, onClose, defaultStep = 'details' }: EventModalProps) {
  const a = event.attributes || event;
  const { user, token } = useAuth();

  const [step, setStep] = useState<'details' | 'form' | 'success'>(defaultStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: user?.username || '',
    email: user?.email || '',
    phone: '',
    notes: '',
  });

  const description = extractText(a.description);
  const program     = extractText(a.program);

  const dateStart  = a.date_start ? new Date(a.date_start) : null;
  const dateEnd    = a.date_end   ? new Date(a.date_end)   : null;
  const schedule   = a.schedule  ||
    (dateStart
      ? dateStart.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) +
        (dateEnd ? ` – ${dateEnd.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}` : '')
      : null);

  const pricingLabel: string =
    a.pricing_label ||
    (a.is_free ? 'Free entry' : a.price ? `Starting at ₱${a.price}` : '');

  const pricingColor =
    pricingLabel.toLowerCase().includes('free')    ? 'bg-teal-50 text-teal-700 border border-teal-200' :
    pricingLabel.toLowerCase().includes('limited') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    pricingLabel ? 'bg-purple-50 text-purple-700 border border-purple-200' : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/event-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventId: event.id,
          event_title: a.title,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
          strapi_user_id: user?.id ?? null,
          username: user?.username ?? '',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit');
      }
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* ── Step: Event Details ── */}
          {step === 'details' && (
            <div className="p-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                  Open
                </span>
                {pricingLabel && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${pricingColor}`}>
                    {pricingLabel}
                  </span>
                )}
                {a.category && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                    {a.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pr-8">{a.title}</h2>

              {/* Meta */}
              <div className="space-y-2 mb-5 text-sm text-gray-600">
                {schedule && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: '#1565C0' }} />
                    <span>{schedule}</span>
                  </div>
                )}
                {a.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: '#1565C0' }} />
                    <span>{a.venue}</span>
                  </div>
                )}
                {a.max_participants && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" style={{ color: '#1565C0' }} />
                    <span>Max {a.max_participants} participants</span>
                  </div>
                )}
                {a.capacity_note && !a.max_participants && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" style={{ color: '#1565C0' }} />
                    <span>{a.capacity_note}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <>
                  <hr className="border-gray-100 mb-4" />
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">{description}</p>
                </>
              )}

              {/* Program */}
              {program && (
                <>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Program</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">{program}</p>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#1565C0,#009E99)' }}
                >
                  Participate Now
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Participation Form ── */}
          {step === 'form' && (
            <div className="p-6">
              <button
                onClick={() => { setStep('details'); setError(''); }}
                className="inline-flex items-center gap-1 text-sm font-semibold mb-4 hover:opacity-70 transition"
                style={{ color: '#1565C0' }}
              >
                <ChevronLeft className="w-4 h-4" /> Back to event
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-1">Sign Up</h2>
              <p className="text-sm text-gray-500 mb-5">{a.title}</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="full_name" required placeholder="Full Name"
                  value={form.full_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <input
                  name="email" type="email" required placeholder="Email Address"
                  value={form.email} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <input
                  name="phone" type="tel" placeholder="Phone Number (optional)"
                  value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <textarea
                  name="notes" rows={3} placeholder="Any notes or questions? (optional)"
                  value={form.notes} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />

                <div className="flex gap-3 pt-1">
                  <button
                    type="button" onClick={() => setStep('details')}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#1565C0,#009E99)' }}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#1565C0' }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-sm text-gray-500 mb-1">
                You've signed up for <span className="font-semibold text-gray-700">{a.title}</span>.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Our team will reach out to confirm your participation.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#1565C0,#009E99)' }}
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
