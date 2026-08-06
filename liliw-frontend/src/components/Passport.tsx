'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookmarkCheck, Heart, Trash2, ChevronDown, MapPin, Calendar, Lightbulb, Trophy, Star, BookUser, X } from 'lucide-react';
import BadgeSVG from '@/components/BadgeSVG';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';
const ML = 'ui-monospace, "SFMono-Regular", "Roboto Mono", Menlo, monospace';

const USER_TYPE_LABELS: Record<string, string> = {
  liliw_local:   'Liliw Resident',
  laguna:        'From Laguna Province',
  provincial:    'From Another Province',
  international: 'International Tourist',
};

interface Stop { time: string; place: string; activity: string; duration: string; tip: string; }
interface Day  { day: number; theme: string; stops: Stop[]; }
interface GeneratedPlan { title: string; summary: string; days: Day[]; tips: string[]; estimatedCostPerDay: string; }
interface SavedTrip { id: string; savedAt: string; title: string; plan: GeneratedPlan; duration: string; budget: string; }

interface VisitedPlace {
  id: string; name: string; category: string | null; location: string | null;
  photo: string | null; visitedAt: string;
  viaQr: boolean; verified: boolean; distanceM: number | null; stillListed: boolean;
}

type PageKey = 'id' | 'visited' | 'achievements' | 'trips' | 'favorites';
const PAGE_KEYS: PageKey[] = ['id', 'visited', 'achievements', 'trips', 'favorites'];
const PAGE_TITLES: Record<PageKey, string> = {
  id: 'Liliw Travel Passport', visited: 'Places Visited', achievements: 'Badges',
  trips: 'Saved Itineraries', favorites: 'Favorites',
};
export const PASSPORT_TRIPS_PAGE = 3;
const TURN_MS = 520;

// ─── Passport helpers ──────────────────────────────────────────────────────────

// Small stable hash. Used for the derived passport number and for giving each
// stamp its own tilt and ink colour — the same place must look the same on
// every render, so nothing here may use Math.random().
function hashOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Derived from the account id rather than stored: no schema change, and the
// raw id never reaches the page.
function passportNumber(id: string) {
  const h = hashOf(`liliw:${id}`).toString(36).toUpperCase().padStart(7, '0');
  return `LLW-${h.slice(0, 4)}-${h.slice(4, 7)}`;
}

