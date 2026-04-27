'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Phone, Mail, Plus, Trash2, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ItineraryItem {
  id: string;
  name: string;
  date: string;
  duration: string;
  notes: string;
}

interface ItineraryBuilderProps {
  attractionName: string;
  attractionId: string;
  price?: number;
  maxParticipants?: number;
}

export default function ItineraryBuilder({ attractionName, attractionId, price = 0, maxParticipants = 50 }: ItineraryBuilderProps) {
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([
    {
      id: attractionId,
      name: attractionName,
      date: '',
      duration: '2-3 hours',
      notes: '',
    },
  ]);

  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    participants: 1,
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({
      ...prev,
      [name]: name === 'participants' ? parseInt(value) : value,
    }));
  };

  const handleItemChange = (id: string, field: string, value: string) => {
    setItineraryItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addActivity = () => {
    const newId = `activity-${Date.now()}`;
    setItineraryItems(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        date: '',
        duration: '1-2 hours',
        notes: '',
      },
    ]);
  };

  const removeActivity = (id: string) => {
    if (itineraryItems.length > 1) {
      setItineraryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      setStatus('error');
      setMessage('Please fill all contact information fields');
      return;
    }

    if (itineraryItems.some(item => !item.name || !item.date)) {
      setStatus('error');
      setMessage('Please fill all activity names and dates');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guestInfo,
          itinerary: itineraryItems,
          totalActivities: itineraryItems.length,
          estimatedCost: price * guestInfo.participants * itineraryItems.length,
        }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('✓ Itinerary saved! Check your email for details.');
        setItineraryItems([{
          id: attractionId,
          name: attractionName,
          date: '',
          duration: '2-3 hours',
          notes: '',
        }]);
        setGuestInfo({ name: '', email: '', phone: '', participants: 1 });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setMessage('Failed to save itinerary. Try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const minDate = new Date().toISOString().split('T')[0];
  const estimatedCost = price * guestInfo.participants * itineraryItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 md:p-8 border-l-4"
      style={{ borderColor: '#00BFB3' }}
    >
      <h3 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C' }}>Build Your Itinerary</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-bold mb-4" style={{ color: '#0F1F3C' }}>Your Information</h4>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: '#0F1F3C' }}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={guestInfo.name}
              onChange={handleGuestChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            />
          </div>

          {/* Email & Phone */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
                <Mail size={16} style={{ color: '#00BFB3' }} /> Email *
              </label>
              <input
                type="email"
                name="email"
                value={guestInfo.email}
                onChange={handleGuestChange}
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
                value={guestInfo.phone}
                onChange={handleGuestChange}
                placeholder="+63 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#00BFB3' } as any}
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C' }}>
              <Users size={16} style={{ color: '#00BFB3' }} /> Number of Participants
            </label>
            <select
              name="participants"
              value={guestInfo.participants}
              onChange={handleGuestChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            >
              {[...Array(maxParticipants)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Itinerary Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold" style={{ color: '#0F1F3C' }}>Itinerary</h4>
            <button
              type="button"
              onClick={addActivity}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: '#00BFB3', color: 'white' }}
            >
              <Plus size={16} /> Add Activity
            </button>
          </div>

          <AnimatePresence>
            {itineraryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-4 rounded-lg mb-3 border-l-4"
                style={{ borderColor: '#00BFB3' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold" style={{ color: '#0F1F3C' }}>Day {index + 1}</h5>
                  {itineraryItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(item.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C' }}>Activity Name *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="e.g., Visit Tsinelas Heritage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': '#00BFB3' } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#0F1F3C' }}>
                      <Calendar size={14} /> Date *
                    </label>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                      min={minDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': '#00BFB3' } as any}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C' }}>Duration</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleItemChange(item.id, 'duration', e.target.value)}
                      placeholder="e.g., 2-3 hours"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': '#00BFB3' } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C' }}>Notes</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                      placeholder="Special requests..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': '#00BFB3' } as any}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Activities:</span>
            <span className="font-medium">× {itineraryItems.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Participants:</span>
            <span className="font-medium">× {guestInfo.participants}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold" style={{ color: '#0F1F3C' }}>
            <span>Estimated Total:</span>
            <span style={{ color: '#00BFB3' }}>₱{estimatedCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
          </div>
        )}

        {/* Submit & Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex-1 px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#00BFB3',
              color: 'white',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
          >
            {status === 'loading' ? '⏳ Saving...' : '✓ Save Itinerary'}
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-lg border-2 transition flex items-center justify-center gap-2"
            style={{ borderColor: '#00BFB3', color: '#00BFB3' }}
            title="Share itinerary"
          >
            <Share2 size={18} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
