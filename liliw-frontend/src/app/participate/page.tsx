'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, AlertCircle, Loader2, MessageSquare, Users, Briefcase } from 'lucide-react';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  feedback: {
    label: 'Share Your Feedback',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Help us improve tourism experiences in Liliw.',
  },
  volunteer: {
    label: 'Volunteer with Us',
    icon: <Users className="w-5 h-5" />,
    description: 'Join our community in welcoming visitors.',
  },
  partnership: {
    label: 'Business Partnership',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Connect your business with tourism in Liliw.',
  },
};

const TYPE_OPTIONS = [
  { value: 'feedback',    label: 'Feedback / Suggestion' },
  { value: 'volunteer',   label: 'Volunteer' },
  { value: 'partnership', label: 'Business Partnership' },
  { value: 'cultural_mapping', label: 'Cultural Mapping' },
  { value: 'artisan_listing',  label: 'Artisan Listing' },
];

function ParticipateForm() {
  const params = useSearchParams();
  const initialType = params.get('type') || 'feedback';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', type: initialType, message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const meta = TYPE_META[form.type] ?? TYPE_META.feedback;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/participation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit');
      }
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-16"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
          <CheckCircle className="w-10 h-10" style={{ color: '#00BFB3' }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Thank you for reaching out. Our team will review your request and get back to you soon.
        </p>
        <Link
          href="/community"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}
        >
          Back to Community
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto"
    >
      {/* Type header */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border"
        style={{ backgroundColor: 'rgba(0,191,179,.06)', borderColor: 'rgba(0,191,179,.3)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(0,191,179,.15)', color: '#00BFB3' }}>
          {meta.icon}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{meta.label}</p>
          <p className="text-xs text-gray-500">{meta.description}</p>
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              name="full_name" required
              value={form.full_name} onChange={handleChange}
              placeholder="Juan dela Cruz"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address <span className="text-red-400">*</span></label>
            <input
              name="email" type="email" required
              value={form.email} onChange={handleChange}
              placeholder="juan@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (optional)</label>
            <input
              name="phone" type="tel"
              value={form.phone} onChange={handleChange}
              placeholder="+63 9XX XXX XXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Request Type</label>
            <select
              name="type"
              value={form.type} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
          <textarea
            name="message" rows={4}
            value={form.message} onChange={handleChange}
            placeholder="Tell us more about your interest or question…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}
        >
          {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'submitting' ? 'Sending…' : 'Submit Request'}
        </button>
      </form>
    </motion.div>
  );
}

export default function ParticipatePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Link href="/community" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
            Back to Community
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#00BFB3' }}>Get Involved</h1>
          <p className="text-gray-500 mb-10">Fill out the form below and our team will get back to you shortly.</p>
        </motion.div>

        <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
          <ParticipateForm />
        </Suspense>
      </div>
    </div>
  );
}
