'use client';

import { Church, Tsinelas, Sampaguita, weaveStyle } from './festive';

const CREAM = '#FBF7EE';
const GOLD = '#D8A93B';
const ROYAL = '#0B3D91';

/**
 * The cream ground the Explore section sits on.
 *
 * Drawn rather than photographed. The church, the tsinelas and the sampaguita
 * are the same SVGs the banners and the login modal use, so this is the house
 * style at a different opacity rather than a picture that happens to match it
 * — and it stays crisp at any width, tints with the palette, and costs no
 * request. A 1500px raster of the same thing would be a megabyte behind six
 * photographs that are the actual content.
 *
 * Everything here is held between 4% and 10% opacity. The moment the ground
 * competes with a photograph, the section has failed at its one job.
 */
/**
 * One motif, parked. Hidden below lg — at phone width there is no margin for
 * scenery, only for content.
 */
function Motif({
  className = '', style, children,
}: {
  className?: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div aria-hidden className={`hidden lg:block absolute pointer-events-none ${className}`} style={style}>
      {children}
    </div>
  );
}

export default function ExploreBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate" style={{ backgroundColor: CREAM }}>
      {/* Woven texture, faint, across the whole ground. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={weaveStyle(ROYAL, 0.035)} />

      {/* Blue crest at the top, with its gold hairline riding the curve. */}
      <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none"
        className="absolute top-0 inset-x-0 w-full pointer-events-none" style={{ height: 74 }}>
        <path d="M0,0 H1440 V44 C1130,104 900,18 660,58 C450,94 200,44 0,72 Z" fill={ROYAL} />
        <path d="M0,72 C200,44 450,94 660,58 C900,18 1130,104 1440,44" fill="none" stroke={GOLD} strokeWidth="3" />
      </svg>

      {/* And again at the foot, mirrored, so the section reads as one panel
          rather than a band that happens to stop. */}
      <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none"
        className="absolute bottom-0 inset-x-0 w-full pointer-events-none" style={{ height: 74 }}>
        <path d="M0,120 H1440 V60 C1180,10 950,96 700,58 C470,22 220,92 0,52 Z" fill={ROYAL} />
        <path d="M0,52 C220,92 470,22 700,58 C950,96 1180,10 1440,60" fill="none" stroke={GOLD} strokeWidth="3" />
      </svg>

      {/* The church holds the left edge, the slippers the right — the same
          arrangement as the banner artwork, and it leaves the middle clear
          for the cards. Hidden below lg: at phone width there is no margin
          for scenery, only content. */}
      <Motif className="left-2 xl:left-8" style={{ top: 96, width: 210, opacity: 0.13 }}>
        <Church stroke={GOLD} className="w-full h-auto" />
      </Motif>
      <Motif className="right-4 xl:right-12" style={{ top: 128, width: 210, opacity: 0.12 }}>
        <Tsinelas stroke={GOLD} className="w-full h-auto" />
      </Motif>
      <Motif className="left-7" style={{ bottom: 118, width: 118, opacity: 0.1 }}>
        <Sampaguita stroke={GOLD} className="w-full h-auto" />
      </Motif>
      <Motif className="right-10" style={{ bottom: 104, width: 146, opacity: 0.11 }}>
        <Sampaguita stroke={GOLD} className="w-full h-auto" />
      </Motif>

      {/* The flowing line across the lower half, tying the two corners
          together the way the artwork does. */}
      <svg aria-hidden viewBox="0 0 1440 200" preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-16 w-full pointer-events-none" style={{ height: 150 }}>
        <path d="M-20,150 C300,60 560,190 820,120 C1060,56 1240,150 1460,96"
          fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
        <path d="M-20,168 C300,80 560,208 820,140 C1060,76 1240,168 1460,116"
          fill="none" stroke={ROYAL} strokeWidth="1" opacity="0.16" />
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
