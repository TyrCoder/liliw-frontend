import type { NextConfig } from "next";

/**
 * The one Next config.
 *
 * There were two — next.config.js and next.config.ts — and Next resolves .js
 * first, so everything in the .ts file had never once been loaded. Production
 * was serving no security headers at all, which is how a config carrying five
 * of them sat in the repo looking done. Merged here, .js deleted, so what the
 * file says is what the site sends.
 *
 * The headers needed correcting before they could be turned on, because as
 * written they would have broken the site rather than hardened it:
 *
 *   camera=()       switches off the QR scanner — /scan is the whole check-in
 *                   flow, and it needs getUserMedia
 *   geolocation=()  switches off "near me" on /scan, /itineraries and the
 *                   attraction pages
 *   connect-src     omitted Supabase, and src/lib/supabase.ts runs in the
 *                   browser, so every page would have failed to load its data
 *
 * The CSP is therefore derived from the origins this app actually contacts,
 * listed below with the reason each one is there.
 */

const CSP = [
  "default-src 'self'",
  // Next's runtime needs eval for its chunk loader, and inline for the flight
  // payload it embeds in the HTML.
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // blob: is Mapbox GL, which compiles its worker at runtime.
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  [
    "img-src 'self' data: blob:",
    "https://res.cloudinary.com",              // every uploaded photo
    "https://*.tiles.mapbox.com https://api.mapbox.com",
    "https://*.tile.openstreetmap.org",
    "https://api.qrserver.com",                // printed QR posters
    "https://img.youtube.com",                 // story video thumbnails
  ].join(' '),
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co", // the browser client
    "https://api.cloudinary.com https://res.cloudinary.com",
    "https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com",
    "https://nominatim.openstreetmap.org",     // address lookup
    "https://api.apify.com",                   // external review scraping
  ].join(' '),
  // Story pages embed YouTube.
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // self, not (): the scanner and the "near me" sorting are features, not
  // leaks. Third-party frames still get nothing.
  { key: 'Permissions-Policy',     value: 'camera=(self), microphone=(), geolocation=(self)' },
  // Report-only for now. The four headers above cannot break a page; a CSP
  // can, and this one has never run against a real browser. Load the site,
  // check the console for violations, and once it is quiet rename this key to
  // Content-Security-Policy to start enforcing.
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  transpilePackages: ['mapbox-gl', 'react-map-gl', '@mapbox/mapbox-gl-draw'],
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.123.36'],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  // Nothing uses next/image today, so these only matter if something starts to.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "http",  hostname: "localhost", pathname: "/**" },
    ],
  },
};

export default nextConfig;
