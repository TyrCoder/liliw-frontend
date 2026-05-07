'use client';

import { useEffect, useState } from 'react';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    // Already running as installed PWA — don't show banner
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if user already dismissed this session
    if (sessionStorage.getItem('liliw-install-dismissed-session')) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay so the page loads first
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('liliw-install-dismissed-session', '1');
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-9999 sm:left-auto sm:right-4 sm:w-80"
      style={{ animation: 'slideUp 0.35s ease-out' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }}
      >
        {/* Teal accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#00BFB3,#0077A8)' }} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
              style={{ backgroundColor: '#00BFB3' }}
            >
              L
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Install Liliw Tourism</p>
              <p className="text-gray-300 text-xs mt-0.5 leading-snug">
                Add to your home screen for quick access — works offline too!
              </p>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={installing || installed}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 4px 14px rgba(0,191,179,.4)' }}
            >
              {installing ? 'Installing…' : installed ? 'Installed ✓' : 'Install App'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
