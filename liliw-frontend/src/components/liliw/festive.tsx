'use client';

/**
 * The pieces the Liliw marquee look is built from — lettering, motifs and
 * ornaments — kept in one place so the login modal and every page banner draw
 * from the same source. Two copies of a house style drift apart the first time
 * one of them is adjusted.
 */

export const NAVY = '#0B3D91';
export const BLUE = '#1565C0';
export const GOLD = '#F5C518';
export const GOLD_DEEP = '#C89A0F';
export const CREAM = '#FBF6EA';

/**
 * Marquee lettering.
 *
 * A gold face over a stacked navy extrusion, with lamps painted through the
 * letterforms by background-clip: text — which is what a marquee physically
 * is: bulbs set into the face of the letter, following its shape and stopping
 * where the letter stops. Drawing them as elements would mean placing every
 * bulb by hand, per word, and it would break the moment a title changed.
 */
export function Marquee({
  children,
  tone = 'light',
}: {
  children: string;
  /** 'light' sits on cream, 'dark' on the deep blue banner. */
  tone?: 'light' | 'dark';
}) {
  // On blue the extrusion has to go darker than the ground or the letter loses
  // its edge and reads as flat gold.
  const side = tone === 'dark' ? '#062A66' : NAVY;

  const extrusion = [
    ...Array.from({ length: 6 }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`),
    `7px 7px 0 ${tone === 'dark' ? 'rgba(4,20,50,0.7)' : 'rgba(11,61,145,0.55)'}`,
    tone === 'dark' ? '0 16px 26px rgba(3,15,40,0.5)' : '0 14px 22px rgba(11,61,145,0.28)',
  ].join(', ');

  return (
    <span className="relative inline-block">
      <span
        className="relative block"
        style={{
          backgroundImage: `linear-gradient(180deg, #FFF3C4 0%, ${GOLD} 42%, ${GOLD_DEEP} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: extrusion,
          WebkitTextStroke: `1.5px ${side}`,
          paintOrder: 'stroke fill',
        }}
      >
        {children}
      </span>

      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, #FFFBE8 0 1.6px, rgba(255,246,200,0.55) 2.1px, transparent 2.6px)',
          backgroundSize: '13px 13px',
          backgroundPosition: '3px 3px',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {children}
      </span>
    </span>
  );
}

/* ── Liliw, in line art. Scenery, never the subject. ───────────────────── */

export function Church({ className = '', stroke = BLUE }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 120 150" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M78 150V52h30v98" />
        <path d="M78 52h30l-15-16z" />
        <path d="M93 36v-9M89 27h8" />
        <rect x="86" y="64" width="14" height="18" rx="7" />
        <path d="M84 96h18M84 116h18" />
        <path d="M12 150V70h62v80" />
        <path d="M12 70l31-24 31 24" />
        <path d="M31 150v-38a12 12 0 0124 0v38" />
        <rect x="24" y="86" width="12" height="16" rx="6" />
        <rect x="50" y="86" width="12" height="16" rx="6" />
        <path d="M43 46v-8M39 38h8" />
      </g>
    </svg>
  );
}

export function Tsinelas({ className = '', stroke = BLUE }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 130 90" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {[0, 46].map((dx, i) => (
          <g key={i} transform={`translate(${dx} ${i * 6}) rotate(${i ? 8 : -8} 40 45)`}>
            <path d="M22 16c14-6 30-4 34 8 5 14 2 34-6 44-7 9-24 10-31 2-7-9-8-30-3-42 1-5 3-9 6-12z" />
            {/* the banig weave the town's slippers are known for */}
            <path d="M24 34h30M23 44h33M24 54h31M27 64h25" strokeWidth="0.9" opacity="0.55" />
            <path d="M38 20l-9 13M38 20l10 13" strokeWidth="1.8" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Sampaguita({ className = '', stroke = BLUE }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.4" strokeLinejoin="round">
        {Array.from({ length: 5 }, (_, i) => (
          <ellipse key={i} cx="30" cy="16" rx="7.5" ry="12" transform={`rotate(${i * 72} 30 30)`} />
        ))}
        <circle cx="30" cy="30" r="4.5" />
      </g>
    </svg>
  );
}

/** The four-point motif that flanks a title — a parol/kiping silhouette. */
export function Ornament({ className = '', color = GOLD }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <path d="M20 2l4.5 11.5L36 18l-11.5 4.5L20 34l-4.5-11.5L4 18l11.5-4.5z" fill={color} opacity="0.9" />
      <circle cx="20" cy="18" r="3" fill={color} opacity="0.5" />
      <path d="M20 8.5l2.2 5.6M20 27.5l-2.2-5.6" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/** A hairline rule with a lozenge at its centre. */
export function Rule({ width = 96, color = GOLD }: { width?: number; color?: string }) {
  return (
    <span className="flex items-center justify-center gap-2" aria-hidden>
      <span className="h-px" style={{ width, backgroundColor: `${color}90` }} />
      <span className="inline-block rotate-45" style={{ width: 6, height: 6, backgroundColor: color }} />
      <span className="h-px" style={{ width, backgroundColor: `${color}90` }} />
    </span>
  );
}

/**
 * The woven pattern strip along a banner's edges.
 *
 * Two crossed diagonals rather than an image: it tiles at any width, costs no
 * request, and takes the colour it is given.
 */
export function weaveStyle(color: string, opacity = 0.18) {
  return {
    backgroundImage:
      `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 10px),
       repeating-linear-gradient(-45deg, ${color} 0 2px, transparent 2px 10px)`,
    opacity,
  } as const;
}

/** Splits a title into two balanced lines; one long line shrinks and stops reading as signage. */
export function marqueeLines(title: string): string[] {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
