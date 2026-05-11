import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://liliw-strapi-backend.onrender.com https://*.tile.openstreetmap.org",
      "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://liliw-strapi-backend.onrender.com https://*.algolia.net https://*.algolia.io https://nominatim.openstreetmap.org https://api.mapbox.com https://events.mapbox.com",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  transpilePackages: ['mapbox-gl', 'react-map-gl', '@mapbox/mapbox-gl-draw'],
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  images: {
    domains: ["liliw-strapi-backend.onrender.com", "res.cloudinary.com", "localhost"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "liliw-strapi-backend.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