// Decorative only — the strip on a real passport encodes the data page, this
// one is built from what is already shown above it and carries nothing extra.
function mrzLines(name: string, passport: string, since: string | null) {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z ]/g, '').trim().replace(/ +/g, '<');
  const pad   = (s: string) => (s + '<'.repeat(44)).slice(0, 44);

  const parts   = name.trim().split(/\s+/);
  const surname = clean(parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'Visitor') || 'VISITOR';
  const given   = clean(parts.slice(0, -1).join(' ')) || 'VISITOR';

  const d = since ? new Date(since) : null;
  const ymd = d && !isNaN(d.getTime())
    ? `${String(d.getFullYear() % 100).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    : '<<<<<<';

  return [
    pad(`P<PHL${surname}<<${given}`),
    pad(`${passport.replace(/-/g, '')}<PHL${ymd}<LILIW<LAGUNA`),
  ];
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// Cream page stock with the faint ruling of a passport leaf. Kept to a single
// repeating gradient — this paints behind everything on a turning sheet, and
// stacked gradients are what make the turn stutter.
const PAPER: React.CSSProperties = {
  backgroundColor: '#FBF7EF',
  backgroundImage:
    'repeating-linear-gradient(0deg, rgba(11,61,145,0.045) 0px, rgba(11,61,145,0.045) 1px, transparent 1px, transparent 26px)',
};

const COVER: React.CSSProperties = {
  backgroundColor: '#0A3172',
  backgroundImage:
    'radial-gradient(120% 100% at 20% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%),' +
    'repeating-linear-gradient(38deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 5px)',
};

// ─── Visa stamp ────────────────────────────────────────────────────────────────

const INKS = ['#0B3D91', '#1565C0', '#B3261E', '#15803D', '#6D28D9', '#B45309'];

function wrapName(name: string, per = 15, max = 3) {
  const words = name.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= per) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].slice(0, per - 1) + '…';
    return kept;
  }
  return lines;
}

function VisaStamp({ v }: { v: VisitedPlace }) {
  const h     = hashOf(v.id);
  const ink   = INKS[h % INKS.length];
  const tilt  = (h % 11) - 5;
  const uid   = `s${h}`;
  const lines = wrapName(v.name, 15, 3);
  const top   = 76 - (lines.length - 1) * 7;
  const ruleTop = top - 15;
  const ruleBot = top + (lines.length - 1) * 14 + 8;

  const stamp = (
    <div className="relative" style={{ transform: `rotate(${tilt}deg)` }}>
      {v.photo && (
        // The place showing faintly through the page, so a stamp is still
        // recognisable at a glance without competing with the ink.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.photo} alt="" aria-hidden loading="lazy"
          className="absolute left-1/2 top-1/2 w-[58%] h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
          style={{ filter: 'grayscale(1) contrast(1.1)', opacity: 0.2 }} />
      )}

      <svg viewBox="0 0 160 160" className="relative w-full h-auto"
        style={{ mixBlendMode: 'multiply', opacity: 0.9 }}>
        <defs>
          <path id={`${uid}-t`} d="M 18,80 A 62,62 0 0 1 142,80" fill="none" />
          <path id={`${uid}-b`} d="M 28,80 A 52,52 0 0 0 132,80" fill="none" />
        </defs>

        <circle cx="80" cy="80" r="72" fill="none" stroke={ink} strokeWidth="3" />
        <circle cx="80" cy="80" r="65.5" fill="none" stroke={ink} strokeWidth="1" />

        <text fill={ink} fontSize="10.5" fontWeight="700" letterSpacing="2.2" style={{ fontFamily: HL }}>
          <textPath href={`#${uid}-t`} startOffset="50%" textAnchor="middle">LILIW · LAGUNA</textPath>
        </text>
        <text fill={ink} fontSize="8" fontWeight="700" letterSpacing="2" style={{ fontFamily: HL }}>
          <textPath href={`#${uid}-b`} startOffset="50%" textAnchor="middle">PILIPINAS</textPath>
        </text>

        <line x1="42" y1={ruleTop} x2="118" y2={ruleTop} stroke={ink} strokeWidth="0.9" />
        {lines.map((ln, i) => (
          <text key={i} x="80" y={top + i * 14} textAnchor="middle" fill={ink}
            fontSize="12.5" fontWeight="700" style={{ fontFamily: HL }}>{ln}</text>
        ))}
        <line x1="42" y1={ruleBot} x2="118" y2={ruleBot} stroke={ink} strokeWidth="0.9" />
        <text x="80" y={ruleBot + 15} textAnchor="middle" fill={ink}
          fontSize="9.5" fontWeight="600" letterSpacing="0.8" style={{ fontFamily: ML }}>
          {fmtDate(v.visitedAt).toUpperCase()}
        </text>
      </svg>

      {/* The entry mark — only a scan confirmed within range earns it. */}
      {v.verified && (
        <div className="absolute bottom-0 -right-1 px-1.5 py-0.5 border-2 rounded"
          title={v.distanceM != null ? `Confirmed ${v.distanceM}m from the spot` : 'Confirmed on-site'}
          style={{
            transform: 'rotate(-9deg)', borderColor: '#16A34A', color: '#16A34A',
            mixBlendMode: 'multiply', opacity: 0.9, fontFamily: HL,
            fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
          }}>
          ON-SITE
        </div>
      )}
    </div>
  );

  return (
    <div className="p-0.5" title={v.location ?? undefined}>
      {v.stillListed
        ? <Link href={`/attractions/${v.id}`} className="block transition-transform hover:scale-[1.05]">{stamp}</Link>
        : stamp}
    </div>
  );
}

// ─── Small pieces ──────────────────────────────────────────────────────────────

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-0.5"
        style={{ color: 'rgba(11,61,145,0.5)', fontFamily: HL }}>{label}</p>
      <p className="text-[13.5px] font-semibold leading-snug break-words"
        style={{ color: '#12203F', fontFamily: DL }}>{value}</p>
    </div>
  );
}

function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[19px] font-bold leading-none" style={{ color: '#0B3D91', fontFamily: DL }}>{children}</h2>
      {sub && <p className="text-[11px] mt-1.5" style={{ color: 'rgba(11,61,145,0.55)', fontFamily: BL }}>{sub}</p>}
      <div className="mt-2 h-px w-12" style={{ backgroundColor: '#F5C518' }} />
    </div>
  );
}

// The town seal, used as the cover emblem and as a page watermark.
function Seal({ size = 96, gold = true }: { size?: number; gold?: boolean }) {
  const c = gold ? '#F5C518' : '#0B3D91';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke={c} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="0.8" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <line key={i} x1={50 + Math.cos(a) * 40} y1={50 + Math.sin(a) * 40}
          x2={50 + Math.cos(a) * 34} y2={50 + Math.sin(a) * 34} stroke={c} strokeWidth="1.4" />;
      })}
      <path d="M50 26 L55.6 42.6 L73 42.6 L58.9 52.8 L64.4 69.4 L50 59.2 L35.6 69.4 L41.1 52.8 L27 42.6 L44.4 42.6 Z"
        fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="7" fill="none" stroke={c} strokeWidth="1.2" />
    </svg>
  );
}

