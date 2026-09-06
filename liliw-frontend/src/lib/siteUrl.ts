/**
 * Where this deployment lives.
 *
 * Seven places each carried their own copy of
 *
 *   process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'
 *
 * and that fallback outlived the domain it named. The site now answers on
 * visitliliw.vercel.app; the old host only still works because Vercel 307s it
 * across. Password-reset links, registration codes and printed QR posters were
 * all riding that redirect, and a printed poster cannot be re-pointed once the
 * redirect goes away.
 *
 * So the host is derived rather than remembered. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL to the project's production domain on every
 * build and every request, which is exactly what an email link wants — a
 * preview deployment should still send people to the real site, not to itself.
 * NEXT_PUBLIC_SITE_URL still wins when set, so a custom domain needs no code
 * change.
 */

const strip = (u: string) => u.replace(/\/+$/, '');

/** Server-side absolute origin: emails, QR payloads, anything rendered ahead of a browser. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return strip(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return strip(vercel.startsWith('http') ? vercel : `https://${vercel}`);

  return 'http://localhost:3000';
}

/**
 * The same thing in a browser, where the address bar is the truth — a QR code
 * generated on the page a visitor is looking at should point back at the host
 * they are already on, not at whatever was compiled in.
 */
export function browserSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return strip(window.location.origin);
  return siteUrl();
}
