'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, MapPin, Lightbulb,
  Sparkles, RotateCcw, Sun, Wallet, Heart,
} from 'lucide-react';

/* ─────────────────────── wizard config ───────────────────── */

const DURATIONS = [
  { value: 'half-day', label: 'Half Day', sub: '4 hours', icon: '🌅' },
  { value: 'full-day', label: 'Full Day', sub: '8 hours', icon: '☀️' },
  { value: '2 days',   label: '2 Days',   sub: 'Weekend', icon: '🗓️' },
  { value: '3 days',   label: '3 Days',   sub: 'Extended', icon: '✈️' },
];

const BUDGETS = [
  { value: 'budget-friendly (under ₱1,000/day)', label: 'Budget', sub: 'Under ₱1,000/day', icon: '💸' },
  { value: 'mid-range (₱1,000–₱3,000/day)',      label: 'Mid-range', sub: '₱1,000 – ₱3,000/day', icon: '💳' },
  { value: 'premium (₱3,000+/day)',               label: 'Premium', sub: '₱3,000+/day', icon: '✨' },
];

const INTERESTS = [
  { value: 'Heritage & History',    icon: '🏛️' },
  { value: 'Local Food & Cuisine',  icon: '🍜' },
  { value: 'Arts & Crafts',         icon: '👟' },
  { value: 'Nature & Outdoors',     icon: '🌿' },
  { value: 'Family Activities',     icon: '👨‍👩‍👧' },
  { value: 'Photography',           icon: '📸' },
  { value: 'Shopping',              icon: '🛍️' },
  { value: 'Culture & Festivals',   icon: '🎉' },
];

/* ─────────────────────── types ───────────────────────────── */

interface Stop {
  time: string;
  place: string;
  activity: string;
  duration: string;
  tip: string;
}

interface Day {
  day: number;
  theme: string;
  stops: Stop[];
}

interface GeneratedPlan {
  title: string;
  summary: string;
  days: Day[];
  tips: string[];
  estimatedCostPerDay: string;
}

/* ─────────────────────── step components ─────────────────── */

function StepCard({
  value, label, sub, icon, selected, onClick,
}: {
  value: string; label: string; sub: string; icon: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
        selected
          ? 'border-teal-400 bg-teal-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-bold text-sm ${selected ? 'text-teal-700' : 'text-gray-900'}`}>{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      {selected && (
        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00BFB3' }}>
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </motion.button>
  );
}

function InterestChip({
  value, icon, selected, onClick,
}: { value: string; icon: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
        selected
          ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      <span>{icon}</span>{value}
    </motion.button>
  );
}

/* ─────────────────────── result view ─────────────────────── */

