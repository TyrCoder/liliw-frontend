'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, QrCode, Star, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { MappedStop } from '@/components/ItineraryMap';

/**
 * An itinerary you can work through, rather than one you only read.
 *
 * A tour was a schedule: times, places, and no notion of whether the visitor
 * had been to any of them. This turns the same stops into a checklist ticked
 * by the system rather than by hand — a stop counts as done when the visit is
 * credited, which is the same record that gates reviews and awards points, so
 * nobody can tick off a place they did not go to.
 *
 * The two things a visitor can do from here are the two things that mark
 * progress: scan the code at the entrance, and write the review afterwards.
 */
export default function ItineraryChecklist({ stops }: { stops: MappedStop[] }) {
  const { user, token } = useAuth();
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Stops that resolved to a real attraction are the only ones a visit can be
  // recorded against; a stop the CMS does not know is shown, but not counted.
  const ids = stops.map(s => s.id).filter(Boolean) as string[];
  const idKey = ids.join(',');

  useEffect(() => {
    if (!token || !ids.length) { setVisited({}); return; }
    let cancelled = false;
    setLoading(true);

    fetch(`/api/user/has-visited?attractionIds=${encodeURIComponent(idKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : { visited: {} }))
      .then(d => { if (!cancelled) setVisited(d.visited ?? {}); })
      .catch(() => { if (!cancelled) setVisited({}); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [idKey, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stops.length) return null;

  const done = ids.filter(id => visited[id]).length;
  const total = ids.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap"
        style={{ backgroundColor: '#F8FAFC' }}>
        <div>
          <p className="text-sm font-bold text-gray-900">Your progress</p>
          <p className="text-xs text-gray-500">
            {!user
              ? 'Sign in to track which stops you have visited.'
              : loading
                ? 'Checking your visits…'
                : done === total
                  ? 'Every stop on this tour is done.'
                  : `${done} of ${total} stops visited`}
          </p>
        </div>
        {user && total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: done === total ? '#0D9488' : '#1565C0' }} />
            </div>
            <span className="text-xs font-bold tabular-nums text-gray-600">{pct}%</span>
          </div>
        )}
      </div>

      <ol className="divide-y divide-gray-100">
        {stops.map((stop, i) => {
          const id = stop.id;
          const isDone = !!(id && visited[id]);

          return (
            <li key={`${stop.place}-${i}`} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-label={isDone ? 'Visited' : 'Not visited yet'}
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={isDone
                  ? { backgroundColor: '#0D9488', color: '#fff' }
                  : { backgroundColor: '#E2E8F0', color: '#64748B' }}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {stop.time && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(245,197,24,0.15)', color: '#1565C0' }}>
                      {stop.time}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {stop.place}
                  </span>
                </div>

                {stop.note && !isDone && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stop.note}</p>
                )}

                {/* What to do next at this stop. Only shown to someone signed
                    in, since neither action means anything without an account. */}
                {user && id && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {isDone ? (
                      <Link href={`/attractions/${id}#reviews`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition hover:bg-amber-50"
                        style={{ borderColor: 'rgba(245,158,11,0.35)', color: '#B45309' }}>
                        <Star className="w-3 h-3" /> Write a review
                      </Link>
                    ) : (
                      <>
                        <Link href="/scan"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg text-white transition hover:opacity-90"
                          style={{ backgroundColor: '#1565C0' }}>
                          <QrCode className="w-3 h-3" /> Scan at this place
                        </Link>
                        <Link href={`/attractions/${id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300">
                          <MapPin className="w-3 h-3" /> Details
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {loading && !isDone && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300 mt-1" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
