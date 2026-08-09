'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

/**
 * Signing up for one community event.
 *
 * Replaces sending people to the general participate form with the event title
 * typed into a message box: that arrived as free text nobody could count, and
 * left the office matching names to events by eye. This posts against the
 * event itself, so the organiser gets a participant list.
 */
export default function JoinEventModal({
  event, onClose, onJoined,
}: {
  event: { id: string; title: string; slots: number | null };
  onClose: () => void;
  onJoined?: () => void;
}) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`/api/community-events/${event.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      // The server refuses a full or closed event even though the card said
      // otherwise, so its reason is shown rather than a generic failure.
      if (!res.ok) throw new Error(d.error || 'Could not sign you up');
      setStatus('done');
      onJoined?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you up');
      setStatus('idle');
    }
  };

  const input = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>

        {status === 'done' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4"
                 style={{ backgroundColor: 'rgba(22,163,74,0.1)' }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#16A34A' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>You&rsquo;re signed up!</h3>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: BL }}>
              The tourism office has your details for <strong>{event.title}</strong> and will be in touch.
            </p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: '#0D9488' }} />
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#0D9488' }}>Join this event</p>
            </div>
            <h3 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E', fontFamily: HL }}>{event.title}</h3>

            <form onSubmit={submit} className="space-y-3.5" style={{ fontFamily: BL }}>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <input name="full_name" required value={form.full_name} onChange={change}
                       className={input} placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                <input name="email" type="email" required value={form.email} onChange={change}
                       className={input} placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="phone" value={form.phone} onChange={change}
                       className={input} placeholder="09XX XXX XXXX" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Anything we should know? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="message" rows={3} value={form.message} onChange={change}
                          className={`${input} resize-y`} placeholder="Skills you can bring, times you're free…" />
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-sm bg-red-50 border border-red-100 text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button type="submit" disabled={status === 'sending'}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91' }}>
                {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'sending' ? 'Signing you up…' : 'Sign me up'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
