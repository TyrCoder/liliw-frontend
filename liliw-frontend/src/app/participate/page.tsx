'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, AlertCircle, Loader2, MessageSquare, Users, Briefcase } from 'lucide-react';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} style={{ transform: flip ? 'scaleX(-1)' : undefined, display:'inline-block', verticalAlign:'middle' }}>
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

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  feedback:    { label: 'Share Your Feedback',  icon: <MessageSquare className="w-5 h-5" />, description: 'Help us improve tourism experiences in Liliw.' },
  volunteer:   { label: 'Volunteer with Us',    icon: <Users className="w-5 h-5" />,         description: 'Join our community in welcoming visitors.' },
  partnership: { label: 'Business Partnership', icon: <Briefcase className="w-5 h-5" />,     description: 'Connect your business with tourism in Liliw.' },
};

const TYPE_OPTIONS = [
  { value: 'feedback',         label: 'Feedback / Suggestion' },
  { value: 'volunteer',        label: 'Volunteer' },
  { value: 'partnership',      label: 'Business Partnership' },
  { value: 'cultural_mapping', label: 'Cultural Mapping' },
  { value: 'artisan_listing',  label: 'Artisan Listing' },
];

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-white';

function ParticipateForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', type: params.get('type') || 'feedback', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const meta = TYPE_META[form.type] ?? TYPE_META.feedback;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting'); setErrorMsg('');
    try {
      const res = await fetch('/api/participation-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to submit'); }
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.'); setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
          <CheckCircle className="w-10 h-10" style={{ color: '#0B3D91' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Request Submitted!</h2>
        <p className="text-gray-500 mb-6 max-w-sm text-sm" style={{ fontFamily: BL }}>
          Thank you for reaching out. Our team will review your request and get back to you soon.
        </p>
        <Link href="/community"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
          Back to Community
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border"
        style={{ backgroundColor: 'rgba(11,61,145,0.05)', borderColor: 'rgba(11,61,145,0.2)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(11,61,145,0.1)', color: '#0B3D91' }}>
          {meta.icon}
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: '#1A1A2E', fontFamily: HL }}>{meta.label}</p>
          <p className="text-xs text-gray-500" style={{ fontFamily: BL }}>{meta.description}</p>
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Full Name <span className="text-red-400">*</span></label>
            <input name="full_name" required value={form.full_name} onChange={handleChange} placeholder="Juan dela Cruz"
              className={inputCls} style={{ '--tw-ring-color': '#0B3D91' } as any} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Email Address <span className="text-red-400">*</span></label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="juan@example.com"
              className={inputCls} style={{ '--tw-ring-color': '#0B3D91' } as any} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Phone (optional)</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+63 9XX XXX XXXX"
              className={inputCls} style={{ '--tw-ring-color': '#0B3D91' } as any} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Request Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className={`${inputCls} bg-white`} style={{ '--tw-ring-color': '#0B3D91' } as any}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Message</label>
          <textarea name="message" rows={4} value={form.message} onChange={handleChange}
            placeholder="Tell us more about your interest or question…"
            className={`${inputCls} resize-none`} style={{ '--tw-ring-color': '#0B3D91' } as any} />
        </div>
        <button type="submit" disabled={status === 'submitting'}
          className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
          {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'submitting' ? 'Sending…' : 'Submit Request'}
        </button>
      </form>
    </motion.div>
  );
}

export default function ParticipatePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-4xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/community" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Community
            </Link>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>Get Involved</h1>
              <Bunting flip />
            </div>
            <p className="text-white/70" style={{ fontFamily: BL }}>Fill out the form below and our team will get back to you shortly.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
          <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
            <ParticipateForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
