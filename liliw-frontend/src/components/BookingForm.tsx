'use client';

import { useState } from 'react';
import { Calendar, Users, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookingProps {
  tourName: string;
  tourId: string;
  price?: number;
  maxParticipants?: number;
}

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
      setMessage('Please fill all required fields');
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

      if (res.ok) {
        setStatus('success');
        setMessage('✓ Booking confirmed! Check your email for details.');
        setFormData({ name: '', email: '', phone: '', date: '', participants: 1, notes: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setMessage('Booking failed. Try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const total = price * formData.participants;
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 md:p-8 border-l-4"
      style={{ borderColor: '#00BFB3' }}
    >
      <h3 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C' }}>Book This Tour</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0F1F3C' }}>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#00BFB3' } as any}
          />
        </div>

        {/* Email & Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
              <Mail size={16} style={{ color: '#00BFB3' }} /> Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
              <Phone size={16} style={{ color: '#00BFB3' }} /> Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            />
          </div>
        </div>

        {/* Date & Participants */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
              <Calendar size={16} style={{ color: '#00BFB3' }} /> Preferred Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={minDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
              <Users size={16} style={{ color: '#00BFB3' }} /> Participants
            </label>
            <select
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            >
              {[...Array(maxParticipants)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0F1F3C' }}>Special Requests</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any special needs or requests?"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#00BFB3' } as any}
          />
        </div>

        {/* Price Summary */}
        <div className="bg-white p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Price per person:</span>
            <span className="font-medium">₱{price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Participants:</span>
            <span className="font-medium">× {formData.participants}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold" style={{ color: '#0F1F3C' }}>
            <span>Total:</span>
            <span style={{ color: '#00BFB3' }}>₱{total}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-50"
          style={{ backgroundColor: '#00BFB3' }}
        >
          {status === 'loading' ? 'Processing...' : `Book Now • ₱${total}`}
        </button>
      </form>

      {/* Status Messages */}
      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-2 p-4 bg-green-100 text-green-700 rounded-lg"
        >
          <CheckCircle size={20} />
          <span>{message}</span>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-2 p-4 bg-red-100 text-red-700 rounded-lg"
        >
          <AlertCircle size={20} />
          <span>{message}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
