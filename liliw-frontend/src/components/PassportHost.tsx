'use client';

import { useEffect, useState } from 'react';
import Passport, { PASSPORT_TRIPS_PAGE } from '@/components/Passport';

export const PASSPORT_EVENT = 'liliw-open-passport';

/** Open the passport over whatever page the visitor is on. */
export function openPassport(page = 0) {
  window.dispatchEvent(new CustomEvent(PASSPORT_EVENT, { detail: { page } }));
}

/**
 * Mounted once in the root layout. The booklet is only rendered while open, so
 * it costs nothing — and none of its four requests fire — until someone asks
 * for it.
 */
export default function PassportHost() {
  const [page, setPage] = useState<number | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => setPage((e as CustomEvent).detail?.page ?? 0);
    window.addEventListener(PASSPORT_EVENT, onOpen);
    return () => window.removeEventListener(PASSPORT_EVENT, onOpen);
  }, []);

  // /profile redirects here with ?passport= so old links and shared URLs still
  // land on the booklet instead of a bare page. The parameter is stripped
  // straight away so it does not linger in the address bar or get shared on.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const want = params.get('passport');
    if (!want) return;
    setPage(want === 'saved' ? PASSPORT_TRIPS_PAGE : 0);
    params.delete('passport');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  if (page === null) return null;
  return <Passport initialPage={page} onClose={() => setPage(null)} />;
}
