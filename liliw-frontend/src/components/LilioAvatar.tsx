'use client';

/**
 * Lilio, the guide.
 *
 * Both artworks have transparent backgrounds, so he sits directly on whatever
 * is behind him — the blue button, the chat header, a white bubble — rather
 * than inside a disc of his own. The white keyline is part of the drawing and
 * does the same job a border would, without boxing him in.
 *
 * The backgrounds were cut by flood-filling from the edges rather than by
 * thresholding white, which would also have erased the flower's petals and the
 * white of his eyes: those are the same colour, and what distinguishes them is
 * being enclosed by his outline rather than connected to the border.
 *
 * The -v2 suffix is a cache buster, not a version scheme. The first upload
 * had a white background; replacing the bytes at the same URL left browsers
 * and the CDN serving the old opaque copy, so the head kept appearing inside
 * a white disc long after the file was fixed. A new name is the only reliable
 * way to retire a cached image.
 *
 *   head — the drawn cut-out, for buttons and message bubbles
 *   full — the whole character, where there is room for him
 */

const SRC = {
  head: '/images/lilio-head-v2.png',
  full: '/images/lilio-v2.png',
};

export default function LilioAvatar({
  size = 36,
  crop = 'head',
  className = '',
}: {
  size?: number;
  crop?: 'head' | 'full';
  className?: string;
}) {
  return (
    // object-contain, so he keeps his proportions whatever box he is given.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[crop]}
      alt="Lilio, your Liliw guide"
      draggable={false}
      width={size}
      height={size}
      className={`select-none object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
