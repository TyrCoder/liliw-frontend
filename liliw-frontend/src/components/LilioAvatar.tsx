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
 * Where the head sits in the source image, as fractions of its width and
 * height. The artwork is a full-length standing figure on a square canvas, so
 * the head occupies roughly the top third and is centred a little right of the
 * middle — the character leans, and centring on the canvas would clip an ear.
 */
const HEAD = { scale: 2.6, x: 52, y: 20 };

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
