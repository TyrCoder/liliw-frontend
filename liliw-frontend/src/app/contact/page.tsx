'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Mail, Phone, MapPin, Clock, Send, Globe, Heart, Share2 } from 'lucide-react';
import { logger } from '@/lib/logger';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setMessage('Please fill all fields');
      return;
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
        setMessage('✓ Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to send message. Please try again.');
      logger.error('Contact form error:', err);
    }
  };

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '+63 (49) 501-1234' },
    { icon: Mail, label: 'Email', value: 'info@liliwtourism.com' },
    { icon: MapPin, label: 'Address', value: 'Liliw, Laguna 4002, Philippines' },
    { icon: Clock, label: 'Hours', value: 'Mon-Sun: 9:00 AM - 6:00 PM' },
  ];

  const socialLinks = [
    { icon: Globe, label: 'Website', url: 'https://liliwtourism.com' },
    { icon: Heart, label: 'Community', url: 'https://facebook.com/liliwtourism' },
    { icon: Share2, label: 'Share', url: 'https://twitter.com/liliwtourism' },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Header */}
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center font-semibold mb-6 group"
              style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#00BFB3' }}>
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#0F1F3C' }}>
              Contact Information
            </h2>

            <div className="space-y-6 mb-12">
              {contactInfo.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex gap-4"
                >
                  <div className="p-3 rounded-lg h-fit" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
                    <item.icon className="w-6 h-6" style={{ color: '#00BFB3' }} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: '#0F1F3C' }}>
                      {item.label}
                    </h3>
                    <p className="text-gray-600">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: '#0F1F3C' }}>
                Follow Us
              </h3>
              <div className="flex gap-4">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg transition hover:shadow-md"
                    style={{
                      backgroundColor: 'rgba(0, 191, 179, 0.1)',
                      color: '#00BFB3',
                    }}
                    title={link.label}
                  >
                    <link.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F1F3C' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': '#00BFB3' } as any}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F1F3C' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': '#00BFB3' } as any}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F1F3C' }}>
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': '#00BFB3' } as any}
                >
                  <option value="">Select a subject</option>
                  <option value="tourism">Tourism Inquiry</option>
                  <option value="events">Event Information</option>
                  <option value="cultural">Cultural Programs</option>
                  <option value="arts">Arts & Crafts</option>
                  <option value="booking">Itinerary Booking</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0F1F3C' }}>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message here..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': '#00BFB3' } as any}
                />
              </div>

              {/* Status Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm font-semibold ${
                    status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-bold text-white transition hover:shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading' ? '⏳ Sending...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
