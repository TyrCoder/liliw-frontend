import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SearchProvider from "@/components/SearchProvider";
import AIChat from "@/components/AIChat";
import PWAHandler from "@/components/PWAHandler";
import AnalyticsInit from "@/components/AnalyticsInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liliw Tourism - Discover the Beauty",
  description: "Explore heritage sites, tourist attractions, and cultural experiences in Liliw, Laguna. Book tours, discover local artisans, and immerse yourself in authentic Filipino culture.",
  keywords: "Liliw, tourism, heritage, attractions, tours, Laguna, Philippines, travel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Liliw Tourism",
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: "#00BFB3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Liliw" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00BFB3" />
      </head>
      <body className="min-h-full flex flex-col">
        <PWAHandler />
        <SearchProvider />
        <AnalyticsInit />
        <Navbar />
        {children}
        <Footer />
        <AIChat />
      </body>
    </html>
  );
}
