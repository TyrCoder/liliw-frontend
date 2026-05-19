'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAHandler() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner]       = useState(false);
  const [isIos, setIsIos]                 = useState(false);
  const [isStandalone, setIsStandalone]   = useState(false);

  useEffect(() => {
    // ── Detect platform ────────────────────────────────────────────────────
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches;

    setIsIos(ios);
    setIsStandalone(standalone);

    // ── Register service worker ───────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Watch for updates
          reg.addEventListener('updatefound', () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener('statechange', () => {
              if (next.state === 'installed' && navigator.serviceWorker.controller) {
                toast('A new version is available.', {
                  duration: Infinity,
                  action: {
                    label: 'Reload',
                    onClick: () => {
                      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    },
                  },
                });
              }
            });
          });
        })
        .catch(() => {});

      // Handle SW skip-waiting from another tab
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // ── Online / Offline ──────────────────────────────────────────────────
    const onOnline  = () => toast.success('Back online!');
    const onOffline = () =>
      toast.error('You are offline. Cached pages are still accessible.', { duration: 5000 });

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // ── Install prompt (Chrome / Edge / Samsung / desktop) ────────────────
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => setShowBanner(true), 4000);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setInstallPrompt(null);
      localStorage.setItem('pwa-install-dismissed', '1');
      toast.success('App installed! Open it from your home screen.');
    });

    // ── iOS: show "Add to Home Screen" hint ───────────────────────────────
    if (ios && !standalone && !localStorage.getItem('pwa-ios-dismissed')) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem(isIos ? 'pwa-ios-dismissed' : 'pwa-install-dismissed', '1');
  };

  // Already installed or banner hidden — render nothing
  if (!showBanner || isStandalone) return null;

  // ── iOS "Add to Home Screen" banner ──────────────────────────────────────
  if (isIos) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-[9990] max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-300"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-96x96.png" alt="Liliw" className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#0B3D91' }}>Install Liliw Tourism</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Tap the <span className="font-semibold">Share</span> button&nbsp;
                <span aria-label="share icon">⬆️</span> then&nbsp;
                <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-300 hover:text-gray-500 transition shrink-0 p-1 -mt-1 -mr-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chrome / Edge / desktop install banner ────────────────────────────────
  if (!installPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9990] max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-300"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
    >
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-96x96.png" alt="Liliw" className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#0B3D91' }}>Install Liliw Tourism</p>
            <p className="text-xs text-gray-500 mt-0.5">Works offline · Faster · Home screen shortcut</p>
          </div>
          <button
            onClick={dismiss}
            className="text-gray-300 hover:text-gray-500 transition shrink-0 p-1 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90"
            style={{ background: '#0B3D91', color: '#F5C518' }}
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
