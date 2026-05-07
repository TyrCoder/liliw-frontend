'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Users, X, MapPin, Star,
  CheckCircle, XCircle, Navigation, ArrowRight, Calendar,
  Lightbulb, Sparkles, RotateCcw, Wallet, Heart, Sun, BookmarkCheck,
  Trash2, ChevronDown, LogIn, Pencil, Plus, ExternalLink, Check,
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { getItineraries, getAllAttractions } from '@/lib/strapi';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';

/* ─────────────────────── shared helpers ──────────────────── */

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

function getPhotoUrl(p: any): string | null {
  if (!p) return null;
  const raw = p.url || p.data?.attributes?.url || p.attributes?.url || null;
  if (!raw) return null;
  if (raw.startsWith('/')) return `${STRAPI_BASE}${raw}`;
  return raw;
}

function blocksToText(blocks: any): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .flatMap((b: any) => Array.isArray(b.children) ? b.children.map((c: any) => c.text || '') : [])
    .join(' ').trim();
}

/* ══════════════════════════════════════════════════════════
   PART 1 — AI ITINERARY BUILDER WIZARD
   ══════════════════════════════════════════════════════════ */

const DURATIONS = [
  { value: 'half-day', label: 'Half Day', sub: '4 hours', icon: '🌅' },
  { value: 'full-day', label: 'Full Day', sub: '8 hours', icon: '☀️' },
  { value: '2 days',   label: '2 Days',   sub: 'Weekend', icon: '🗓️' },
  { value: '3 days',   label: '3 Days',   sub: 'Extended', icon: '✈️' },
  { value: 'custom',   label: 'Custom',   sub: 'Set your own', icon: '✏️' },
];

const BUDGETS = [
  { value: 'budget-friendly (under ₱1,000/day)', label: 'Budget',   sub: 'Under ₱1,000/day', icon: '💸' },
  { value: 'mid-range (₱1,000–₱3,000/day)',      label: 'Mid-range', sub: '₱1,000 – ₱3,000/day', icon: '💳' },
  { value: 'premium (₱3,000+/day)',               label: 'Premium',  sub: '₱3,000+/day', icon: '✨' },
  { value: 'custom',                              label: 'Custom',   sub: 'Set your own', icon: '✏️' },
];

const INTERESTS = [
  { value: 'Heritage & History',   icon: '🏛️' },
  { value: 'Local Food & Cuisine', icon: '🍜' },
  { value: 'Arts & Crafts',        icon: '👟' },
  { value: 'Nature & Outdoors',    icon: '🌿' },
  { value: 'Family Activities',    icon: '👨‍👩‍👧' },
  { value: 'Photography',          icon: '📸' },
  { value: 'Shopping',             icon: '🛍️' },
  { value: 'Culture & Festivals',  icon: '🎉' },
];

interface Stop { time: string; place: string; activity: string; duration: string; tip: string; }
interface Day  { day: number; theme: string; stops: Stop[]; }
interface GeneratedPlan { title: string; summary: string; days: Day[]; tips: string[]; estimatedCostPerDay: string; }
interface SavedTrip { id: string; savedAt: string; title: string; plan: GeneratedPlan; duration: string; budget: string; }

const SAVED_TRIPS_KEY = 'liliw-saved-trips';
function loadSavedTrips(): SavedTrip[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]'); } catch { return []; }
}
function persistSavedTrips(trips: SavedTrip[]) {
  try { localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(trips)); } catch {}
}

