'use client';

import Link from 'next/link';
import { Monitor, ChevronLeft, Loader2 } from 'lucide-react';
import { useHandheld } from '@/hooks/useHandheld';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

/**
 * Keeps the staff consoles on a desktop.
 *
 * The admin, CMS and business dashboards are built around wide tables —
 * visitor records by month and origin, audit logs, the CMS entry lists. On a
 * phone those either scroll sideways for a screen and a half or collapse into
 * something you cannot act on, and approving content or reading a month's
 * figures through that is how mistakes get made.
 *
 * This is a usability gate, not a security control. Every route behind it is
 * still authorised server-side on every request — someone determined to reach
 * the markup on a phone gains nothing, because the endpoints check the role
 * themselves.
 *
 * The children are not mounted at all when it blocks, so their hooks never run
 * and none of their data is fetched.
 */
export default function DesktopOnly({ children }: { children: React.ReactNode }) {
  const handheld = useHandheld();

  // Undetermined on the first paint — the check needs a browser. Showing the
  // dashboard and then yanking it away, or the reverse, reads as a fault.
  if (handheld === null) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: '#F8FAFC' }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!handheld) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center px-5" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-5"
             style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
          <Monitor className="w-8 h-8" style={{ color: '#0B3D91' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>
          Open this on a computer
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed" style={{ fontFamily: BL }}>
          The management dashboards use wide tables — visitor records, audit logs, content
          lists — that need a desktop screen to read and act on properly. Everything else on
          the site works on your phone as usual.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
          <ChevronLeft className="w-4 h-4" /> Back to the site
        </Link>
      </div>
    </div>
  );
}
