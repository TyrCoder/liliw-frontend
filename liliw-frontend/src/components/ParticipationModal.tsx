'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, CheckCircle, AlertCircle, Loader2, Users, Briefcase, MessageSquare, ArrowRight, Phone, Mail, User, FileText } from 'lucide-react';
import { stripHtml } from '@/lib/text';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const ICON_MAP: Record<string, React.ReactNode> = {
  volunteer:   <Users className="w-5 h-5" />,
  partnership: <Briefcase className="w-5 h-5" />,
  feedback:    <MessageSquare className="w-5 h-5" />,
};

interface ActivityData {
  title: string;
  type: string;
  description?: string;
  items?: string[];
}

interface Props {
  activity: ActivityData;
  initialStep?: 'detail' | 'form';
  onClose: () => void;
}

const inputBase = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-gray-300';

export default function ParticipationModal({ activity, initialStep = 'detail', onClose }: Props) {
  const [step, setStep]       = useState<'detail' | 'form' | 'success'>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', message: '' });

  const icon = ICON_MAP[activity.type] ?? <Users className="w-5 h-5" />;

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
        body: JSON.stringify({ ...form, type: activity.type }),
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(10,20,50,0.6)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          style={{ maxHeight: '90vh' }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-black/10"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>
            <X className="w-4 h-4 text-gray-700" />
          </button>

          <div className="overflow-y-auto" style={{ maxHeight: '90vh' }}>

            {/* ── Detail View ─────────────────────────────── */}
            {step === 'detail' && (
              <motion.div key="detail" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                {/* Header */}
                <div className="px-7 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(245,197,24,0.2)', color: '#F5C518' }}>
                    {icon}
                  </div>
                  <h2 className="text-xl font-extrabold text-white leading-snug mb-1" style={{ fontFamily: HL }}>
                    {activity.title}
                  </h2>
                  {activity.description && (
                    <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: BL }}>
                      {stripHtml(activity.description)}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div className="px-7 py-6">
                  {activity.items && activity.items.length > 0 && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#0B3D91', fontFamily: HL }}>
                        What&apos;s Included
                      </p>
                      <ul className="space-y-3 mb-6">
                        {activity.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600" style={{ fontFamily: BL }}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: '#F5C518', color: '#0B3D91' }}>✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="flex-1 px-4 py-3 rounded-xl border text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                      style={{ borderColor: '#E5E7EB', fontFamily: BL }}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => setStep('form')}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
                      Sign Up <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Form View ───────────────────────────────── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                {/* Header */}
                <div className="px-7 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
                  {initialStep !== 'form' && (
                    <button onClick={() => setStep('detail')}
                      className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold mb-4 transition"
                      style={{ fontFamily: BL }}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(245,197,24,0.2)', color: '#F5C518' }}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest font-semibold" style={{ fontFamily: HL }}>Sign Up For</p>
                      <h2 className="text-base font-extrabold text-white leading-tight" style={{ fontFamily: HL }}>{activity.title}</h2>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="px-7 py-6">
                  {error && (
                    <div className="mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm"
                      style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: '#0B3D91', fontFamily: HL }}>
                          <User className="w-3 h-3" /> Full Name <span className="text-red-400">*</span>
                        </label>
                        <input name="full_name" required value={form.full_name} onChange={handleChange}
                          placeholder="Juan dela Cruz" className={inputBase} />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: '#0B3D91', fontFamily: HL }}>
                          <Mail className="w-3 h-3" /> Email <span className="text-red-400">*</span>
                        </label>
                        <input name="email" type="email" required value={form.email} onChange={handleChange}
                          placeholder="juan@example.com" className={inputBase} />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: '#0B3D91', fontFamily: HL }}>
                        <Phone className="w-3 h-3" /> Phone <span className="text-gray-300 font-normal">(optional)</span>
                      </label>
                      <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                        placeholder="+63 9XX XXX XXXX" className={inputBase} />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: '#0B3D91', fontFamily: HL }}>
                        <FileText className="w-3 h-3" /> Message <span className="text-gray-300 font-normal">(optional)</span>
                      </label>
                      <textarea name="message" rows={3} value={form.message} onChange={handleChange}
                        placeholder="Tell us about yourself or any questions…"
                        className={`${inputBase} resize-none`} />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                        style={{ borderColor: '#E5E7EB', fontFamily: BL }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submitting ? 'Sending…' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Success View ────────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                className="px-8 py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#EFF6FF' }}>
                  <CheckCircle className="w-10 h-10" style={{ color: '#0B3D91' }} />
                </div>
                <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>You&apos;re Signed Up!</h2>
                <p className="text-sm text-gray-500 mb-1 max-w-xs leading-relaxed" style={{ fontFamily: BL }}>
                  You&apos;ve signed up for <span className="font-semibold text-gray-800">{activity.title}</span>.
                </p>
                <p className="text-sm text-gray-400 mb-8" style={{ fontFamily: BL }}>Our team will reach out to confirm your participation.</p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                  Done
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
