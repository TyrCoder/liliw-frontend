'use client';

/**
 * Lilio, the guide — as a round avatar.
 *
 * One artwork serves both places it appears. `crop="head"` scales the image up
 * and pushes it down inside the circle so only the head shows, which is what a
 * 32px button needs: the full figure at that size is a smudge with a hat on.
 * `crop="full"` fits the whole character, for the larger header.
 *
 * Cropping in CSS rather than shipping a second cut-out file keeps the two in
 * step — a redrawn character replaces one image and both views follow.
 */

const SRC = '/images/lilio.png';

/**
 * Where the head sits in the source image.
 *
 * Measured from the artwork rather than eyeballed: the figure occupies
 * x 116-398, y 19-488 of the 512px square, which puts the head's centre at
 * 50.2% / 18.4% and makes it 55% of the canvas wide. Filling the circle with
 * it works out at about 1.67x — not the 2.6x first guessed, which would have
 * zoomed past the hat into his face. Backed off to 1.45x with the origin a
 * little lower, because a circular mask bites hardest at top centre and 1.67x
 * left the crown of the hat sitting on the edge.
 *
 * Re-measure if the artwork is redrawn; a differently framed figure moves all
 * three numbers.
 */
const HEAD = { scale: 1.45, x: 50, y: 22 };

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
        backgroundColor: '#EAF2FD',
        boxShadow: ring ? 'inset 0 0 0 1.5px rgba(255,255,255,0.55)' : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC}
        alt="Lilio, your Liliw guide"
        draggable={false}
        className="w-full h-full select-none"
        style={
          crop === 'head'
            ? {
                objectFit: 'cover',
                objectPosition: `${HEAD.x}% ${HEAD.y}%`,
                transform: `scale(${HEAD.scale})`,
                transformOrigin: `${HEAD.x}% ${HEAD.y}%`,
              }
            : { objectFit: 'contain' }
        }
      />
    </span>
  );
}
