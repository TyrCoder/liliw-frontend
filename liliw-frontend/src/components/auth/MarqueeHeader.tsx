'use client';

/**
 * The login modal's header: a vintage funfair marquee, done in Liliw's blues.
 *
 * The lettering is CSS rather than an image, so it stays crisp at any density,
 * re-colours with the palette, and can carry a different headline per view —
 * "Welcome Back", "Create Account", "Reset Password" all get the same
 * treatment without anyone opening a design tool.
 *
 * Bulbs are the interesting part. They are a dot grid painted through the
 * letterforms with background-clip: text, which is what a real marquee looks
 * like: lamps set into the face of the letter, following its shape, cut off
 * where the letter ends. Drawing them as separate elements would mean placing
 * each one by hand for every word.
 */

const NAVY = '#0B3D91';
const BLUE = '#1565C0';
const GOLD = '#F5C518';
const GOLD_DEEP = '#C89A0F';
const CREAM = '#FBF6EA';

/** Stacked shadows give the letter a solid side, rather than a blur behind it. */
const extrusion = [
  ...Array.from({ length: 6 }, (_, i) => `${i + 1}px ${i + 1}px 0 ${NAVY}`),
  '7px 7px 0 rgba(11,61,145,0.55)',
  '0 14px 22px rgba(11,61,145,0.28)',
].join(', ');

function Marquee({ children }: { children: string }) {
  return (
    <span className="relative inline-block">
      {/* Face: warm gold, lit from above. */}
      <span
        className="relative block"
        style={{
          backgroundImage: `linear-gradient(180deg, #FFF3C4 0%, ${GOLD} 42%, ${GOLD_DEEP} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: extrusion,
          // Chrome paints text-shadow behind transparent text, so the
          // extrusion survives the gradient fill; the stroke below keeps the
          // edge crisp where face meets side.
          WebkitTextStroke: `1.5px ${NAVY}`,
          paintOrder: 'stroke fill',
        }}
      >
        {children}
      </span>

      {/* Lamps, clipped to the letterforms. */}
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

/* ── Liliw, in line art. Kept faint: scenery, not subject. ─────────────── */

function Church({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" fill="none" className={className} aria-hidden>
      <g stroke={BLUE} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {/* bell tower */}
        <path d="M78 150V52h30v98" />
        <path d="M78 52h30l-15-16z" />
        <path d="M93 36v-9M89 27h8" />
        <rect x="86" y="64" width="14" height="18" rx="7" />
        <path d="M84 96h18M84 116h18" />
        {/* nave and pediment */}
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

function Tsinelas({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 90" fill="none" className={className} aria-hidden>
      <g stroke={BLUE} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {[0, 46].map((dx, i) => (
          <g key={i} transform={`translate(${dx} ${i * 6}) rotate(${i ? 8 : -8} 40 45)`}>
            {/* sole */}
            <path d="M22 16c14-6 30-4 34 8 5 14 2 34-6 44-7 9-24 10-31 2-7-9-8-30-3-42 1-5 3-9 6-12z" />
            {/* woven texture, the banig weave the town is known for */}
            <path d="M24 34h30M23 44h33M24 54h31M27 64h25" strokeWidth="0.9" opacity="0.55" />
            {/* thong straps */}
            <path d="M38 20l-9 13M38 20l10 13" strokeWidth="1.8" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function Sampaguita({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      <g stroke={BLUE} strokeWidth="1.4" strokeLinejoin="round">
        {Array.from({ length: 5 }, (_, i) => (
          <ellipse key={i} cx="30" cy="16" rx="7.5" ry="12"
            transform={`rotate(${i * 72} 30 30)`} />
        ))}
        <circle cx="30" cy="30" r="4.5" />
      </g>
    </svg>
  );
}

/** A hairline rule with a lozenge at its centre — the divider used throughout. */
function Rule() {
  return (
    <span className="flex items-center justify-center gap-2 my-2" aria-hidden>
      <span className="h-px w-12" style={{ backgroundColor: `${GOLD}90` }} />
      <span className="inline-block rotate-45" style={{ width: 5, height: 5, backgroundColor: GOLD }} />
      <span className="h-px w-12" style={{ backgroundColor: `${GOLD}90` }} />
    </span>
  );
}

export default function MarqueeHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  // Two lines look deliberate on a marquee; one long line shrinks to fit and
  // stops reading as signage.
  const words = title.trim().split(/\s+/);
  const lines = words.length > 1
    ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
    : [title];

  return (
    <div className="relative overflow-hidden px-7 pt-8 pb-10" style={{ backgroundColor: CREAM }}>
      {/* Woven ground, at the edge of visibility. */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            `repeating-linear-gradient(45deg, ${NAVY} 0 2px, transparent 2px 11px),
             repeating-linear-gradient(-45deg, ${NAVY} 0 2px, transparent 2px 11px)`,
        }}
        aria-hidden
      />

      {/* Scenery. Low contrast on purpose — the eye should land on the words. */}
      <Church className="absolute -right-1 top-1 w-28 h-36 opacity-[0.16]" />
      <Tsinelas className="absolute right-3 bottom-6 w-28 h-20 opacity-[0.17]" />
      <Sampaguita className="absolute left-2 top-4 w-12 h-12 opacity-[0.13]" />
      <Sampaguita className="absolute left-10 bottom-8 w-8 h-8 opacity-[0.10]" />

      {/* Corner ornaments */}
      {[
        'left-2 top-2', 'right-2 top-2 rotate-90',
        'left-2 bottom-2 -rotate-90', 'right-2 bottom-2 rotate-180',
      ].map(pos => (
        <svg key={pos} viewBox="0 0 40 40" className={`absolute w-8 h-8 ${pos} opacity-40`} aria-hidden>
          <path d="M2 14V2h12" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M7 20V7h13" stroke={NAVY} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        </svg>
      ))}

      <div className="relative z-10 text-center">
        <p
          className="text-[10px] font-black tracking-[0.3em] uppercase"
          style={{ color: NAVY, fontFamily: 'var(--font-heading), Outfit, sans-serif' }}
        >
          Liliw Tourism
        </p>
        <Rule />

        <h2
          className="uppercase leading-[0.92] select-none"
          style={{
            fontFamily: 'var(--font-heading), Outfit, sans-serif',
            fontWeight: 900,
            letterSpacing: '0.01em',
            // Scales with the modal instead of wrapping awkwardly at the
            // widths this sits in.
            fontSize: lines.length > 1 ? 'clamp(30px, 9vw, 46px)' : 'clamp(26px, 7.5vw, 40px)',
          }}
        >
          {lines.map(line => (
            <span key={line} className="block">
              <Marquee>{line}</Marquee>
            </span>
          ))}
        </h2>

        <p
          className="mt-3 text-sm"
          style={{ color: '#4B5C74', fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif' }}
        >
          {subtitle}
        </p>
      </div>

      {/* Wave into the form below — the same device the site uses between
          sections, so the modal belongs to the rest of the product. */}
      <svg
        viewBox="0 0 400 26" preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-6"
        aria-hidden
      >
        <path d="M0 14c60 12 120-12 200-6s140 18 200 6v12H0z" fill="#fff" />
        <path d="M0 14c60 12 120-12 200-6s140 18 200 6" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.75" />
      </svg>
    </div>
  );
}
