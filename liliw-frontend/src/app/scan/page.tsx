'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsQR from 'jsqr';
import {
  QrCode, Camera, CameraOff, Loader2, CheckCircle, AlertCircle,
  MapPin, Smartphone, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHandheld } from '@/hooks/useHandheld';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

type Phase = 'idle' | 'starting' | 'scanning' | 'checking' | 'done' | 'error';

/** Downscale before decoding — see the note in tick(). */
const DECODE_WIDTH = 640;
const DECODE_INTERVAL_MS = 100;

/**
 * Browsers embedded inside another app — Facebook, Messenger, Instagram.
 *
 * They matter here because the tourism office's audience arrives from the
 * Facebook page, and tapping a link there opens this inside Facebook's own
 * browser, where getUserMedia is unreliable and on some iOS versions simply
 * denied. Detected so the person is told to open it in Safari rather than
 * being left tapping a button that does nothing.
 */
function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|MicroMessenger/i.test(ua);
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Pulls the attraction id out of a scanned poster URL.
 *
 * Only our own posters count. Anything else — a random QR on a wall, a rival
 * link, a crafted URL pointing somewhere off-site — is rejected here rather
 * than followed, so the scanner can never be used to bounce someone to an
 * arbitrary destination.
 */
function attractionIdFrom(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw, window.location.origin);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  const m = url.pathname.match(/^\/attractions\/([^/?#]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Location, or nothing — a refusal must not block the scan. */
function getPosition(): Promise<GeolocationPosition | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve(p),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  });
}

