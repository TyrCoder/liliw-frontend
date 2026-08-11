'use client';

import { useEffect, useState } from 'react';

/**
 * Whether this is a phone or tablet that could plausibly scan a poster.
 *
 * Deliberately not a width check: a narrow desktop window is not a phone, and
 * a tablet in landscape is wider than some laptops. What actually matters is
 * a touch screen with a camera — which is also the honest test for whether
 * "hold your phone up to the poster" is advice the person can follow.
 *
 * Returns null until it has run, so a component can wait rather than flashing
 * the wrong branch: on the server there is no navigator, and rendering the
 * desktop message first and correcting it a frame later reads as a glitch.
 */
export function useHandheld(): boolean | null {
  const [handheld, setHandheld] = useState<boolean | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const touch = navigator.maxTouchPoints > 0;
    const hasCamera = !!navigator.mediaDevices?.getUserMedia;
    // iPadOS reports itself as a Mac, so the touch count is what gives it away.
    const iPadAsMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    setHandheld((coarse && touch && hasCamera) || iPadAsMac);
  }, []);

  return handheld;
}
