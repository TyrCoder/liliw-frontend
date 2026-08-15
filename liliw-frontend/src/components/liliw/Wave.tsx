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
  // Quadratics with a reflected control point (T), which is the one reliable
  // way to draw a sine by hand: each hump mirrors the last automatically.
  //
  // The amplitude is where the earlier attempts went wrong. A cubic only
  // travels about a third of the way towards its control points, so control
  // values that looked extreme produced a curve that barely moved. A quadratic
  // reaches (P0 + 2C + P2) / 4 at its midpoint, so a control at y = -25 puts
  // the crest at y = 10 in a 90-tall box. That is a wave you can see.
  const edge = down
    ? 'M0,45 Q360,115 720,45 T1440,45'
    : 'M0,45 Q360,-25 720,45 T1440,45';

  const shape = down
    ? `${edge} L1440,0 L0,0 Z`
    : `${edge} L1440,90 L0,90 Z`;

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
