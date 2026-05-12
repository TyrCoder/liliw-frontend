'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, BookmarkCheck, Heart, Trash2, ChevronDown,
  MapPin, Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

interface Stop { time: string; place: string; activity: string; duration: string; tip: string; }
interface Day  { day: number; theme: string; stops: Stop[]; }
interface GeneratedPlan { title: string; summary: string; days: Day[]; tips: string[]; estimatedCostPerDay: string; }
interface SavedTrip { id: string; savedAt: string; title: string; plan: GeneratedPlan; duration: string; budget: string; }

export default function ProfilePage() {
  const router  = useRouter();
  const { user, token, loading } = useAuth();
  const { favorites } = useFavorites();

  const [trips, setTrips]           = useState<SavedTrip[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'trips' | 'favorites'>('trips');

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  const loadTrips = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/itineraries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrips((data.trips || []).map((row: any) => ({
          id: row.id,
          savedAt: row.saved_at,
          title: row.title,
          plan: row.plan,
          duration: row.duration,
          budget: row.budget,
        })));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    loadTrips();
    window.addEventListener('liliw-trips-updated', loadTrips);
    return () => window.removeEventListener('liliw-trips-updated', loadTrips);
  }, [loadTrips]);

  // Scroll to #saved on load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#saved') {
      setActiveTab('trips');
      setTimeout(() => document.getElementById('saved')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, []);

  const deleteTrip = async (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    try {
      await fetch(`/api/itineraries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  if (loading || !user) return null;

  const initials = user.username.charAt(0).toUpperCase();
  const joinedLabel = 'Liliw Community Member';

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="pb-16 pt-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
          </Link>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: '#00BFB3' }}>
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#00BFB3' }}>{joinedLabel}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{trips.length}</p>
              <p className="text-xs text-gray-400">Saved Trips</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">{favorites.length}</p>
              <p className="text-xs text-gray-400">Favorites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 -mt-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'trips',     label: 'Saved Itineraries', icon: BookmarkCheck, count: trips.length },
              { key: 'favorites', label: 'Favorites',         icon: Heart,         count: favorites.length },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button key={key} id={key === 'trips' ? 'saved' : undefined}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition ${
                  activeTab === key ? 'border-b-2 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                style={activeTab === key ? { borderColor: '#00BFB3' } : {}}>
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: '#00BFB3' }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Saved Itineraries Tab */}
        {activeTab === 'trips' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-16">
            {trips.length === 0 ? (
              <div className="text-center py-16">
                <BookmarkCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-500">No saved itineraries yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-5">Generate a trip with the AI builder and save it here.</p>
                <Link href="/itineraries"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}>
                  Plan a Trip
                </Link>
              </div>
            ) : trips.map(trip => (
              <div key={trip.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(prev => prev === trip.id ? null : trip.id)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#e0fdf4' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#00BFB3' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{trip.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {trip.duration} · {trip.budget} · {new Date(trip.savedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteTrip(trip.id); }}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedId === trip.id ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {expandedId === trip.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100">
                      <div className="px-5 py-4">
                        {trip.plan.summary && (
                          <p className="text-sm text-gray-500 mb-4">{trip.plan.summary}</p>
                        )}
                        <div className="space-y-5">
                          {trip.plan.days?.map(day => (
                            <div key={day.day}>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Day {day.day} — {day.theme}
                              </p>
                              <div className="space-y-2">
                                {day.stops?.map((stop, i) => (
                                  <div key={i} className="flex gap-3 text-sm">
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0 h-fit">{stop.time}</span>
                                    <div>
                                      <p className="font-semibold text-gray-800">{stop.place}</p>
                                      <p className="text-gray-500 text-xs">{stop.activity}</p>
                                      {stop.tip && <p className="text-xs text-amber-600 mt-0.5">💡 {stop.tip}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {trip.plan.estimatedCostPerDay && (
                          <p className="mt-4 text-xs font-semibold text-gray-500">
                            Est. cost/day: <span className="text-gray-800">{trip.plan.estimatedCostPerDay}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-16">
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-500">No favorites yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-5">Tap the heart icon on any attraction to save it here.</p>
                <Link href="/attractions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}>
                  Browse Attractions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(fav => (
                  <Link key={fav.id} href={`/attractions/${fav.id}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3.5 hover:shadow-md transition">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#fff1f2' }}>
                      <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{fav.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{fav.type}{fav.category ? ` · ${fav.category}` : ''}</p>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-auto" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
