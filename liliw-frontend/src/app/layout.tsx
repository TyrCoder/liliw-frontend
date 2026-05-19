import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SearchProvider from "@/components/SearchProvider";
import AIChat from "@/components/AIChat";
import PWAHandler from "@/components/PWAHandler";
import AnalyticsInit from "@/components/AnalyticsInit";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { Toaster } from "sonner";

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

export const metadata: Metadata = {
  title: "Liliw Tourism - Discover the Beauty of Laguna",
  description: "Explore heritage sites, tourist attractions, and cultural experiences in Liliw, Laguna. Book tours, discover local artisans, and immerse yourself in authentic Filipino culture.",
  keywords: "Liliw, tourism, heritage, attractions, tours, Laguna, Philippines, travel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Liliw Tourism",
    startupImage: "/icons/icon-512x512.png",
  },
  formatDetection: { telephone: true },
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

        {/* Open Graph for share previews */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Liliw Tourism" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
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
            <Toaster richColors position="bottom-left" closeButton />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
