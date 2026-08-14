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

import { Marquee, Church, Tsinelas, Sampaguita, Rule, weaveStyle, marqueeLines, NAVY, GOLD, CREAM } from '@/components/liliw/festive';

export default function MarqueeHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  // Two lines look deliberate on a marquee; one long line shrinks to fit and
  // stops reading as signage.
  const lines = marqueeLines(title);

  return (
    <div className="relative overflow-hidden px-7 pt-8 pb-10" style={{ backgroundColor: CREAM }}>
      {/* Woven ground, at the edge of visibility. */}
      <div
        className="absolute inset-0"
        style={weaveStyle(NAVY, 0.055)}
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
