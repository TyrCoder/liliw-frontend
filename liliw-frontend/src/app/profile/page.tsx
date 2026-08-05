'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The passport is an overlay, not a page — it opens over whatever you were
 * looking at. This route only survives for links that already point at it
 * (the home page card, the attraction "view your passport" link, bookmarks),
 * and hands off to the booklet on the home page instead of rendering a bare
 * screen behind it. PassportHost picks the parameter up and strips it.
 */
export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const saved = window.location.hash === '#saved';
    router.replace(saved ? '/?passport=saved' : '/?passport=1');
  }, [router]);

  return null;
}