export default function ScanPage() {
  const { user, token } = useAuth();
  const handheld = useHandheld();
  const router = useRouter();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);
  // A decode can fire on several frames before the camera stops; without this
  // the check-in would post more than once for a single scan.
  const claimedRef = useRef(false);
  const lastDecodeRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ alreadyVisited: boolean; verified: boolean } | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Releasing the camera on unmount matters more than usual here: a live
  // stream left running keeps the phone's camera light on after the user has
  // navigated away, which reads as the app spying on them.
  useEffect(() => stopCamera, [stopCamera]);

  const checkIn = useCallback(async (attractionId: string) => {
    setPhase('checking');
    stopCamera();

    const pos = await getPosition();
    try {
      const res = await fetch('/api/attractions/visit/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          attractionId,
          via: 'qr',
          lat: pos?.coords.latitude ?? null,
          lng: pos?.coords.longitude ?? null,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not record your visit');

      // The route answers {authenticated:false} for a guest rather than an
      // error. Reporting that as a successful check-in would promise a stamp
      // nobody is going to receive.
      if (d.authenticated === false) {
        setError('Sign in first — a scan can only be added to a passport you are signed in to.');
        setPhase('error');
        return;
      }

      setResult({
        alreadyVisited: !!d.alreadyVisited,
        verified: d.verified === true,
      });
      setPhase('done');

      // Straight to the place they are standing in front of, which is what
      // they scanned the poster for.
      setTimeout(() => router.push(`/attractions/${attractionId}`), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your visit');
      setPhase('error');
    }
  }, [token, router, stopCamera]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || claimedRef.current) return;

    // Decoding every frame at full sensor resolution pins the CPU and cooks
    // the phone — on an iPhone the rear camera hands back 1920×1080, which is
    // two million pixels to scan sixty times a second for a code that only
    // needs a few hundred across. Ten times a second at 640px wide finds a
    // poster just as fast and leaves the device cool.
    const now = performance.now();
    if (now - lastDecodeRef.current >= DECODE_INTERVAL_MS &&
        video.readyState === video.HAVE_ENOUGH_DATA) {
      lastDecodeRef.current = now;
      const vw = video.videoWidth, vh = video.videoHeight;
      if (vw && vh) {
        const scale = Math.min(1, DECODE_WIDTH / vw);
        const w = Math.round(vw * scale), h = Math.round(vh * scale);
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            const id = attractionIdFrom(code.data);
            if (id) {
              claimedRef.current = true;
              checkIn(id);
              return;
            }
            // A QR that is not one of ours: say so rather than sitting there
            // looking like the camera is broken.
            setError('That is not a Liliw attraction poster. Try another code.');
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [checkIn]);

  const start = useCallback(async () => {
    setError('');
    setPhase('starting');
    claimedRef.current = false;
    try {
      // Absent on an insecure origin and inside some embedded browsers. Saying
      // "the camera could not be started" there sends people to check their
      // camera permissions, which is not the problem.
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(isInAppBrowser()
          ? `This is running inside another app's browser, which blocks the camera. Tap the ⋯ menu and choose “Open in ${isIOS() ? 'Safari' : 'Browser'}”.`
          : 'This browser cannot open a camera. Try Safari or Chrome.');
        setPhase('error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera is the one pointed at a poster.
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS refuses to play inline without this being set before play().
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setPhase('scanning');
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as DOMException)?.name;
      setError(
        name === 'NotAllowedError'
          ? isInAppBrowser()
            // Facebook's browser reports a refusal identically to a real one,
            // so the advice has to differ by where you are, not by the error.
            ? 'Facebook’s built-in browser blocks the camera. Tap the ⋯ menu and choose “Open in Safari”.'
            : isIOS()
              ? 'Camera access was blocked. Settings › Safari › Camera › Allow, then reload this page.'
              : 'Camera access was blocked. Allow the camera in your browser settings and try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : name === 'NotReadableError'
              ? 'Another app is using the camera. Close it and try again.'
              : 'The camera could not be started.',
      );
      setPhase('error');
    }
  }, [tick]);

  /* ── Desktop ─────────────────────────────────────────────── */
  if (handheld === null) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: '#F9F6F0' }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!handheld) {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ backgroundColor: '#F9F6F0' }}>
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-5"
               style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
            <Smartphone className="w-8 h-8" style={{ color: '#0B3D91' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>
            Open this on your phone
          </h1>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: BL }}>
            Scanning a poster means standing in front of it, so the scanner runs on phones
            and tablets only. Open <strong>liliw</strong> on your phone and tap the
            QR button in the header.
          </p>
          <Link href="/attractions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
            <MapPin className="w-4 h-4" /> Browse attractions instead
          </Link>
        </div>
      </div>
    );
  }

  /* ── Handheld ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B1220' }}>
      <div className="px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 rounded-lg text-white/70 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: HL }}>Scan a poster</h1>
          <p className="text-white/50 text-xs" style={{ fontFamily: BL }}>Point at the QR code on an attraction poster</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Camera */}
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted
            className={`w-full h-full object-cover ${phase === 'scanning' ? '' : 'opacity-0'}`} />
          <canvas ref={canvasRef} className="hidden" />

          {/* Reticle */}
          {phase === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 rounded-2xl border-2 border-white/70" />
              <div className="absolute inset-x-8 top-8 h-0.5 animate-pulse" style={{ backgroundColor: '#F5C518' }} />
            </div>
          )}

          {phase !== 'scanning' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              {phase === 'idle' && (
                <div>
                  <QrCode className="w-14 h-14 text-white/25 mx-auto mb-4" />
                  <p className="text-white/60 text-sm" style={{ fontFamily: BL }}>
                    The camera opens when you start scanning.
                  </p>
                </div>
              )}
              {phase === 'starting' && <Loader2 className="w-8 h-8 animate-spin text-white/50" />}
              {phase === 'checking' && (
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-white/70 mx-auto mb-3" />
                  <p className="text-white/70 text-sm" style={{ fontFamily: BL }}>Recording your visit…</p>
                </div>
              )}
              {phase === 'done' && result && (
                <div>
                  <CheckCircle className="w-14 h-14 mx-auto mb-3" style={{ color: '#22C55E' }} />
                  <p className="text-white font-bold" style={{ fontFamily: HL }}>
                    {result.alreadyVisited ? 'Already stamped' : 'Checked in!'}
                  </p>
                  <p className="text-white/60 text-sm mt-1" style={{ fontFamily: BL }}>
                    {result.alreadyVisited
                      ? 'This place is already in your passport.'
                      : result.verified
                        ? 'Verified on-site. Taking you there…'
                        : 'Recorded. Taking you there…'}
                  </p>
                </div>
              )}
              {phase === 'error' && (
                <div>
                  <CameraOff className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 text-sm" style={{ fontFamily: BL }}>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* A scan awards nothing to a guest, so say that before they walk to a
            poster and find out afterwards. */}
        {!user && (
          <div className="mt-5 w-full max-w-sm flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
               style={{ backgroundColor: 'rgba(245,197,24,0.12)', color: '#F5C518', fontFamily: BL }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You are not signed in, so this scan will not be added to your passport.{' '}
              <Link href="/login" className="underline font-semibold">Sign in first</Link>.
            </span>
          </div>
        )}

        {phase !== 'scanning' && phase !== 'checking' && phase !== 'done' && (
          <button onClick={start}
            className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
            <Camera className="w-4 h-4" />
            {phase === 'error' ? 'Try again' : 'Start scanning'}
          </button>
        )}

        {phase === 'scanning' && (
          <>
            {error && (
              <p className="mt-4 text-center text-xs" style={{ color: '#FCA5A5', fontFamily: BL }}>{error}</p>
            )}
            <button onClick={() => { stopCamera(); setPhase('idle'); }}
              className="mt-5 text-sm font-semibold text-white/60 hover:text-white">
              Stop
            </button>
          </>
        )}

        <p className="mt-6 text-center text-white/35 text-xs max-w-xs" style={{ fontFamily: BL }}>
          Visits count only when scanned here, in the app, while you are at the place.
        </p>
      </div>
    </div>
  );
}
