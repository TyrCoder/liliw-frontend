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
 * A gold face over a deep navy extrusion — a fairground sign seen side-on,
 * where the depth of the letter does the work rather than any ornament on it.
 *
 * There were bulbs punched through the letterforms here. At the sizes these
 * titles actually render they read as speckle rather than lamps, and they cost
 * the words their weight; the letter is stronger plain.
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
    // A deeper stack than the letter is thick — the side of the letter is what
    // gives it its solidity now that the face carries no detail of its own.
    ...Array.from({ length: 9 }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`),
    `10px 10px 0 ${tone === 'dark' ? 'rgba(4,20,50,0.78)' : 'rgba(11,61,145,0.6)'}`,
    `12px 12px 0 ${tone === 'dark' ? 'rgba(3,15,40,0.45)' : 'rgba(11,61,145,0.3)'}`,
    tone === 'dark' ? '0 22px 34px rgba(2,10,32,0.62)' : '0 18px 28px rgba(11,61,145,0.34)',
    // A lit sign spills a little light onto what is behind it. Only on the
    // blue, where there is a night scene for it to fall on.
    ...(tone === 'dark' ? ['0 0 34px rgba(245,197,24,0.30)'] : []),
  ].join(', ');

  return (
    <span className="relative inline-block">
      {/* The letter face: a plain gold fill, nothing clever.
       *
       * It used to be a gradient delivered by background-clip: text over a
       * transparent fill, which meant that wherever that clip did not paint,
       * the words vanished and all that remained was the extrusion behind them
       * — dark letter-shapes on dark blue. The banner rendered exactly that.
       * The base colour must not depend on it. */}
      <span className="relative block" style={{ color: GOLD, textShadow: extrusion }}>
        {children}
      </span>

      {/* Shading, as an enhancement only. Bright along the top of the letter,
          deeper at the base, the way a lit sign falls off. If background-clip
          fails here nothing is lost — the solid gold underneath still reads. */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(255,250,225,0.85) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 62%, rgba(120,80,0,0.28) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
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

/**
 * The Liliw night scene with a marquee headline over it.
 *
 * One implementation for the login modal and every page banner. The artwork
 * carries the church, the tsinelas, the sampaguita, the woven border and the
 * gold frame, so the drawn motifs above are not layered on top of it — doing
 * that gave two churches and a doubled frame.
 *
 * The lettering stays CSS rather than being baked into the image, because the
 * headline changes per page and per auth view. Baking it in would mean an
 * export for every title, which is the work this avoids.
 */
export function LiliwScene({
  title,
  subtitle,
  eyebrow,
  size = 'page',
  children,
}: {
  title: string;
  subtitle?: string;
  /** Small label above the title — the brand line on the modal. */
  eyebrow?: string;
  /** 'modal' is the narrow login header; 'page' is the wide page banner. */
  size?: 'modal' | 'page';
  /** Anything that sits above the title, such as a back link. */
  children?: React.ReactNode;
}) {
  const lines = marqueeLines(title);
  const modal = size === 'modal';

  return (
    <div
      className={`relative overflow-hidden ${modal ? 'px-7 pt-9 pb-11' : 'px-5 pt-10 pb-12 sm:pt-12 sm:pb-14'}`}
      style={{
        // The church sits left and the slippers right in the artwork, so the
        // middle stays clear for the words however the image is cropped.
        backgroundImage: 'url(/images/login-banner.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0A2A6B',
      }}
    >
      {/* A vignette through the centre only. The scene is detailed behind the
          letters, and the subtitle loses contrast without it — dimming the
          whole image would flatten artwork that is the point of the design. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(6,26,72,0.62) 0%, rgba(6,26,72,0.26) 55%, transparent 80%)' }}
        aria-hidden
      />

      <div className={`relative z-10 ${modal ? '' : 'max-w-6xl mx-auto'}`}>
        {children}

        <div className="text-center">
          {eyebrow && (
            <>
              <p
                className="text-[10px] font-black tracking-[0.3em] uppercase"
                style={{ color: GOLD, fontFamily: 'var(--font-heading), Outfit, sans-serif' }}
              >
                {eyebrow}
              </p>
              <div className="my-2 flex justify-center">
                <Rule width={48} />
              </div>
            </>
          )}

          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {!modal && <Ornament className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 hidden sm:block" />}
            <h1
              className="uppercase leading-[0.94] select-none"
              style={{
                fontFamily: 'var(--font-heading), Outfit, sans-serif',
                fontWeight: 900,
                letterSpacing: '0.005em',
                fontSize: modal
                  ? (lines.length > 1 ? 'clamp(28px, 8.5vw, 44px)' : 'clamp(26px, 7.5vw, 40px)')
                  : (lines.length > 1 ? 'clamp(26px, 6.4vw, 58px)' : 'clamp(30px, 7.6vw, 66px)'),
              }}
            >
              {lines.map(line => (
                <span key={line} className="block">
                  <Marquee tone="dark">{line}</Marquee>
                </span>
              ))}
            </h1>
            {!modal && <Ornament className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 hidden sm:block" />}
          </div>

          {!modal && (
            <div className="mt-5 flex justify-center">
              <Rule width={110} />
            </div>
          )}

          {subtitle && (
            <p
              className={`${modal ? 'mt-3 text-sm' : 'mt-4 text-sm sm:text-base max-w-2xl mx-auto'}`}
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif',
                textShadow: '0 1px 6px rgba(4,18,50,0.55)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Wave into whatever follows — the device the rest of the site uses
          between sections. */}
      <svg
        viewBox="0 0 400 26" preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-6"
        aria-hidden
      >
        <path d="M0 14c60 12 120-12 200-6s140 18 200 6v12H0z" fill="#F9F6F0" />
        <path d="M0 14c60 12 120-12 200-6s140 18 200 6" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.75" />
      </svg>
    </div>
  );
}
