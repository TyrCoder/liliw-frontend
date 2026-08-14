'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { LiliwScene, GOLD } from './festive';

/**
 * The page header every Liliw Tourism page shares.
 *
 * A page supplies its title, its subtitle and where "back" goes. Everything
 * else — the scene, the blue, the gold, the ornaments, the lettering, the
 * spacing — is fixed, which is what keeps the pages consistent: there is only
 * one of it.
 */
export default function PageBanner({
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back to Home',
}: {
  title: string;
  subtitle?: string;
  backHref?: string | null;
  backLabel?: string;
}) {
  return (
    <LiliwScene title={title} subtitle={subtitle}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-75 mb-6"
          style={{ color: GOLD, fontFamily: 'var(--font-heading), Outfit, sans-serif' }}
        >
          <ChevronLeft className="w-4 h-4" /> {backLabel}
        </Link>
      )}
    </LiliwScene>
  );
}
