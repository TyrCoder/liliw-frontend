'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email');
      return;
    }

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage('Subscription failed. Try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-8 text-white"
    >
      <div className="max-w-md mx-auto">
        <h3 className="text-2xl font-bold mb-2">Get Travel Tips</h3>
        <p className="text-teal-100 mb-6">Subscribe for exclusive Liliw updates and travel guides</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-white opacity-70" size={20} />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-white text-teal-600 font-semibold py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-300 mt-4"
          >
            <CheckCircle size={20} />
            <span className="text-sm">{message}</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-red-300 mt-4"
          >
            <AlertCircle size={20} />
            <span className="text-sm">{message}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
