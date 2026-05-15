'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { logger } from '@/lib/logger';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition text-sm bg-white';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error'); setMessage('Please fill all fields'); return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setMessage("Message sent successfully! We'll get back to you soon.");
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else throw new Error('Failed to send');
    } catch (err) {
      setStatus('error'); setMessage('Failed to send message. Please try again.');
      logger.error('Contact form error:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Contact</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Get in Touch</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>Have questions? We&apos;d love to hear from you.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-bold mb-8" style={{ color: '#1A1A2E', fontFamily: HL }}>Contact Information</h2>
            <div className="space-y-5 mb-10">
              {[
                { Icon: Phone,  label: 'Phone',   value: '+63 (49) 501-1234' },
                { Icon: Mail,   label: 'Email',   value: 'info@liliwtourism.com' },
                { Icon: MapPin, label: 'Address', value: 'Liliw, Laguna 4002, Philippines' },
                { Icon: Clock,  label: 'Hours',   value: 'Mon–Sun: 9:00 AM – 6:00 PM' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="p-2.5 rounded-xl h-fit" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#0B3D91' }} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-0.5 text-sm" style={{ color: '#1A1A2E', fontFamily: HL }}>{label}</h3>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: BL }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)' }}>
              <p className="font-bold mb-2" style={{ fontFamily: HL }}>Visit Us</p>
              <p className="text-white/70 text-sm" style={{ fontFamily: BL }}>
                Liliw Municipal Hall, Liliw, Laguna. Our tourism desk is open every day to assist visitors and answer questions about the town.
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="bg-white rounded-2xl p-8 shadow-sm border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#1A1A2E', fontFamily: HL }}>Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Your name" className={inputCls}
                    style={{ '--tw-ring-color': '#0B3D91' } as any} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="your@email.com" className={inputCls}
                    style={{ '--tw-ring-color': '#0B3D91' } as any} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Subject *</label>
                  <select name="subject" value={formData.subject} onChange={handleChange}
                    className={inputCls} style={{ '--tw-ring-color': '#0B3D91' } as any}>
                    <option value="">Select a subject</option>
                    <option value="tourism">Tourism Inquiry</option>
                    <option value="events">Event Information</option>
                    <option value="cultural">Cultural Programs</option>
                    <option value="arts">Arts &amp; Crafts</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0B3D91', fontFamily: HL }}>Message *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange}
                    placeholder="Your message here..." rows={5}
                    className={`${inputCls} resize-none`}
                    style={{ '--tw-ring-color': '#0B3D91' } as any} />
                </div>
                {message && (
                  <div className={`p-3 rounded-xl text-sm font-semibold ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {status === 'success' && '✓ '}{message}
                  </div>
                )}
                <button type="submit" disabled={status === 'loading'}
                  className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                  {status === 'loading' ? '⏳ Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
