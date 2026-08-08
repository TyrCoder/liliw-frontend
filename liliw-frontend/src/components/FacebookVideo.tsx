'use client';

import { facebookEmbedSrc, isFacebookReel } from '@/lib/facebook';

/**
 * A Facebook video, played in place.
 *
 * Deliberately the iframe plugin rather than Facebook's SDK: no third-party
 * script is added to the page, so nothing of theirs can read the DOM or the
 * visitor's session here. Renders nothing at all if the URL is not one we
 * allow, so a bad paste degrades to silence rather than a broken frame.
 */
export default function FacebookVideo({ url, title }: { url: string; title?: string }) {
  const src = facebookEmbedSrc(url);
  if (!src) return null;

  // A reel is shot vertically; giving it a 16:9 frame pillarboxes the picture
  // into a sliver and the player just looks black. Narrow and tall for reels,
  // widescreen for everything else.
  const reel = isFacebookReel(url);

  return (
    <div
      className="rounded-xl overflow-hidden bg-black mx-auto"
      style={{
        border: '1px solid rgba(15,95,181,0.15)',
        // Capped so a vertical video does not tower over the article it sits in.
        maxWidth: reel ? 340 : '100%',
      }}>
      <div className="relative w-full" style={{ paddingTop: reel ? '177.78%' : '56.25%' }}>
        <iframe
          src={src}
          title={title ? `${title} — Facebook video` : 'Facebook video'}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          // Grants only what a video player needs. Without this the frame
          // inherits far more than it should.
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    </div>
  );
}
