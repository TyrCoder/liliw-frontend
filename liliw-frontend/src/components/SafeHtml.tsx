'use client';

import { useEffect, useState } from 'react';

// CMS rich-text (attraction descriptions, art forms, itinerary blurbs, stories,
// event programmes) is rendered as real HTML so authored formatting survives.
// That makes every one of those fields an XSS sink: anyone who can write CMS
// content could otherwise persist a <script> or an onerror= payload that runs
// for every visitor. Sanitising here means it is handled once, at the only
// place the raw HTML is injected, and it covers content already in the
// database rather than only what gets saved from now on.
//
// Sanitising happens in the browser, and deliberately so. The isomorphic build
// of DOMPurify reaches for jsdom whenever there is no real DOM, which put jsdom
// in the server graph of all six pages that render CMS HTML. Turbopack leaves
// it external under a hashed alias — require("jsdom-4cccfac9827ebcfe") — and
// that alias does not resolve inside a Vercel serverless function, so every one
// of those pages that is server-rendered on demand answered 500 in production:
// /attractions/[id], /stories/[slug] and /community/events/[slug]. The three
// that are prerendered at build time were fine, because they never required it
// at request time, and /trips/[id] was fine because it renders no CMS HTML.
//
// Nothing is lost by waiting for the browser: every caller renders this only
// once its data has arrived, and that data is fetched client-side, so the
// server had nothing to put here anyway.

interface Props {
  html: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

const CONFIG = {
  // Formatting only — no <script>, <iframe>, <form>, event handlers or
  // javascript: URLs survive this allowlist.
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'span', 'div', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
};

export default function SafeHtml({ html, className, style }: Props) {
  // null until sanitised. Never the raw string: an unsanitised first paint is
  // the whole thing this component exists to prevent.
  const [clean, setClean] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!html) { setClean(''); return; }

    import('dompurify')
      .then(mod => { if (!cancelled) setClean(mod.default.sanitize(html, CONFIG)); })
      // If the sanitiser cannot load, the content does not appear. Showing it
      // unsanitised would be the one outcome worse than showing nothing.
      .catch(() => { if (!cancelled) setClean(''); });

    return () => { cancelled = true; };
  }, [html]);

  if (clean === null) return <div className={className} style={style} />;

  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
