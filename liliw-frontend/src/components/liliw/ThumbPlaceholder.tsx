'use client';

import { Church, Tsinelas, Sampaguita, GOLD } from './festive';

/**
 * What a card shows when there is no photograph.
 *
 * Entries without an image used to drop the picture strip altogether, so a
 * list of news and events came out ragged — some cards 160px taller than
 * their neighbours for reasons that had nothing to do with what they said.
 * A grey box would fix the alignment and say nothing; this fixes it and looks
 * like the rest of the site.
 *
 * The mark is chosen from the title rather than at random, so the same entry
 * draws the same one every time it is rendered — a thumbnail that changed on
 * every visit would read as a loading state.
 */

const MARKS = [Church, Tsinelas, Sampaguita];

/** Stable across renders, servers and reloads, unlike Math.random or an index. */
function pick(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % MARKS.length;
}

export default function ThumbPlaceholder({
  seed,
  tint = '#0B3D91',
  className = 'h-40',
  label,
}: {
  /** Usually the title — anything stable that identifies this entry. */
  seed: string;
  /** The category's own colour, so the strip is scannable by kind. */
  tint?: string;
  className?: string;
  /** Optional word across the middle, for places where the kind is not obvious. */
  label?: string;
}) {
  const Mark = MARKS[pick(seed)];

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${tint} 0%, #0B3D91 130%)` }}
    >
      {/* The same wash the empty-header treatment uses, so the two read as one
          idea rather than two different placeholders. */}
      <span className="absolute inset-0 opacity-[0.18]" style={{
        background:
          'radial-gradient(80% 120% at 12% 0%, #F7C948 0%, transparent 55%),' +
          'radial-gradient(70% 110% at 90% 100%, #2EC4D6 0%, transparent 60%)',
      }} />

      {/* Large, low-contrast and bleeding off the corner: decoration the eye
          skips, not an icon anyone will try to press. */}
      <Mark className="absolute -right-4 -bottom-3 w-32 h-32 opacity-[0.22]" stroke="#FFFFFF" />

      {label && (
        <span
          className="absolute inset-0 grid place-items-center text-[11px] font-black uppercase tracking-[0.28em]"
          style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-heading), Outfit, sans-serif' }}
        >
          {label}
        </span>
      )}

      <span className="liliw-weave absolute inset-x-0 bottom-0 h-[3px] opacity-70" />
      <span className="absolute inset-x-0 bottom-[3px] h-px" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
    </div>
  );
}
