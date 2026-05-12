'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  activityTitle: string;
  activityType: string;
  onClose: () => void;
}

export default function ParticipationModal({ activityTitle, activityType, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/participation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: activityType }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit');
      }
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {step === 'form' ? (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Sign Up</h2>
              <p className="text-sm text-gray-400 mb-5">{activityTitle}</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input name="full_name" required placeholder="Full Name"
                  value={form.full_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <input name="email" type="email" required placeholder="Email Address"
                  value={form.email} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <input name="phone" type="tel" placeholder="Phone (optional)"
                  value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <textarea name="message" rows={3} placeholder="Tell us about yourself or any questions…"
                  value={form.message} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#00BFB3' }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-sm text-gray-500 mb-1">
                You&apos;ve signed up for <span className="font-semibold text-gray-700">{activityTitle}</span>.
              </p>
              <p className="text-sm text-gray-400 mb-6">Our team will reach out to confirm your participation.</p>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}>
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
