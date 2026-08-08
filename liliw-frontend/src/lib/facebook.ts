/**
 * Facebook video embedding.
 *
 * Uses Facebook's video plugin, which is a plain iframe — no SDK, so their
 * JavaScript never runs on our pages and cannot read anything on them. The
 * iframe itself is still served by Facebook, so they do see that a visitor
 * loaded it; that is unavoidable for any embed and worth knowing.
 *
 * Only these hosts are ever turned into an iframe. The src is built here from
 * a URL that has been parsed and checked, never by pasting a string into the
 * middle of a URL — which is what would let someone point the frame elsewhere.
 */
const ALLOWED_HOSTS = new Set([
  'facebook.com', 'www.facebook.com', 'm.facebook.com',
  'web.facebook.com', 'fb.watch', 'www.fb.watch',
]);

/** A Facebook URL we are willing to embed, or null. */
export function normaliseFacebookUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return null;
    if (!ALLOWED_HOSTS.has(u.hostname.toLowerCase())) return null;
    // Tracking parameters change the URL without changing the video, which
    // would otherwise render the same clip twice.
    u.hash = '';
    ['fbclid', 'mibextid', 'rdid', 'ref', 'refsrc', '_rdr'].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return null;
  }
}

/** The plugin URL that renders a given post as a player. */
export function facebookEmbedSrc(url: string, opts?: { showText?: boolean }): string | null {
  const clean = normaliseFacebookUrl(url);
  if (!clean) return null;
  const params = new URLSearchParams({
    href: clean,
    show_text: opts?.showText ? 'true' : 'false',
    // The plugin sizes itself to this; the wrapper scales it responsively.
    width: '560',
    appId: '',
  });
  params.delete('appId');
  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}

/**
 * Pulls Facebook links out of a block of text.
 *
 * Editors paste a link into the article rather than filling a dedicated field,
 * so the body is where these live. Returns the embeddable URLs and the text
 * with them removed, so a raw link is not left sitting above its own player.
 */
export function extractFacebookVideos(text: string): { urls: string[]; rest: string } {
  if (!text) return { urls: [], rest: '' };
  const found: string[] = [];
  const rest = text.replace(/https?:\/\/[^\s<>"')]+/gi, match => {
    const clean = normaliseFacebookUrl(match);
    // Only links that look like a video are worth turning into a player; a
    // link to the page itself should stay a link.
    if (clean && /\/(videos?|watch|reel|share\/v)\//i.test(clean)) {
      if (!found.includes(clean)) found.push(clean);
      return '';
    }
    return match;
  });
  return { urls: found, rest: rest.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim() };
}
