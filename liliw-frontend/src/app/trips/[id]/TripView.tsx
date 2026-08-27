'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Wallet, MapPin, Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import PageBanner from '@/components/liliw/PageBanner';
import type { SharedTrip } from '@/lib/shared-trip';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

export default function TripView({ trip }: { trip: SharedTrip | null }) {
  const plan = trip?.plan;

  return (
    <div className="min-h-screen page-ground">
      <PageBanner
        title="Shared Itinerary"
        subtitle="A Liliw, Laguna trip plan"
        backHref="/itineraries"
        backLabel="Plan your own"
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {!trip || !plan ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: HL }}>
              This itinerary isn’t available
            </h2>
            <p className="text-gray-500 mb-6" style={{ fontFamily: BL }}>
              The link may be wrong, or the owner has stopped sharing it.
            </p>
            <Link href="/itineraries"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
              <Sparkles className="w-4 h-4" /> Build your own trip
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3" style={{ fontFamily: DL }}>
                {plan.title || trip.title}
              </h1>
              {plan.summary && (
                <p className="text-gray-600 leading-relaxed mb-4" style={{ fontFamily: BL }}>{plan.summary}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {trip.duration && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border"
                    style={{ backgroundColor: 'rgba(11,61,145,0.07)', color: '#1565C0', borderColor: 'rgba(11,61,145,0.2)', fontFamily: BL }}>
                    <Clock className="w-3.5 h-3.5" />{trip.duration}
                  </span>
                )}
                {plan.estimatedCostPerDay && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border"
                    style={{ backgroundColor: 'rgba(245,197,24,0.1)', color: '#1565C0', borderColor: 'rgba(245,197,24,0.3)', fontFamily: BL }}>
                    <Wallet className="w-3.5 h-3.5" />{plan.estimatedCostPerDay}
                  </span>
                )}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-5">
              {plan.days?.map(day => (
                <div key={day.day} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"
                    style={{ background: 'linear-gradient(90deg, rgba(11,61,145,0.05), transparent)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#1565C0', fontFamily: HL }}>
                      Day {day.day}
                    </p>
                    <p className="font-bold text-gray-900" style={{ fontFamily: HL }}>{day.theme}</p>
                  </div>
                  <div className="px-6 py-5 space-y-5">
                    {day.stops?.map((stop, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="shrink-0 flex flex-col items-center">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: 'rgba(245,197,24,0.15)', color: '#1565C0', fontFamily: HL }}>
                            {stop.time}
                          </span>
                          {i < day.stops.length - 1 && <span className="flex-1 w-px bg-gray-200 my-1.5" />}
                        </div>
                        <div className="pb-1 min-w-0">
                          <p className="font-bold text-gray-900" style={{ fontFamily: HL }}>{stop.place}</p>
                          <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: BL }}>{stop.activity}</p>
                          {stop.duration && (
                            <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1" style={{ fontFamily: BL }}>
                              <Clock className="w-3 h-3" />{stop.duration}
                            </p>
                          )}
                          {stop.tip && (
                            <p className="text-xs mt-2 flex items-start gap-1.5 rounded-lg px-3 py-2"
                              style={{ backgroundColor: 'rgba(245,197,24,0.08)', color: '#7c5e00', fontFamily: BL }}>
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#F5C518' }} />
                              <span>{stop.tip}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            {plan.tips?.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2" style={{ fontFamily: HL }}>
                  <Lightbulb className="w-4 h-4" style={{ color: '#F5C518' }} /> Practical tips
                </p>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700" style={{ fontFamily: BL }}>
                      <span className="shrink-0 font-bold mt-0.5" style={{ color: '#F5C518' }}>→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="text-center mt-8">
              <Link href="/itineraries"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
                <Sparkles className="w-4 h-4" /> Plan your own Liliw trip <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
