'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  Marquee, Church, Tsinelas, Sampaguita, Ornament, Rule,
  weaveStyle, marqueeLines, GOLD,
} from './festive';

/**
 * The page header every Liliw Tourism page shares.
 *
 * One component rather than a banner per page: the blue, the gold rules, the
 * woven strips, the marquee lettering, the ornaments and the spacing are the
 * house style, and they stay identical because there is only one of them.
 * A page supplies its title, its subtitle, and — where it helps — which
 * illustration sits on the right.
 *
 * Everything decorative is drawn in CSS and SVG. No image to export per page,
 * nothing to re-cut when a title changes, and it stays sharp on any display.
 */
export default function PageBanner({
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back to Home',
  motif = 'tsinelas',
}: {
  title: string;
  subtitle?: string;
  backHref?: string | null;
  backLabel?: string;
  /** The right-hand illustration. The church on the left never changes. */
  motif?: 'tsinelas' | 'flower' | 'none';
}) {
  const lines = marqueeLines(title);

  return (
    <header
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0A3A8C 0%, #1156B8 48%, #0B3D91 100%)' }}
    >
      {/* Woven strips along the top and bottom edges. */}
      <div className="absolute inset-x-0 top-0 h-9" style={weaveStyle('#FFFFFF', 0.09)} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-9" style={weaveStyle('#FFFFFF', 0.09)} aria-hidden />

      {/* Gold hairlines inside them. */}
      <div className="absolute inset-x-0 top-9 h-px" style={{ backgroundColor: `${GOLD}CC` }} aria-hidden />
      <div className="absolute inset-x-0 bottom-9 h-px" style={{ backgroundColor: `${GOLD}CC` }} aria-hidden />

      {/* Liliw, faint enough to sit behind the words. */}
      <Church
        stroke="#FFFFFF"
        className="absolute left-2 sm:left-8 top-8 h-[86%] w-auto opacity-[0.13] hidden sm:block"
      />
      {motif === 'tsinelas' && (
        <>
          <Tsinelas stroke="#FFFFFF" className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 w-40 opacity-[0.15] hidden sm:block" />
          <Sampaguita stroke="#FFFFFF" className="absolute right-40 sm:right-52 bottom-10 w-16 opacity-[0.11] hidden md:block" />
        </>
      )}
      {motif === 'flower' && (
        <>
          <Sampaguita stroke="#FFFFFF" className="absolute right-10 top-1/2 -translate-y-1/2 w-28 opacity-[0.14] hidden sm:block" />
          <Sampaguita stroke="#FFFFFF" className="absolute right-36 bottom-12 w-14 opacity-[0.10] hidden md:block" />
        </>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-12 pb-12 sm:pt-14 sm:pb-14">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-75"
            style={{ color: GOLD, fontFamily: 'var(--font-heading), Outfit, sans-serif' }}
          >
            <ChevronLeft className="w-4 h-4" /> {backLabel}
          </Link>
        )}

        <div className="text-center mt-6 sm:mt-4">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <Ornament className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 hidden sm:block" />
            <h1
              className="uppercase leading-[0.94] select-none"
              style={{
                fontFamily: 'var(--font-heading), Outfit, sans-serif',
                fontWeight: 900,
                letterSpacing: '0.005em',
                // Scales with the viewport rather than wrapping mid-word on a
                // phone, which is where a fixed size on a long title fails.
                fontSize: lines.length > 1
                  ? 'clamp(26px, 6.4vw, 58px)'
                  : 'clamp(30px, 7.6vw, 68px)',
              }}
            >
              {lines.map(line => (
                <span key={line} className="block">
                  <Marquee tone="dark">{line}</Marquee>
                </span>
              ))}
            </h1>
            <Ornament className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 hidden sm:block" />
          </div>

          <div className="mt-5 flex justify-center">
            <Rule width={110} />
          </div>

          {subtitle && (
            <p
              className="mt-4 text-sm sm:text-base max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.82)', fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
