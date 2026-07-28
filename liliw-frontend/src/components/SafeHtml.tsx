'use client';

import DOMPurify from 'isomorphic-dompurify';

// CMS rich-text (attraction descriptions, art forms, itinerary blurbs, stories,
// event programmes) is rendered as real HTML so authored formatting survives.
// That makes every one of those fields an XSS sink: anyone who can write CMS
// content could otherwise persist a <script> or an onerror= payload that runs
// for every visitor. Sanitising here means it is handled once, at the only
// place the raw HTML is injected, and it covers content already in the
// database rather than only what gets saved from now on.

interface Props {
  html: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

export default function SafeHtml({ html, className, style }: Props) {
  const clean = DOMPurify.sanitize(html || '', {
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
  });

  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
