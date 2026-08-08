'use client';

import { facebookEmbedSrc } from '@/lib/facebook';

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

  return (
    <div className="rounded-xl overflow-hidden bg-black"
      style={{ border: '1px solid rgba(15,95,181,0.15)' }}>
      {/* 16:9 box the frame fills, so the player scales with the column
          instead of the plugin's fixed 560px. */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
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