// ─── The booklet ───────────────────────────────────────────────────────────────

export default function Passport({ initialPage = 0, onClose }: { initialPage?: number; onClose: () => void }) {
  const { user, token, loading } = useAuth();
  const { favorites } = useFavorites();
  const reduceMotion = useReducedMotion();

  const [trips, setTrips]           = useState<SavedTrip[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [achievementsData, setAchievementsData] = useState<{ totalPoints: number; achievements: any[]; recentActivity: any[] } | null>(null);
  const [profile, setProfile]       = useState<{ user_type: string | null; full_name: string | null; member_since: string | null } | null>(null);
  const [visits, setVisits]         = useState<VisitedPlace[] | null>(null);

  // Opening straight onto a section (Saved Itineraries) skips the cover.
  const [opened, setOpened]       = useState(initialPage > 0);
  const [pageIndex, setPageIndex] = useState(initialPage);
  // The leaf mid-turn. `leaf` is the page drawn on the turning sheet, `under`
  // is what sits beneath it — going forward the old page turns away to reveal
  // the new one, going back the new page falls down over the old.
  const [turn, setTurn] = useState<{ leaf: PageKey; under: PageKey; dir: number } | null>(null);

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= PAGE_KEYS.length || i === pageIndex || turn) return;
    const dir = i > pageIndex ? 1 : -1;
    if (!reduceMotion) {
      setTurn({
        leaf:  dir > 0 ? PAGE_KEYS[pageIndex] : PAGE_KEYS[i],
        under: dir > 0 ? PAGE_KEYS[i]         : PAGE_KEYS[pageIndex],
        dir,
      });
    }
    setPageIndex(i);
  }, [pageIndex, turn, reduceMotion]);

  // Navigation is locked while a leaf is turning, so the turn must always end.
  // onAnimationComplete normally clears it; this is the safety net if the
  // animation is interrupted and never reports back.
  useEffect(() => {
    if (!turn) return;
    const t = setTimeout(() => setTurn(null), TURN_MS + 300);
    return () => clearTimeout(t);
  }, [turn]);

  // The booklet floats over the site, so the page behind it must not scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (!opened) return;
      if (e.key === 'ArrowRight') goTo(pageIndex + 1);
      if (e.key === 'ArrowLeft')  goTo(pageIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, opened, pageIndex, goTo]);

  const loadTrips = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/itineraries', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTrips((data.trips || []).map((row: any) => ({
          id: row.id, savedAt: row.saved_at, title: row.title, plan: row.plan, duration: row.duration, budget: row.budget,
        })));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    loadTrips();
    window.addEventListener('liliw-trips-updated', loadTrips);
    return () => window.removeEventListener('liliw-trips-updated', loadTrips);
  }, [loadTrips]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(d); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/user/achievements', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAchievementsData(d); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/user/visited-attractions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setVisits(d?.visits ?? []))
      .catch(() => setVisits([]));
  }, [token]);

  const deleteTrip = async (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    try {
      await fetch(`/api/itineraries?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  if (loading || !user) return null;

  const displayName  = profile?.full_name || user.username;
  const initials     = displayName.charAt(0).toUpperCase();
  const nationality  = profile?.user_type ? (USER_TYPE_LABELS[profile.user_type] ?? 'Liliw Community Member') : 'Liliw Community Member';
  const passportNo   = passportNumber(user.id);
  const memberSince  = profile?.member_since ? fmtDate(profile.member_since) : '—';
  const badgesEarned = achievementsData?.achievements.filter((a: any) => a.earned).length ?? 0;
  const [mrz1, mrz2] = mrzLines(displayName, passportNo, profile?.member_since ?? null);

  const tabs: { key: PageKey; label: string; icon: any; count?: number }[] = [
    { key: 'id',           label: 'Passport',  icon: BookUser },
    { key: 'visited',      label: 'Places',    icon: MapPin,        count: visits?.length ?? 0 },
    { key: 'achievements', label: 'Badges',    icon: Trophy,        count: badgesEarned },
    { key: 'trips',        label: 'Trips',     icon: BookmarkCheck, count: trips.length },
    { key: 'favorites',    label: 'Favorites', icon: Heart,         count: favorites.length },
  ];

  // ── Page bodies ──

  const renderPage = (key: PageKey) => {
    switch (key) {

      case 'id': return (
        <div className="relative">
          <div className="pointer-events-none absolute right-0 bottom-4 opacity-[0.05]" aria-hidden>
            <Seal size={170} gold={false} />
          </div>

          <div className="relative rounded-md px-3 py-2.5 mb-4 text-center overflow-hidden"
            style={{ ...COVER, border: '1px solid rgba(245,197,24,0.5)' }}>
            <p className="text-[7.5px] font-bold uppercase tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: HL }}>
              Republika ng Pilipinas
            </p>
            <p className="text-[17px] font-bold mt-0.5 leading-none" style={{ color: '#F5C518', fontFamily: DL, letterSpacing: '0.03em' }}>
              Liliw Travel Passport
            </p>
            <p className="text-[7.5px] uppercase tracking-[0.26em] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: HL }}>
              Municipality of Liliw · Laguna
            </p>
          </div>

          <div className="relative flex gap-4">
            <div className="shrink-0">
              <div className="w-[74px] p-1"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(245,197,24,0.85)', boxShadow: '0 2px 5px rgba(11,61,145,0.14)' }}>
                <div className="w-full flex items-center justify-center font-bold"
                  style={{ aspectRatio: '3 / 4', ...COVER, color: '#F5C518', fontSize: 34, fontFamily: DL }}>
                  {initials}
                </div>
              </div>
              <p className="text-[7px] text-center mt-1 uppercase tracking-[0.24em]"
                style={{ color: 'rgba(11,61,145,0.45)', fontFamily: HL }}>Bearer</p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 flex-1 min-w-0">
              <Field label="Surname / Given Names" value={displayName} span />
              <Field label="Passport No." value={passportNo} />
              <Field label="Type" value={nationality} />
              <Field label="Date of Issue" value={memberSince} />
              <Field label="Authority" value="Liliw CHATO" />
              <Field label="Registered Email" value={user.email} span />
            </div>
          </div>

          <div className="relative grid grid-cols-4 gap-1.5 mt-4">
            {[
              { n: visits?.length ?? 0, l: 'Places' },
              { n: achievementsData?.totalPoints ?? 0, l: 'Points' },
              { n: badgesEarned, l: 'Badges' },
              { n: trips.length, l: 'Trips' },
            ].map(s => (
              <div key={s.l} className="text-center rounded-md py-2"
                style={{ backgroundColor: 'rgba(11,61,145,0.05)', border: '1px solid rgba(11,61,145,0.09)' }}>
                <p className="text-[19px] font-bold leading-none" style={{ color: '#0B3D91', fontFamily: DL }}>{s.n}</p>
                <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] mt-1"
                  style={{ color: 'rgba(11,61,145,0.5)', fontFamily: HL }}>{s.l}</p>
              </div>
            ))}
          </div>

          <div aria-hidden className="relative mt-4 rounded px-2.5 py-2 overflow-x-auto"
            style={{ backgroundColor: 'rgba(11,61,145,0.045)', borderTop: '1px solid rgba(11,61,145,0.16)' }}>
            {[mrz1, mrz2].map((l, i) => (
              <p key={i} className="whitespace-pre text-[9px] sm:text-[10.5px] leading-relaxed"
                style={{ fontFamily: ML, color: 'rgba(18,32,63,0.72)', letterSpacing: '0.06em' }}>{l}</p>
            ))}
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-3">
            <p className="text-[10.5px] italic" style={{ color: 'rgba(11,61,145,0.5)', fontFamily: DL }}>
              A keepsake of your travels in Liliw.
            </p>
            <Link href="/profile/edit" onClick={onClose}
              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
              Edit details
            </Link>
          </div>
        </div>
      );

      case 'visited': return (
        <div>
          <PageTitle sub="Every spot you checked into, stamped on arrival.">Places Visited</PageTitle>

          {visits === null ? (
            <p className="text-center py-14 text-sm" style={{ color: 'rgba(11,61,145,0.5)', fontFamily: BL }}>Loading your stamps…</p>
          ) : visits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ border: '2px dashed rgba(11,61,145,0.25)' }}>
                <MapPin className="w-7 h-7" style={{ color: 'rgba(11,61,145,0.3)' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: '#0B3D91', fontFamily: HL }}>No stamps yet</h3>
              <p className="text-[12px] max-w-xs mx-auto mt-1" style={{ color: 'rgba(11,61,145,0.6)', fontFamily: BL }}>
                Scan the QR poster at an attraction — or open its page and stay a few minutes — and it will be stamped here.
              </p>
              <Link href="/attractions" onClick={onClose}
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
                Explore attractions
              </Link>
            </div>
          ) : (
            <>
              {(() => {
                const target = achievementsData?.achievements.find((a: any) => a.trigger_type === 'attraction_visit_count');
                if (!target) return null;
                const goal = target.trigger_value || 5;
                const pct = Math.min(100, Math.round((visits.length / goal) * 100));
                return (
                  <div className="mb-4 rounded-md p-3"
                    style={{ backgroundColor: 'rgba(11,61,145,0.04)', border: '1px solid rgba(11,61,145,0.1)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: '#0B3D91', fontFamily: HL }}>{target.name}</p>
                      <p className="text-[11px] font-semibold" style={{ color: target.earned ? '#16A34A' : 'rgba(11,61,145,0.6)', fontFamily: BL }}>
                        {target.earned ? 'Earned' : `${visits.length} of ${goal}`}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(11,61,145,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: target.earned ? '#16A34A' : '#F5C518' }} />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {visits.map(v => <VisaStamp key={v.id} v={v} />)}
              </div>
            </>
          )}
        </div>
      );

      case 'achievements': return (
        <div>
          <PageTitle sub="Endorsements earned across your travels.">Badges</PageTitle>

          <div className="rounded-md p-3 mb-4 flex items-center justify-between"
            style={{ ...COVER, border: '1px solid rgba(245,197,24,0.4)' }}>
            <div>
              <p className="text-[7.5px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: HL }}>Total Points</p>
              <p className="text-[28px] font-bold leading-none mt-1" style={{ color: '#F5C518', fontFamily: DL }}>{achievementsData?.totalPoints ?? 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[7.5px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: HL }}>Badges Earned</p>
              <p className="text-[28px] font-bold text-white leading-none mt-1" style={{ fontFamily: DL }}>
                {badgesEarned}<span className="text-sm opacity-50"> / {achievementsData?.achievements.length ?? 0}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(achievementsData?.achievements ?? []).map((a: any) => (
              <div key={a.id} className="flex flex-col items-center text-center rounded-md p-2"
                style={{
                  backgroundColor: a.earned ? 'rgba(255,255,255,0.8)' : 'rgba(11,61,145,0.03)',
                  border: `1px solid ${a.earned ? 'rgba(245,197,24,0.5)' : 'rgba(11,61,145,0.08)'}`,
                }}>
                <BadgeSVG icon={a.icon} color={a.badge_color} earned={a.earned} size={54} />
                <p className="font-bold text-[11.5px] mt-2 leading-tight" style={{ color: '#12203F', fontFamily: HL }}>{a.name}</p>
                {a.earned && a.earned_at ? (
                  <p className="text-[9px] mt-1 font-semibold" style={{ color: a.badge_color, fontFamily: ML }}>
                    {fmtDate(a.earned_at).toUpperCase()}
                  </p>
                ) : (
                  <p className="text-[9px] mt-1" style={{ color: 'rgba(11,61,145,0.45)', fontFamily: BL }}>
                    {a.trigger_type === 'event_count'  ? `${a.trigger_value} event${a.trigger_value > 1 ? 's' : ''}` :
                     a.trigger_type === 'review_count' ? `${a.trigger_value} review${a.trigger_value > 1 ? 's' : ''}` :
                     `${a.trigger_value} pts needed`}
                  </p>
                )}
                <span className="mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: a.earned ? `${a.badge_color}20` : 'rgba(11,61,145,0.06)',
                    color: a.earned ? a.badge_color : 'rgba(11,61,145,0.45)', fontFamily: HL,
                  }}>
                  +{a.points_reward}
                </span>
              </div>
            ))}
            {(!achievementsData || achievementsData.achievements.length === 0) && (
              <div className="col-span-3 sm:col-span-4 text-center py-10">
                <Trophy className="w-9 h-9 mx-auto mb-2" style={{ color: 'rgba(11,61,145,0.2)' }} />
                <p className="font-semibold text-sm" style={{ color: 'rgba(11,61,145,0.55)', fontFamily: HL }}>No achievements loaded</p>
              </div>
            )}
          </div>

          {achievementsData && achievementsData.recentActivity.length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2"
                style={{ color: 'rgba(11,61,145,0.5)', fontFamily: HL }}>Recent Activity</p>
              <div className="rounded-md overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.65)', border: '1px solid rgba(11,61,145,0.1)' }}>
                {achievementsData.recentActivity.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: i === achievementsData.recentActivity.length - 1 ? 'none' : '1px solid rgba(11,61,145,0.07)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {r.action === 'event_signup' ? <Calendar className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                        : r.action === 'review' ? <Star className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
                        : r.action === 'attraction_visit' ? <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                        : <Trophy className="w-3.5 h-3.5 shrink-0 text-green-600" />}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: '#12203F', fontFamily: HL }}>
                          {r.reference_name || (r.action === 'event_signup' ? 'Event Sign-up' : r.action === 'review' ? 'Review Written' : r.action === 'attraction_visit' ? 'Spot Visited' : 'Achievement Bonus')}
                        </p>
                        <p className="text-[10px]" style={{ color: 'rgba(11,61,145,0.45)', fontFamily: BL }}>
                          {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold shrink-0" style={{ color: '#1565C0', fontFamily: HL }}>+{r.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case 'trips': return (
        <div>
          <PageTitle sub="Plans you saved from the AI trip builder.">Saved Itineraries</PageTitle>

          {trips.length === 0 ? (
            <div className="text-center py-8">
              <BookmarkCheck className="w-9 h-9 mx-auto mb-2" style={{ color: 'rgba(11,61,145,0.2)' }} />
              <p className="font-semibold text-sm" style={{ color: '#0B3D91', fontFamily: HL }}>No saved itineraries yet</p>
              <p className="text-[12px] mt-1 mb-4" style={{ color: 'rgba(11,61,145,0.55)', fontFamily: BL }}>Generate a trip with the AI builder and save it here.</p>
              <Link href="/itineraries" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>Plan a Trip</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map(trip => (
                <div key={trip.id} className="rounded-md overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.72)', border: '1px solid rgba(11,61,145,0.12)' }}>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
                    onClick={() => setExpandedId(prev => prev === trip.id ? null : trip.id)}>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(245,197,24,0.2)' }}>
                      <Calendar className="w-3.5 h-3.5" style={{ color: '#0B3D91' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[12.5px] truncate" style={{ color: '#12203F', fontFamily: HL }}>{trip.title}</p>
                      <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(11,61,145,0.5)', fontFamily: BL }}>
                        {trip.duration} · {trip.budget} · {fmtDate(trip.savedAt)}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteTrip(trip.id); }}
                      aria-label={`Delete ${trip.title}`}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expandedId === trip.id ? 'rotate-180' : ''}`}
                      style={{ color: 'rgba(11,61,145,0.4)' }} />
                  </div>

                  <AnimatePresence>
                    {expandedId === trip.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden" style={{ borderTop: '1px solid rgba(11,61,145,0.1)' }}>
                        <div className="px-3 py-3">
                          {trip.plan.summary && <p className="text-[12px] mb-3" style={{ color: 'rgba(11,61,145,0.7)', fontFamily: BL }}>{trip.plan.summary}</p>}
                          <div className="space-y-4">
                            {trip.plan.days?.map(day => (
                              <div key={day.day}>
                                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                                  style={{ color: 'rgba(11,61,145,0.5)', fontFamily: HL }}>Day {day.day} — {day.theme}</p>
                                <div className="space-y-1.5">
                                  {day.stops?.map((stop, i) => (
                                    <div key={i} className="flex gap-2.5 text-[12px]">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 h-fit"
                                        style={{ backgroundColor: 'rgba(245,197,24,0.2)', color: '#0B3D91', fontFamily: HL }}>{stop.time}</span>
                                      <div>
                                        <p className="font-semibold" style={{ color: '#12203F', fontFamily: HL }}>{stop.place}</p>
                                        <p className="text-[11px]" style={{ color: 'rgba(11,61,145,0.6)', fontFamily: BL }}>{stop.activity}</p>
                                        {stop.tip && (
                                          <p className="text-[11px] text-amber-700 mt-0.5 flex items-start gap-0.5" style={{ fontFamily: BL }}>
                                            <Lightbulb className="w-3 h-3 inline mr-0.5 shrink-0" /> {stop.tip}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {trip.plan.estimatedCostPerDay && (
                            <p className="mt-3 text-[11px] font-semibold" style={{ color: 'rgba(11,61,145,0.6)', fontFamily: BL }}>
                              Est. cost/day: <span style={{ color: '#12203F' }}>{trip.plan.estimatedCostPerDay}</span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      case 'favorites': return (
        <div>
          <PageTitle sub="Places you bookmarked to come back to.">Favorites</PageTitle>

          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-9 h-9 mx-auto mb-2" style={{ color: 'rgba(11,61,145,0.2)' }} />
              <p className="font-semibold text-sm" style={{ color: '#0B3D91', fontFamily: HL }}>No favorites yet</p>
              <p className="text-[12px] mt-1 mb-4" style={{ color: 'rgba(11,61,145,0.55)', fontFamily: BL }}>Tap the heart icon on any attraction to save it here.</p>
              <Link href="/attractions" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>Browse Attractions</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {favorites.map(fav => (
                <Link key={fav.id} href={`/attractions/${fav.id}`} onClick={onClose}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 transition hover:shadow-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.72)', border: '1px solid rgba(11,61,145,0.12)' }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff1f2' }}>
                    <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[12.5px] truncate" style={{ color: '#12203F', fontFamily: HL }}>{fav.name}</p>
                    <p className="text-[10.5px] capitalize" style={{ color: 'rgba(11,61,145,0.5)', fontFamily: BL }}>
                      {fav.type}{fav.category ? ` · ${fav.category}` : ''}
                    </p>
                  </div>
                  <MapPin className="w-3.5 h-3.5 shrink-0 ml-auto" style={{ color: 'rgba(11,61,145,0.3)' }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  const under = turn ? turn.under : PAGE_KEYS[pageIndex];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'radial-gradient(80% 80% at 50% 40%, rgba(8,20,45,0.80) 0%, rgba(4,10,24,0.93) 100%)' }}>

      {/* Clicking away closes the booklet */}
      <button aria-label="Close passport" onClick={onClose} className="absolute inset-0 cursor-default" />

      <motion.button aria-label="Close passport" onClick={onClose}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white/15"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#F5C518' }}>
        <X className="w-4.5 h-4.5" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.7, 0.25, 1] }}
        className="relative"
        style={{
          width: 'min(94vw, 620px)', height: 'min(84vh, 520px)',
          // A short perspective magnified the turning leaf as its free edge
          // swung toward the viewer, so the page grew visibly larger than the
          // booklet holding it. Longer, with the vanishing point over the
          // spine, keeps the leaf inside its covers.
          perspective: 3000,
          perspectiveOrigin: '20px 50%',
        }}>

        {/* Booklet body / back cover */}
        <div className="absolute inset-0 rounded-[14px]"
          style={{ ...COVER, boxShadow: '0 30px 60px -18px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,197,24,0.18)' }} />

        {/* Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-[20px] rounded-l-[14px] flex flex-col items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.08) 100%)' }} aria-hidden>
          {Array.from({ length: 13 }).map((_, i) => (
            <span key={i} className="block w-[2px] h-2.5 rounded-full" style={{ backgroundColor: 'rgba(245,197,24,0.38)' }} />
          ))}
        </div>

        {/* The stack of leaves waiting underneath */}
        {[3, 2, 1].map(n => (
          <div key={n} aria-hidden className="absolute rounded-r-md"
            style={{
              top: 10 + n * 2, bottom: 54 + n * 2, left: 20, right: 10 - n * 2.5,
              backgroundColor: n === 1 ? '#F3EDE1' : n === 2 ? '#EAE3D5' : '#DFD8C9',
              boxShadow: '1px 0 2px rgba(0,0,0,0.18)',
            }} />
        ))}

        {/* Leaf window — fixed height, so turning never resizes the booklet */}
        <div className="absolute" style={{ top: 10, bottom: 54, left: 20, right: 10, transformStyle: 'preserve-3d' }}>
          <div className="absolute inset-0 rounded-r-md overflow-hidden"
            style={{ ...PAPER, boxShadow: 'inset 12px 0 18px -16px rgba(11,61,145,0.45)' }}>
            <div className="h-full flex flex-col px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto overscroll-contain"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(11,61,145,0.25) transparent' }}>
              {/* Keyed on the page, so changing leaf remounts this and replays
                  the fade. The turning sheet covers the swap, so the content
                  underneath is already settling in as the leaf lands rather
                  than appearing all at once the instant it clears. */}
              <motion.div key={under} className="flex-1"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: turn ? 0.16 : 0, ease: 'easeOut' }}>
                {renderPage(under)}
              </motion.div>
              <motion.p key={`n-${under}`} className="pt-5 text-center text-[9px] uppercase tracking-[0.32em] shrink-0"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.34, delay: turn ? 0.2 : 0 }}
                style={{ color: 'rgba(11,61,145,0.3)', fontFamily: ML }}>
                Page {PAGE_KEYS.indexOf(under) + 1} of {PAGE_KEYS.length}
              </motion.p>
            </div>
          </div>

          {/* The turning sheet. Deliberately blank apart from a watermark — a
              full copy of the page rotating in 3D is what made the turn
              stutter, and at speed the detail is not readable anyway. */}
          <AnimatePresence>
            {turn && !reduceMotion && (
              <motion.div
                key={`${turn.leaf}-${turn.dir}`}
                aria-hidden
                className="absolute inset-0 rounded-r-md pointer-events-none flex items-center justify-center overflow-hidden"
                style={{
                  ...PAPER,
                  transformOrigin: 'left center',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  // Shadow thrown back toward the spine, so the leaf reads as
                  // lifting off the stack rather than floating over it.
                  boxShadow: '-10px 14px 30px -10px rgba(8,20,45,0.5)',
                }}
                initial={{ rotateY: turn.dir > 0 ? 0 : -178 }}
                animate={{ rotateY: turn.dir > 0 ? -178 : 0 }}
                transition={{ duration: TURN_MS / 1000, ease: [0.36, 0.02, 0.2, 1] }}
                onAnimationComplete={() => setTurn(null)}>

                <div className="text-center px-6" style={{ opacity: 0.5 }}>
                  <Seal size={54} gold={false} />
                  <p className="mt-2 text-[11px] font-semibold tracking-wide"
                    style={{ color: 'rgba(11,61,145,0.4)', fontFamily: DL }}>
                    {PAGE_TITLES[turn.leaf]}
                  </p>
                </div>

                {/* Paper shading: a firm crease at the hinge easing into light
                    across the leaf, then a bright rim on the free edge where it
                    catches the light as it lifts. */}
                <div className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg,' +
                      ' rgba(8,20,45,0.30) 0%, rgba(8,20,45,0.13) 6%, rgba(8,20,45,0.03) 22%,' +
                      ' rgba(255,255,255,0) 60%, rgba(255,255,255,0.22) 97%, rgba(255,255,255,0.5) 100%)',
                  }} />
                {/* The bound edge itself */}
                <div className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: 'linear-gradient(90deg, rgba(8,20,45,0.4), rgba(8,20,45,0))' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section bar */}
        <div className="absolute left-[20px] right-2.5 bottom-0 h-[54px] flex items-center gap-1 px-1.5">
          <button onClick={() => goTo(pageIndex - 1)} disabled={pageIndex === 0 || !!turn}
            aria-label="Previous page"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition disabled:opacity-25 hover:bg-white/10"
            style={{ color: '#F5C518' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
            {tabs.map((t, i) => {
              const Icon = t.icon;
              const on = i === pageIndex;
              return (
                <button key={t.key} onClick={() => goTo(i)} disabled={!!turn}
                  aria-current={on ? 'page' : undefined} title={t.label}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full text-[10.5px] font-bold transition"
                  style={{
                    backgroundColor: on ? '#F5C518' : 'rgba(255,255,255,0.08)',
                    color: on ? '#0B3D91' : 'rgba(255,255,255,0.72)',
                    border: `1px solid ${on ? '#F5C518' : 'rgba(255,255,255,0.14)'}`,
                    fontFamily: BL,
                  }}>
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {!!t.count && (
                    <span className="text-[9px] font-bold px-1 rounded-full"
                      style={{ backgroundColor: on ? 'rgba(11,61,145,0.15)' : 'rgba(255,255,255,0.12)' }}>{t.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <button onClick={() => goTo(pageIndex + 1)} disabled={pageIndex === PAGE_KEYS.length - 1 || !!turn}
            aria-label="Next page"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition disabled:opacity-25 hover:bg-white/10"
            style={{ color: '#F5C518' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── The cover, closed until you open it ── */}
        <AnimatePresence>
          {!opened && (
            <motion.button
              key="cover"
              onClick={() => setOpened(true)}
              aria-label="Open your Liliw Passport"
              className="absolute inset-0 rounded-[14px] flex flex-col items-center justify-center text-center cursor-pointer"
              style={{
                ...COVER, transformOrigin: 'left center', willChange: 'transform',
                boxShadow: '0 30px 60px -18px rgba(0,0,0,0.7)',
              }}
              initial={reduceMotion ? { opacity: 1 } : { rotateY: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { rotateY: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { rotateY: -172 }}
              transition={{ duration: reduceMotion ? 0.2 : 0.85, ease: [0.4, 0.02, 0.2, 1] }}>

              <span className="absolute rounded-[8px] pointer-events-none"
                style={{ inset: 13, border: '1.5px solid rgba(245,197,24,0.55)' }} />
              <span className="absolute rounded-[6px] pointer-events-none"
                style={{ inset: 18, border: '0.5px solid rgba(245,197,24,0.3)' }} />

              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.45em] mb-5"
                style={{ color: 'rgba(245,197,24,0.72)', fontFamily: HL }}>
                Republika ng Pilipinas
              </p>

              <Seal size={88} />

              <h1 className="mt-5 text-[28px] sm:text-[34px] font-bold leading-none"
                style={{ color: '#F5C518', fontFamily: DL, letterSpacing: '0.04em' }}>
                Liliw Passport
              </h1>
              <div className="mt-2.5 h-px w-20" style={{ backgroundColor: 'rgba(245,197,24,0.5)' }} />
              <p className="mt-2.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.32em]"
                style={{ color: 'rgba(255,255,255,0.5)', fontFamily: HL }}>
                Municipality of Liliw · Laguna
              </p>

              <motion.p
                className="absolute bottom-7 text-[9px] font-bold uppercase tracking-[0.3em]"
                style={{ color: 'rgba(245,197,24,0.85)', fontFamily: HL }}
                animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                Tap to open
              </motion.p>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
