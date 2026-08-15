'use client';

const ROYAL = '#0B3D91';
const GOLD = '#F5C518';

/**
 * A royal-blue wave with a gold hairline, drawn over whatever is behind it.
 *
 * The point of this over the WaveDown/WaveUp pairs copied into sixteen page
 * files: those fill the far side of the curve with an opaque colour — nearly
 * always #ffffff — which paints a white slab over the cream heritage ground.
 * Here only the blue is painted. Everything the curve does not cover stays
 * transparent, so the artwork shows through and the wave reads as a band
 * lying on the page rather than a change of paper.
 *
 *   <Wave />              a blue band above, curving down into the page
 *   <Wave facing="up" />  a blue band below, curving up into the page
 *
 * `from` is for the case where the section above genuinely is blue and the
 * curve has to continue it without a seam.
 */
export default function Wave({
  facing = 'down',
  height = 70,
  from,
  fill,
  className = '',
}: {
  /** 'down' hangs the blue from the top edge; 'up' stands it on the bottom. */
  facing?: 'down' | 'up';
  height?: number;
  /** Solid colour behind the wave, for continuing a coloured section. */
  from?: string;
  /** Overrides the blue — the footer sits on a lighter one. */
  fill?: string;
  className?: string;
}) {
  const down = facing === 'down';

  // The blue mass, and the same curve again as a stroke so the gold rides the
  // edge instead of sitting near it.
  const shape = down
    ? 'M0,0 H1440 V16 C1040,96 760,4 420,44 C260,62 120,52 0,32 Z'
    : 'M0,70 H1440 V54 C1040,-26 760,66 420,26 C260,8 120,18 0,38 Z';

  const edge = down
    ? 'M0,32 C120,52 260,62 420,44 C760,4 1040,96 1440,16'
    : 'M0,38 C120,18 260,8 420,26 C760,66 1040,-26 1440,54';

  return (
    <div
      aria-hidden
      className={className}
      style={{ lineHeight: 0, backgroundColor: from ?? 'transparent' }}
    >
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
      >
        <defs>
          {/* The woven diagonal, inside the blue only — the same motif as the
              banners, at an opacity that reads as texture and not as pattern. */}
          <pattern id={`weave-${facing}-${fill ?? 'royal'}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill={fill ?? ROYAL} />
            <rect width="2" height="14" fill={GOLD} opacity="0.10" />
            <rect width="14" height="2" fill={GOLD} opacity="0.07" />
          </pattern>
        </defs>

        <path d={shape} fill={`url(#weave-${facing}-${fill ?? 'royal'})`} />
        <path d={edge} fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.9" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
