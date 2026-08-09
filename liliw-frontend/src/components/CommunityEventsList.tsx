'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Mail, Loader2, HeartHandshake } from 'lucide-react';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface CommunityEvent {
  id: string; title: string; category: string; description: string;
  venue: string; date_start: string | null; date_end: string | null;
  organizer: string; contact_email: string; slots: number | null;
  how_to_join: string; is_open: boolean;
  _media?: { url: string; alt_text?: string }[];
}

const CATEGORY_COLOR: Record<string, string> = {
  volunteer: '#0D9488', cleanup: '#16A34A', workshop: '#8B5CF6',
  outreach: '#F97316', 'festival-prep': '#EF4444', other: '#64748B',
};

function dateRange(start: string | null, end: string | null) {
  if (!start) return 'Ongoing';
  const s = new Date(start);
  const fmt = (d: Date) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!end) return fmt(s);
  const e = new Date(end);
  // Same-day events read as one date with a time range, not "5 Sep – 5 Sep".
  if (fmt(s) === fmt(e)) {
    return `${fmt(s)}, ${s.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} – ${e.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `${fmt(s)} – ${fmt(e)}`;
}

/**
 * What the town is actually organising, above the form.
 *
 * The Participate page used to offer a form and nothing else, so someone
 * willing to help had to volunteer in the abstract. These come from the CMS,
 * so the office can post a call for stewards without a developer.
 *
 * Renders nothing at all when there is nothing on — an empty "no events"
 * panel on a page whose job is to invite people in reads as a dead site.
 */
export default function CommunityEventsList({ onJoin }: { onJoin?: (title: string) => void }) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/community-events')
      .then(r => r.json())
      .then(d => setEvents(d.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />Loading community events…
      </div>
    );
  }

  if (!events.length) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2.5 mb-1">
        <HeartHandshake className="w-5 h-5" style={{ color: '#0D9488' }} />
        <h2 className="text-xl font-extrabold" style={{ color: '#1A1A2E', fontFamily: HL }}>
          What&rsquo;s happening
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-5" style={{ fontFamily: BL }}>
        Activities you can take part in right now.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {events.map((e, i) => {
          const colour = CATEGORY_COLOR[e.category] || CATEGORY_COLOR.other;
          const photo = e._media?.[0]?.url;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.3) }}
              className="bg-white rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: 'rgba(11,61,145,0.1)' }}
            >
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={e._media?.[0]?.alt_text || e.title}
                     className="w-full h-36 object-cover" loading="lazy" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide capitalize"
                        style={{ backgroundColor: `${colour}15`, color: colour }}>
                    {(e.category || 'other').replace('-', ' ')}
                  </span>
                  {!e.is_open && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500">
                      Closed
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 leading-snug" style={{ fontFamily: HL }}>{e.title}</h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-gray-500" style={{ fontFamily: BL }}>
                  <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" />{dateRange(e.date_start, e.date_end)}</p>
                  {e.venue && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{e.venue}</p>}
                  {e.slots ? <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 shrink-0" />{e.slots} volunteers needed</p> : null}
                  {e.organizer && <p className="text-gray-400">Organised by {e.organizer}</p>}
                </div>

                {e.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3" style={{ fontFamily: BL }}>{e.description}</p>
                )}

                {e.how_to_join && (
                  <div className="mt-3 p-3 rounded-xl text-xs text-gray-600" style={{ backgroundColor: '#F9F6F0', fontFamily: BL }}>
                    <span className="font-bold text-gray-700">How to join: </span>{e.how_to_join}
                  </div>
                )}

                <div className="mt-4 pt-3 flex items-center gap-2 border-t" style={{ borderColor: 'rgba(11,61,145,0.07)' }}>
                  {e.is_open && onJoin && (
                    <button
                      onClick={() => onJoin(e.title)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                      style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}
                    >
                      I want to join
                    </button>
                  )}
                  {e.contact_email && (
                    <a href={`mailto:${e.contact_email}`}
                       className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700">
                      <Mail className="w-3.5 h-3.5" />Contact
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