function PlanResult({ plan, onReset }: { plan: GeneratedPlan; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header card */}
      <div
        className="rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#00BFB3,#0077A8)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-1">Your AI Itinerary</p>
            <h2 className="text-2xl font-bold leading-tight mb-2">{plan.title}</h2>
            <p className="text-teal-50 text-sm leading-relaxed">{plan.summary}</p>
          </div>
          <Sparkles className="w-8 h-8 shrink-0 text-teal-200" />
        </div>
        {plan.estimatedCostPerDay && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-semibold">{plan.estimatedCostPerDay} per day</span>
          </div>
        )}
      </div>

      {/* Days */}
      {plan.days?.map((day) => (
        <motion.div
          key={day.day}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: day.day * 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: '#00BFB3' }}
            >
              {day.day}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Day {day.day}</p>
              <p className="text-sm font-bold text-gray-900">{day.theme}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {day.stops?.map((stop, i) => (
              <div key={i} className="px-5 py-4 flex gap-4">
                <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#00BFB3' }}
                  />
                  {i < (day.stops.length - 1) && (
                    <div className="w-px flex-1 min-h-6" style={{ backgroundColor: '#e0f7f6' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {stop.time}
                    </span>
                    {stop.duration && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{stop.duration}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                    {stop.place}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">{stop.activity}</p>
                  {stop.tip && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{stop.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Tips */}
      {plan.tips?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">Travel Tips</p>
          <ul className="space-y-2">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                <Sun className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition"
      >
        <RotateCcw className="w-4 h-4" /> Plan Another Trip
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────── page ────────────────────────────── */

type Step = 'duration' | 'budget' | 'interests' | 'generating' | 'result';

export default function PlanTripPage() {
  const [step, setStep]             = useState<Step>('duration');
  const [duration, setDuration]     = useState('');
  const [budget, setBudget]         = useState('');
  const [interests, setInterests]   = useState<string[]>([]);
  const [plan, setPlan]             = useState<GeneratedPlan | null>(null);
  const [error, setError]           = useState('');

  const toggleInterest = (val: string) => {
    setInterests(prev =>
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const generate = async () => {
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, budget, interests }),
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

  const reset = () => {
    setStep('duration');
    setDuration('');
    setBudget('');
    setInterests([]);
    setPlan(null);
    setError('');
  };

  const stepNumber = step === 'duration' ? 1 : step === 'budget' ? 2 : step === 'interests' ? 3 : null;

  return (
    <div className="min-h-screen bg-[#f8fafc]" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-7 h-7" style={{ color: '#00BFB3' }} />
              <h1 className="text-4xl font-bold text-white">Plan Your Trip</h1>
            </div>
            <p className="text-gray-300 text-lg">Tell us what you like — our AI builds your perfect Liliw itinerary</p>
          </motion.div>
        </div>
      </div>

      {/* Progress bar */}
      {stepNumber && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      n < stepNumber ? 'text-white' : n === stepNumber ? 'text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                    style={n <= stepNumber ? { backgroundColor: '#00BFB3' } : {}}
                  >
                    {n < stepNumber ? '✓' : n}
                  </div>
                  <p className={`text-xs font-medium truncate ${n === stepNumber ? 'text-gray-900' : 'text-gray-400'}`}>
                    {n === 1 ? 'Duration' : n === 2 ? 'Budget' : 'Interests'}
                  </p>
                  {n < 3 && <div className="flex-1 h-px bg-gray-200 ml-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* Step 1 — Duration */}
          {step === 'duration' && (
            <motion.div key="duration" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5" style={{ color: '#00BFB3' }} />
                  <h2 className="text-xl font-bold text-gray-900">How long is your trip?</h2>
                </div>
                <p className="text-sm text-gray-500 ml-7">Pick your available time in Liliw</p>
              </div>
              <div className="space-y-3">
                {DURATIONS.map(d => (
                  <StepCard key={d.value} {...d} selected={duration === d.value}
                    onClick={() => setDuration(d.value)} />
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={!duration}
                onClick={() => setStep('budget')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition"
                style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: duration ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 — Budget */}
          {step === 'budget' && (
            <motion.div key="budget" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-5 h-5" style={{ color: '#00BFB3' }} />
                  <h2 className="text-xl font-bold text-gray-900">What&apos;s your budget?</h2>
                </div>
                <p className="text-sm text-gray-500 ml-7">Per person, per day</p>
              </div>
              <div className="space-y-3">
                {BUDGETS.map(b => (
                  <StepCard key={b.value} {...b} selected={budget === b.value}
                    onClick={() => setBudget(b.value)} />
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('duration')}
                  className="shrink-0 px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={!budget}
                  onClick={() => setStep('interests')}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: budget ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Interests */}
          {step === 'interests' && (
            <motion.div key="interests" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-5 h-5" style={{ color: '#00BFB3' }} />
                  <h2 className="text-xl font-bold text-gray-900">What are you into?</h2>
                </div>
                <p className="text-sm text-gray-500 ml-7">Pick as many as you like</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {INTERESTS.map(({ value, icon }) => (
                  <InterestChip key={value} value={value} icon={icon}
                    selected={interests.includes(value)}
                    onClick={() => toggleInterest(value)} />
                ))}
              </div>
              {error && (
                <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('budget')}
                  className="shrink-0 px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={interests.length === 0}
                  onClick={generate}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: interests.length > 0 ? '0 6px 20px rgba(0,191,179,.35)' : 'none' }}
                >
                  <Sparkles className="w-4 h-4" /> Generate My Itinerary
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 rounded-full border-4 border-t-transparent mb-6"
                style={{ borderColor: '#00BFB3', borderTopColor: 'transparent' }}
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Building your itinerary...</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Our AI is crafting a personalized plan using real Liliw attractions. Just a moment!
              </p>
            </motion.div>
          )}

          {/* Result */}
          {step === 'result' && plan && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PlanResult plan={plan} onReset={reset} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
