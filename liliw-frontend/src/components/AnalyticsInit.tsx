'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics-tracker';

export default function AnalyticsInit() {
  const pathname = usePathname();
  const lastPath = useRef('');

  useEffect(() => {
    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);

  // Heartbeat every 30s so users stay visible in Live on Site while on the same page
  useEffect(() => {
    const id = setInterval(() => {
      trackPageView(window.location.pathname);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
