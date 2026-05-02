'use client';

import { useState } from 'react';
import { Calendar, Users, Phone, Mail, User, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingProps {
  tourName: string;
  tourId: string;
  price?: number;
  maxParticipants?: number;
}

const inputClass = `
  w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900
  placeholder:text-gray-400 font-medium text-sm
  focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100
  transition-all duration-200
`.trim();

const labelClass = 'flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5';

export default function BookingForm({ tourName, tourId, price = 0, maxParticipants = 50 }: BookingProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    participants: 1,
    notes: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'participants' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
      setStatus('error');
      setMessage('Please fill in all required fields.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tourName,
          tourId,
          totalCost: price * formData.participants,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Booking confirmed!');
        setBookingRef(data.bookingRef || '');
        setFormData({ name: '', email: '', phone: '', date: '', participants: 1, notes: '' });
      } else {
        setStatus('error');
        setMessage(data.error || 'Booking failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Connection error. Please try again.');
    }
  };

  const total = price * formData.participants;
  const minDate = new Date().toISOString().split('T')[0];

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #86efac' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#22c55e' }}
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {bookingRef && (
          <div className="inline-block px-4 py-2 rounded-xl bg-white border border-green-200 text-sm font-mono font-bold text-green-700 mb-6">
            Ref: {bookingRef}
          </div>
        )}
        <div className="text-sm text-gray-500 mb-6">
          <p>Tour: <span className="font-semibold text-gray-700">{tourName}</span></p>
        </div>
        <button
          onClick={() => setStatus('idle')}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#00BFB3' }}
        >
          Book Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '2px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0F1F3C 0%, #1a2f4e 100%)' }}>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#00BFB3' }} />
          Book This Tour
        </h3>
        <p className="text-gray-400 text-sm mt-1">{tourName}</p>
      </div>

      <div className="p-6 bg-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>
              <User className="w-4 h-4" style={{ color: '#00BFB3' }} />
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={inputClass}
            />
          </div>

          {/* Email & Phone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Mail className="w-4 h-4" style={{ color: '#00BFB3' }} />
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Phone className="w-4 h-4" style={{ color: '#00BFB3' }} />
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 9XX XXX XXXX"
                className={inputClass}
              />
            </div>
          </div>

          {/* Date & Participants */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Calendar className="w-4 h-4" style={{ color: '#00BFB3' }} />
                Preferred Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={minDate}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Users className="w-4 h-4" style={{ color: '#00BFB3' }} />
                Participants
              </label>
              <input
                type="number"
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                min={1}
                max={maxParticipants || undefined}
                placeholder="Enter number of participants"
                className={inputClass}
              />
              {maxParticipants > 0 && (
                <p className="mt-1 text-xs text-gray-400">Max {maxParticipants} participants</p>
              )}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className={labelClass}>
              <FileText className="w-4 h-4" style={{ color: '#00BFB3' }} />
              Special Requests
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any dietary restrictions, accessibility needs, or special requests?"
              rows={3}
              className={inputClass}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Price Summary */}
          {price > 0 && (
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Price per person</span>
                <span className="font-semibold text-gray-800">₱{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Participants</span>
                <span className="font-semibold text-gray-800">× {formData.participants}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                <span className="text-gray-800">Total</span>
                <span style={{ color: '#00BFB3' }}>₱{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={status === 'loading'}
            whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)', boxShadow: '0 4px 16px rgba(0,191,179,0.35)' }}
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              price > 0 ? `Book Now — ₱${total.toLocaleString()}` : 'Book Now'
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
