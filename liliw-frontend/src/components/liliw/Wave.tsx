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
  height = 90,
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
  //
  // Two cubic segments with real amplitude — roughly a third of the box either
  // side of centre. The first version undulated by a few units across 1440 and
  // came out looking like a slightly crooked straight line, which is worse
  // than no wave at all.
  const shape = down
    ? 'M0,0 H1440 V34 C1180,96 940,4 660,40 C420,71 200,20 0,52 Z'
    : 'M0,90 H1440 V56 C1180,-6 940,86 660,50 C420,19 200,70 0,38 Z';

  const edge = down
    ? 'M0,52 C200,20 420,71 660,40 C940,4 1180,96 1440,34'
    : 'M0,38 C200,70 420,19 660,50 C940,86 1180,-6 1440,56';

  return (
    <div
      aria-hidden
      className={className}
      style={{ lineHeight: 0, backgroundColor: from ?? 'transparent' }}
    >
      <svg
        viewBox="0 0 1440 90"
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