function WizardCard({ value, label, sub, icon, selected, onClick }: {
  value: string; label: string; sub: string; icon: string; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
        selected ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-bold text-sm ${selected ? 'text-teal-700' : 'text-gray-900'}`}>{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      {selected && (
        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#00BFB3' }}>
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </motion.button>
  );
}

function InterestChip({ value, icon, selected, onClick }: { value: string; icon: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
        selected ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}>
      <span>{icon}</span>{value}
    </motion.button>
  );
}

function AttractionQuickModal({ placeName, onClose }: { placeName: string; onClose: () => void }) {
  const [attraction, setAttraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAttractions().then((all: any[]) => {
      const needle = placeName.toLowerCase();
      const found = all.find((a: any) => {
        const name = (a.attributes?.name || '').toLowerCase();
        return name === needle || name.includes(needle) || needle.includes(name);
      });
      setAttraction(found || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [placeName]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const attr = attraction?.attributes;
  const rawUrl = attr?.photos?.[0]?.url || null;
  const photoUrl = rawUrl ? (rawUrl.startsWith('/') ? `${STRAPI_BASE}${rawUrl}` : rawUrl) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 80, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow transition">
          <X className="w-4 h-4 text-gray-700" />
        </button>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
          </div>
        ) : !attraction ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#00BFB3' }} />
            <h3 className="font-bold text-gray-700 mb-1">{placeName}</h3>
            <p className="text-sm text-gray-400">No details found for this place.</p>
          </div>
        ) : (
          <>
            {photoUrl && (
              <div className="relative shrink-0 h-44">
                <img src={photoUrl} alt={attr.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-12">
                  <h2 className="text-xl font-bold text-white">{attr.name}</h2>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!photoUrl && <h2 className="text-xl font-bold text-gray-900">{attr.name}</h2>}
              <div className="flex flex-wrap gap-2">
                {!!attr.rating && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{attr.rating}/5
                  </span>
                )}
                {attr.location && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />{attr.location}
                  </span>
                )}
              </div>
              {attr.description && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{attr.description}</p>
              )}
              <Link href={`/attractions/${attraction.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition"
                style={{ backgroundColor: '#00BFB3' }}>
                View Full Page <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function PlanResult({ plan, onReset, onSave, saved, isLoggedIn }: { plan: GeneratedPlan; onReset: () => void; onSave: (editedPlan: GeneratedPlan) => void; saved: boolean; isLoggedIn: boolean }) {
  const [localPlan, setLocalPlan] = useState<GeneratedPlan>(() => JSON.parse(JSON.stringify(plan)));
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  const updateStop = (dayIdx: number, stopIdx: number, field: keyof Stop, value: string) => {
    setLocalPlan(prev => {
      const next: GeneratedPlan = JSON.parse(JSON.stringify(prev));
      next.days[dayIdx].stops[stopIdx][field] = value;
      return next;
    });
  };

  const deleteStop = (dayIdx: number, stopIdx: number) => {
    setLocalPlan(prev => {
      const next: GeneratedPlan = JSON.parse(JSON.stringify(prev));
      next.days[dayIdx].stops = next.days[dayIdx].stops.filter((_: Stop, i: number) => i !== stopIdx);
      return next;
    });
  };

  const addStop = (dayIdx: number) => {
    setLocalPlan(prev => {
      const next: GeneratedPlan = JSON.parse(JSON.stringify(prev));
      next.days[dayIdx].stops.push({ time: '', place: '', activity: '', duration: '', tip: '' });
      return next;
    });
  };

  const updateDayTheme = (dayIdx: number, value: string) => {
    setLocalPlan(prev => {
      const next: GeneratedPlan = JSON.parse(JSON.stringify(prev));
      next.days[dayIdx].theme = value;
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#00BFB3,#0077A8)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-1">Your AI Itinerary</p>
            <h2 className="text-2xl font-bold leading-tight mb-2">{localPlan.title}</h2>
            <p className="text-teal-50 text-sm leading-relaxed">{localPlan.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Sparkles className="w-8 h-8 text-teal-200" />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition ${
                isEditing ? 'bg-white text-teal-600' : 'bg-white/20 text-white hover:bg-white/30'
              }`}>
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              {isEditing ? 'Done' : 'Edit'}
            </motion.button>
          </div>
        </div>
        {localPlan.estimatedCostPerDay && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-semibold">{localPlan.estimatedCostPerDay} per day</span>
          </div>
        )}
      </div>

      {/* Days */}
      {localPlan.days?.map((day, dayIdx) => (
        <motion.div key={dayIdx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIdx * 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: '#00BFB3' }}>{day.day}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Day {day.day}</p>
              {isEditing ? (
                <input
                  value={day.theme}
                  onChange={e => updateDayTheme(dayIdx, e.target.value)}
                  className="text-sm font-bold text-gray-900 w-full border-b border-teal-300 focus:outline-none bg-transparent"
                  placeholder="Day theme..."
                />
              ) : (
                <p className="text-sm font-bold text-gray-900">{day.theme}</p>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {day.stops?.map((stop, stopIdx) => (
              <div key={stopIdx} className="px-5 py-4 flex gap-4">
                <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00BFB3' }} />
                  {stopIdx < (day.stops.length - 1) && <div className="w-px flex-1 min-h-6" style={{ backgroundColor: '#e0f7f6' }} />}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={stop.time} onChange={e => updateStop(dayIdx, stopIdx, 'time', e.target.value)}
                          className="w-24 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 focus:outline-none focus:border-teal-400"
                          placeholder="Time" />
                        <input value={stop.duration} onChange={e => updateStop(dayIdx, stopIdx, 'duration', e.target.value)}
                          className="flex-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200 focus:outline-none"
                          placeholder="Duration (e.g. 1 hr)" />
                      </div>
                      <input value={stop.place} onChange={e => updateStop(dayIdx, stopIdx, 'place', e.target.value)}
                        className="w-full font-bold text-gray-900 text-sm border-b border-teal-200 focus:outline-none focus:border-teal-400 bg-transparent pb-0.5"
                        placeholder="Place name" />
                      <input value={stop.activity} onChange={e => updateStop(dayIdx, stopIdx, 'activity', e.target.value)}
                        className="w-full text-sm text-gray-600 border-b border-gray-200 focus:outline-none bg-transparent pb-0.5"
                        placeholder="Activity description" />
                      <input value={stop.tip} onChange={e => updateStop(dayIdx, stopIdx, 'tip', e.target.value)}
                        className="w-full text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 focus:outline-none"
                        placeholder="Travel tip (optional)" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{stop.time}</span>
                        {stop.duration && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{stop.duration}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm mb-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                        <button
                          onClick={() => setSelectedPlace(stop.place)}
                          className="text-left hover:underline decoration-teal-400 underline-offset-2">
                          {stop.place}
                        </button>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">{stop.activity}</p>
                      {stop.tip && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">{stop.tip}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {isEditing && (
                  <button onClick={() => deleteStop(dayIdx, stopIdx)}
                    className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition self-start mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="px-5 py-3 border-t border-dashed border-gray-200">
              <button onClick={() => addStop(dayIdx)}
                className="flex items-center gap-2 text-sm font-semibold transition hover:opacity-70"
                style={{ color: '#00BFB3' }}>
                <Plus className="w-4 h-4" /> Add Stop
              </button>
            </div>
          )}
        </motion.div>
      ))}

      {localPlan.tips?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">Travel Tips</p>
          <ul className="space-y-2">
            {localPlan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                <Sun className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />{tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSave(localPlan)}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition ${
            saved
              ? 'bg-teal-50 border-2 border-teal-400 text-teal-700'
              : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-100'
          }`}>
          {isLoggedIn ? <BookmarkCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {saved ? 'Saved to My Trips ✓' : isLoggedIn ? 'Save This Itinerary' : 'Log In to Save'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onReset}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition">
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>

      <AnimatePresence>
        {selectedPlace && (
          <AttractionQuickModal placeName={selectedPlace} onClose={() => setSelectedPlace(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type WizardStep = 'duration' | 'budget' | 'interests' | 'favorites' | 'generating' | 'result';

function ItineraryWizard() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep]             = useState<WizardStep>('duration');
  const [duration, setDuration]     = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [budget, setBudget]         = useState('');
  const [customBudget, setCustomBudget]   = useState('');
  const [interests, setInterests]   = useState<string[]>([]);
  const [selectedFavs, setSelectedFavs] = useState<string[]>([]);
  const [plan, setPlan]             = useState<GeneratedPlan | null>(null);
  const [error, setError]           = useState('');
  const [tripSaved, setTripSaved]   = useState(false);

  const hasFavorites = !!user && favorites.length > 0;

  const toggleInterest = (val: string) =>
    setInterests(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  const toggleFav = (name: string) =>
    setSelectedFavs(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const effectiveDuration = duration === 'custom' ? customDuration.trim() : duration;
  const effectiveBudget   = budget   === 'custom' ? customBudget.trim()   : budget;

  // After interests step: go to favorites if user has any, else generate
  const afterInterests = () => hasFavorites ? setStep('favorites') : generate();

  const generate = async () => {
    setStep('generating');
    setError('');
    setTripSaved(false);
    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: effectiveDuration,
          budget: effectiveBudget,
          interests,
          favoriteAttractions: selectedFavs,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.itinerary) throw new Error(data.error || 'Failed');
      setPlan(data.itinerary);
      setStep('result');
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('interests');
    }
  };

  const saveTrip = (editedPlan: GeneratedPlan) => {
    if (!plan) return;
    if (!user) { setShowLoginModal(true); return; }
    const trips = loadSavedTrips();
    const newTrip: SavedTrip = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      title: editedPlan.title,
      plan: editedPlan,
      duration: effectiveDuration,
      budget: effectiveBudget,
    };
    persistSavedTrips([newTrip, ...trips]);
    setTripSaved(true);
    window.dispatchEvent(new Event('liliw-trips-updated'));
  };

  const reset = () => {
    setStep('duration'); setDuration(''); setCustomDuration('');
    setBudget(''); setCustomBudget(''); setInterests([]);
    setSelectedFavs([]); setPlan(null); setError(''); setTripSaved(false);
  };

  const totalSteps = hasFavorites ? 4 : 3;
  const stepNumber = step === 'duration' ? 1 : step === 'budget' ? 2 : step === 'interests' ? 3 : step === 'favorites' ? 4 : null;
  const stepLabel  = (n: number) => n === 1 ? 'Duration' : n === 2 ? 'Budget' : n === 3 ? 'Interests' : 'Favorites';

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Wizard header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: '#00BFB3' }} />
          <h2 className="text-xl font-bold text-gray-900">AI Itinerary Builder</h2>
        </div>
        <p className="text-sm text-gray-500 ml-8">Tell us your preferences — we&apos;ll build your perfect Liliw trip</p>
      </div>

      {/* Progress */}
      {stepNumber && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  n <= stepNumber ? 'text-white' : 'bg-gray-200 text-gray-400'
                }`} style={n <= stepNumber ? { backgroundColor: '#00BFB3' } : {}}>
                  {n < stepNumber ? '✓' : n}
                </div>
                <p className={`text-xs font-medium truncate ${n === stepNumber ? 'text-gray-900' : 'text-gray-400'}`}>
                  {stepLabel(n)}
                </p>
                {n < totalSteps && <div className="flex-1 h-px bg-gray-200 ml-1" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6">
        <AnimatePresence mode="wait">

          {/* Step 1 — Duration */}
          {step === 'duration' && (
            <motion.div key="duration" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: '#00BFB3' }} />
                <p className="font-semibold text-gray-700 text-sm">How long is your trip?</p>
              </div>
              <div className="space-y-2">
                {DURATIONS.map(d => (
                  <WizardCard key={d.value} {...d} selected={duration === d.value} onClick={() => setDuration(d.value)} />
                ))}
              </div>
              {duration === 'custom' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <input
                    type="text"
                    placeholder="e.g. 5 hours, 4 days, long weekend…"
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-teal-300 text-sm focus:outline-none focus:border-teal-500"
                  />
                </motion.div>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={!effectiveDuration}
                onClick={() => setStep('budget')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: effectiveDuration ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}>
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 — Budget */}
          {step === 'budget' && (
            <motion.div key="budget" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4" style={{ color: '#00BFB3' }} />
                <p className="font-semibold text-gray-700 text-sm">What&apos;s your budget per person/day?</p>
              </div>
              <div className="space-y-2">
                {BUDGETS.map(b => (
                  <WizardCard key={b.value} {...b} selected={budget === b.value} onClick={() => setBudget(b.value)} />
                ))}
              </div>
              {budget === 'custom' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <input
                    type="text"
                    placeholder="e.g. ₱2,500/day, around ₱500…"
                    value={customBudget}
                    onChange={e => setCustomBudget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-teal-300 text-sm focus:outline-none focus:border-teal-500"
                  />
                </motion.div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep('duration')}
                  className="shrink-0 px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={!effectiveBudget}
                  onClick={() => setStep('interests')}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: effectiveBudget ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}>
                  Next <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Interests */}
          {step === 'interests' && (
            <motion.div key="interests" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4" style={{ color: '#00BFB3' }} />
                <p className="font-semibold text-gray-700 text-sm">What are you into? (pick as many as you like)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(({ value, icon }) => (
                  <InterestChip key={value} value={value} icon={icon}
                    selected={interests.includes(value)} onClick={() => toggleInterest(value)} />
                ))}
              </div>
              {error && <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep('budget')}
                  className="shrink-0 px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={interests.length === 0}
                  onClick={afterInterests}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: interests.length > 0 ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}>
                  {hasFavorites
                    ? <><ChevronRight className="w-4 h-4" /> Next</>
                    : <><Sparkles className="w-4 h-4" /> Generate My Itinerary</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Favorites */}
          {step === 'favorites' && (
            <motion.div key="favorites" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-500" />
                <p className="font-semibold text-gray-700 text-sm">Include your saved favorites?</p>
              </div>
              <p className="text-xs text-gray-400 mb-4 ml-6">Select which favorites the AI should prioritize in your itinerary</p>
              <div className="flex flex-col gap-2 mb-4">
                {favorites.map(fav => {
                  const picked = selectedFavs.includes(fav.name);
                  return (
                    <motion.button key={fav.id} whileTap={{ scale: 0.97 }}
                      onClick={() => toggleFav(fav.name)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                        picked ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <Heart className={`w-4 h-4 shrink-0 ${picked ? 'fill-rose-500 text-rose-500' : 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${picked ? 'text-rose-700' : 'text-gray-800'}`}>{fav.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{fav.type === 'heritage' ? '🏛️ Heritage' : fav.type === 'dining' ? '🍽️ Dining' : '🏞️ Tourist Spot'}</p>
                      </div>
                      {picked && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#f43f5e' }}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('interests')}
                  className="shrink-0 px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={generate}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  <Sparkles className="w-4 h-4" />
                  {selectedFavs.length > 0 ? `Generate with ${selectedFavs.length} favorite${selectedFavs.length > 1 ? 's' : ''}` : 'Generate My Itinerary'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-4 mb-5"
                style={{ borderColor: '#00BFB3', borderTopColor: 'transparent' }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Building your itinerary…</h3>
              <p className="text-sm text-gray-500 max-w-xs">Crafting a personalized plan using real Liliw attractions. Just a moment!</p>
            </motion.div>
          )}

          {/* Result */}
          {step === 'result' && plan && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PlanResult plan={plan} onReset={reset} onSave={saveTrip} saved={tripSaved} isLoggedIn={!!user} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {showLoginModal && (
        <AuthModal
          defaultTab="login"
          message="Log in to save this itinerary to your profile."
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PART 2 — STRAPI ITINERARIES FROM DATABASE
   ══════════════════════════════════════════════════════════ */

const DURATION_LABEL: Record<string, string> = {
  'half-day': '4 hours', 'one-day': '8 hours', 'two-day': '2 days',
  heritage: 'Heritage', foodie: 'Foodie', family: 'Family',
};
const FILTER_TABS = [
  { key: 'all', label: 'All' }, { key: 'half-day', label: 'Half-Day' },
  { key: 'one-day', label: 'Full Day' }, { key: 'two-day', label: '2 Days' },
  { key: 'heritage', label: 'Heritage' }, { key: 'foodie', label: 'Foodie' },
  { key: 'family', label: 'Family' },
];
const DIFF: Record<string, { label: string; badge: string }> = {
  easy:      { label: 'Easy',      badge: 'bg-green-100 text-green-700' },
  moderate:  { label: 'Moderate',  badge: 'bg-yellow-100 text-yellow-700' },
  difficult: { label: 'Difficult', badge: 'bg-red-100 text-red-700' },
};

interface Itinerary {
  id: string; title: string; duration: string; difficulty: string;
  description: string; stopsBlocks: any; highlights: string[];
  included: string[]; not_included: string[]; meeting_point?: string;
  price?: number; max_participants?: number;
  cover_photo?: string | null; photos: string[];
}

function renderLeaf(leaf: any, i: number): React.ReactNode {
  let node: React.ReactNode = leaf.text;
  if (leaf.bold)          node = <strong key={i}>{node}</strong>;
  if (leaf.italic)        node = <em key={i}>{node}</em>;
  if (leaf.underline)     node = <u key={i}>{node}</u>;
  if (leaf.strikethrough) node = <s key={i}>{node}</s>;
  return <span key={i}>{node}</span>;
}

function StrapiBlocks({ blocks }: { blocks: any }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const children = (arr: any[]) => (arr || []).map((c, i) => renderLeaf(c, i));
  return (
    <div className="space-y-2">
      {blocks.map((block: any, i: number) => {
        switch (block.type) {
          case 'paragraph': return <p key={i} className="text-sm text-gray-700 leading-relaxed">{children(block.children)}</p>;
          case 'heading':   return <div key={i} role="heading" aria-level={block.level || 2} className="text-sm font-bold text-gray-900 mt-2">{children(block.children)}</div>;
          case 'list':
            return block.format === 'ordered'
              ? <ol key={i} className="list-none space-y-2">{(block.children || []).map((item: any, j: number) => (
                  <li key={j} className="flex gap-3 text-sm text-gray-700">
                    <span className="shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5" style={{ backgroundColor: '#00BFB3' }}>{j + 1}</span>
                    <span className="pt-0.5">{children(item.children)}</span>
                  </li>
                ))}</ol>
              : <ul key={i} className="space-y-1.5">{(block.children || []).map((item: any, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 font-bold mt-0.5" style={{ color: '#00BFB3' }}>→</span>
                    <span>{children(item.children)}</span>
                  </li>
                ))}</ul>;
          default: return null;
        }
      })}
    </div>
  );
}

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) return null;
  return (
    <div>
      <div className="relative aspect-video rounded-xl overflow-hidden mb-2">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <img src={photos[active]} alt={`${title} photo ${active + 1}`} className="absolute inset-0 w-full h-full object-cover" />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 && (
          <>
            <button onClick={() => setActive(p => (p - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setActive(p => (p + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === active ? 'border-teal-400' : 'border-transparent opacity-60 hover:opacity-90'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailModal({ itin, onClose }: { itin: Itinerary; onClose: () => void }) {
  const diff = DIFF[itin.difficulty] || { label: itin.difficulty, badge: 'bg-gray-100 text-gray-600' };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div key="detail-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 80, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}>
        {itin.cover_photo && (
          <div className="relative shrink-0 h-52">
            <img src={itin.cover_photo} alt={itin.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-14">
              <h2 className="text-2xl font-bold text-white leading-tight">{itin.title}</h2>
            </div>
          </div>
        )}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow transition">
          <X className="w-4 h-4 text-gray-700" />
        </button>
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-8 space-y-7">
            {!itin.cover_photo && <h2 className="text-2xl font-bold text-gray-900 leading-tight">{itin.title}</h2>}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-sm font-semibold px-3 py-1 rounded-full border border-teal-200">
                <Clock className="w-3.5 h-3.5" />{DURATION_LABEL[itin.duration] || itin.duration}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${diff.badge}`}>
                <Star className="w-3 h-3" />{diff.label}
              </span>
              {itin.max_participants && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5" />Max {itin.max_participants} pax
                </span>
              )}
              {itin.meeting_point && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                  <MapPin className="w-3.5 h-3.5" />{itin.meeting_point}
                </span>
              )}
            </div>
            {itin.description && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About this tour</p>
                <p className="text-gray-600 text-sm leading-relaxed">{itin.description}</p>
              </div>
            )}
            {itin.photos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Photos</p>
                <PhotoGallery photos={itin.photos} title={itin.title} />
              </div>
            )}
            {Array.isArray(itin.stopsBlocks) && itin.stopsBlocks.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4" style={{ color: '#00BFB3' }} /> Itinerary Schedule
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <StrapiBlocks blocks={itin.stopsBlocks} />
                </div>
              </div>
            )}
            {itin.highlights.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Highlights</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itin.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                        <ArrowRight className="w-3 h-3" style={{ color: '#00BFB3' }} />
                      </span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(itin.included.length > 0 || itin.not_included.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {itin.included.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Included</p>
                    <ul className="space-y-1.5">
                      {itin.included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {itin.not_included.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Not Included</p>
                    <ul className="space-y-1.5">
                      {itin.not_included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {itin.price && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,.07)' }}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900">₱{Number(itin.price).toLocaleString()}</p>
              <p className="text-xs text-gray-400">per person</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DatabaseItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [detail, setDetail]           = useState<Itinerary | null>(null);

  useEffect(() => {
    getItineraries().then((data: any[]) => {
      setItineraries(data.map((item: any) => {
        const a = item.attributes || item;
        const rawPhotos = a.photos?.data || a.photos || [];
        const photoList: string[] = (Array.isArray(rawPhotos) ? rawPhotos : [])
          .map((p: any) => getPhotoUrl(p.attributes || p)).filter(Boolean) as string[];
        return {
          id:               String(item.id || item.documentId || Math.random()),
          title:            a.title,
          duration:         a.duration    || 'half-day',
          difficulty:       a.difficulty  || 'easy',
          description:      blocksToText(a.description),
          stopsBlocks:      Array.isArray(a.stops) ? a.stops : [],
          highlights:       Array.isArray(a.highlights)   ? a.highlights   : [],
          included:         Array.isArray(a.included)     ? a.included     : [],
          not_included:     Array.isArray(a.not_included) ? a.not_included : [],
          meeting_point:    a.meeting_point || undefined,
          price:            a.price            || undefined,
          max_participants: a.max_participants  || undefined,
          cover_photo:      getPhotoUrl(a.cover_photo?.data?.attributes || a.cover_photo?.attributes || a.cover_photo),
          photos:           photoList,
        };
      }));
    }).finally(() => setLoading(false));
  }, []);

  const onClose = useCallback(() => setDetail(null), []);
  const filtered = filter === 'all' ? itineraries : itineraries.filter(i => i.duration === filter);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Curated Itineraries</h2>
          <p className="text-sm text-gray-500">Hand-picked tours from our local team</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTER_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={filter === key ? { backgroundColor: '#00BFB3' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MapPin className="w-12 h-12 mb-4 opacity-20" style={{ color: '#00BFB3' }} />
          <h3 className="text-lg font-bold text-gray-400 mb-1">
            {itineraries.length === 0 ? 'No itineraries yet' : 'No matches for this filter'}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            {itineraries.length === 0
              ? 'Publish tour packages in Strapi admin and they will appear here.'
              : 'Try a different filter above.'}
          </p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(itin => {
            const diff = DIFF[itin.difficulty] || { label: itin.difficulty, badge: 'bg-gray-100 text-gray-600' };
            return (
              <motion.div key={itin.id}
                variants={{ hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.38 } } }}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                onClick={() => setDetail(itin)}>
                <div className="relative h-44 bg-linear-to-br from-teal-100 to-cyan-50 shrink-0">
                  {itin.cover_photo
                    ? <img src={itin.cover_photo} alt={itin.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="absolute inset-0 flex items-center justify-center opacity-20"><MapPin className="w-16 h-16" style={{ color: '#00BFB3' }} /></div>
                  }
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  {itin.price && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
                      <p className="text-xs text-gray-400 leading-none">from</p>
                      <p className="text-base font-bold leading-tight" style={{ color: '#00BFB3' }}>₱{Number(itin.price).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-teal-600 transition-colors">{itin.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                      <Clock className="w-3.5 h-3.5" style={{ color: '#00BFB3' }} />{DURATION_LABEL[itin.duration] || itin.duration}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${diff.badge}`}>{diff.label}</span>
                  </div>
                  {itin.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">{itin.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">
                      {itin.max_participants ? `Max ${itin.max_participants} pax` : 'Open group'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#00BFB3' }}>
                      View details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {detail && <DetailModal itin={detail} onClose={onClose} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */

function SavedTripsSection() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = () => setTrips(loadSavedTrips());

  useEffect(() => {
    reload();
    window.addEventListener('liliw-trips-updated', reload);
    return () => window.removeEventListener('liliw-trips-updated', reload);
  }, []);

  if (!user || trips.length === 0) return null;

  const deleteTrip = (id: string) => {
    const updated = trips.filter(t => t.id !== id);
    persistSavedTrips(updated);
    setTrips(updated);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <section>
      <motion.button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
      >
        <span className="flex items-center gap-3">
          <BookmarkCheck className="w-5 h-5" style={{ color: '#00BFB3' }} />
          <span className="font-bold text-gray-900">My Saved Trips</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#00BFB3' }}>{trips.length}</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {trips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(prev => prev === trip.id ? null : trip.id)}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{trip.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {trip.duration} · {new Date(trip.savedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedId === trip.id ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {expandedId === trip.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="px-5 py-4 space-y-4">
                          {trip.plan.days?.map(day => (
                            <div key={day.day}>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Day {day.day} — {day.theme}</p>
                              <div className="space-y-2">
                                {day.stops?.map((stop, i) => (
                                  <div key={i} className="flex gap-3 text-sm">
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0 h-fit">{stop.time}</span>
                                    <div>
                                      <p className="font-semibold text-gray-800">{stop.place}</p>
                                      <p className="text-gray-500 text-xs">{stop.activity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function ItinerariesPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Itinerary</h1>
            <p className="text-gray-300">Plan your own trip with AI or browse our curated tours</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">

        {/* AI Wizard */}
        <section>
          <ItineraryWizard />
        </section>

        {/* My Saved Trips */}
        <SavedTripsSection />

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or browse curated tours</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Database itineraries */}
        <section>
          <DatabaseItineraries />
        </section>

      </div>
    </div>
  );
}
