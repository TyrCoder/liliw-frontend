import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SearchProvider from "@/components/SearchProvider";
import AIChat from "@/components/AIChat";
import PWAHandler from "@/components/PWAHandler";
import AnalyticsInit from "@/components/AnalyticsInit";
import PassportHost from "@/components/PassportHost";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { Toaster } from "sonner";
import { siteUrl } from '@/lib/siteUrl';

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE = siteUrl();
const SITE_TITLE = "Liliw Tourism - Discover the Beauty of Laguna";
const SITE_DESCRIPTION = "Explore heritage sites, tourist attractions, and cultural experiences in Liliw, Laguna. Book tours, discover local artisans, and immerse yourself in authentic Filipino culture.";

export const metadata: Metadata = {
  /*
   * The one thing that was missing and broke everything downstream of it.
   * Without a base, a relative openGraph image (the icon below, and every
   * per-page image a route's own generateMetadata supplies) has no absolute
   * URL to resolve against — Next emits it as written, "/icons/…", which is
   * not a valid Open Graph image and not something Messenger, Facebook, or
   * any link-preview crawler can fetch. Setting this here fixes it site-wide,
   * for pages that override metadata and pages that never do.
   */
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: "%s | Liliw Tourism" },
  description: SITE_DESCRIPTION,
  keywords: "Liliw, tourism, heritage, attractions, tours, Laguna, Philippines, travel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Liliw Tourism",
    startupImage: "/icons/icon-512x512.png",
  },
  formatDetection: { telephone: true },
  /*
   * Every dynamic page — an attraction, a story, a community event — was
   * serving this exact block and nothing else, because none of them ever
   * called generateMetadata. A visitor sharing a specific place's link sent
   * their friend a card titled "Liliw Tourism", not the place; some
   * link-preview clients resolve the shared card through this data rather
   * than the raw URL, which is what made a shared attraction open the
   * homepage instead of itself. The three dynamic routes now generate their
   * own openGraph block; this is the fallback for everything else, and it is
   * a real fallback now rather than the only answer the whole site had.
   */
  openGraph: {
    type: "website",
    siteName: "Liliw Tourism",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    /*
     * Absolute, built by hand rather than left relative for metadataBase to
     * resolve. metadataBase does resolve openGraph.url correctly (verified —
     * a page's relative url comes back with the domain attached), but not
     * this images array in the installed Next version: left as "/icons/…" it
     * rendered exactly that, with no domain, on every page including the
     * homepage. A crawler cannot fetch a path with no host.
     */
    images: [{ url: `${SITE}/icons/icon-512x512.png`, width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE}/icons/icon-512x512.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: "#0B3D91",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        {/* PWA core */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B3D91" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="48x48"  href="/icons/icon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96"  href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />

        {/* Apple / iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Liliw" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />

        {/* Windows / Edge */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#0B3D91" />
        <meta name="msapplication-config" content="none" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/*
         * Open Graph used to be hand-written here as three raw <meta> tags,
         * separate from and unaware of the `metadata` export above — so
         * og:type and og:site_name silently duplicated what the export
         * already declared, and og:image duplicated it with a *relative*
         * path that could never resolve, sitting first in the document
         * ahead of whichever page's real, absolute image the export
         * produced. A crawler that takes the first og:image tag it finds
         * took the broken one. Removed: the metadata export is the one
         * source of Open Graph data for every page now, root and dynamic
         * routes alike.
         */}
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden" style={{ backgroundColor: '#F9F6F0', color: '#1A1A2E' }}>
        <AuthProvider>
          <FavoritesProvider>
            <PWAHandler />
            <SearchProvider />
            <AnalyticsInit />
            <Navbar />
            {children}
            <Footer />
            <AIChat />
            <PassportHost />
            <Toaster richColors position="bottom-left" closeButton />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
