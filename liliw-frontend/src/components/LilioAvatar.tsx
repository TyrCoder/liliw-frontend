'use client';

/**
 * Lilio, the guide — as a round avatar.
 *
 * Two artworks, because a head drawn as a head beats a head cropped out of a
 * full figure: the standing pose put an arm and a shoulder inside the circle
 * at small sizes, and no amount of scaling fixed that.
 *
 *   head — the cut-out, for buttons and message bubbles
 *   full — the whole character, where there is room for him
 */

const SRC = {
  head: '/images/lilio-head.png',
  full: '/images/lilio.png',
};

/**
 * The head fills 94% of its canvas and sits 4% high, measured from the file.
 * A circle inscribed in that square would therefore shave the hat brim, so it
 * is scaled to 86% and nudged down — checked by rendering it through a real
 * circular mask rather than judged from the square.
 */
const HEAD_FIT = 'scale(0.86) translateY(3%)';

export default function LilioAvatar({
  size = 36,
  crop = 'head',
  className = '',
  ring = false,
}: {
  size?: number;
  crop?: 'head' | 'full';
  className?: string;
  /** A hairline edge, for placing the avatar on a coloured header. */
  ring?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#FFFFFF',
        boxShadow: ring ? 'inset 0 0 0 1.5px rgba(255,255,255,0.55)' : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC[crop]}
        alt="Lilio, your Liliw guide"
        draggable={false}
        className="w-full h-full select-none object-contain"
        style={crop === 'head' ? { transform: HEAD_FIT } : undefined}
      />
    </span>
  );
}
