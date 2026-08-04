'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, QrCode } from 'lucide-react';

// A printable check-in poster for a business or spot to display on site.
// Composed on a canvas rather than screenshotting the DOM so the download is a
// clean, fixed-size PNG that prints sharply — the bare QR image on its own gave
// owners nothing they could actually stick on a wall.

const NAVY = '#0B3D91';
const BLUE = '#1565C0';
const GOLD = '#F5C518';

// Poster canvas ~A5 at 150dpi. Big enough to print without pixelating, small
// enough that the PNG stays a couple of hundred KB.
const W = 1240;
const H = 1748;

interface Props {
  /** Public attraction id, i.e. '<type>-<uuid>'. */
  attractionId: string;
  attractionName: string;
}

export default function QRPoster({ attractionId, attractionName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
  // Same ?src=qr contract the check-in route reads — a scan of this poster is
  // what gets distance-verified against the attraction's coordinates.
  const scanUrl = `${baseUrl}/attractions/${attractionId}?src=qr`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=760x760&margin=0&data=${encodeURIComponent(scanUrl)}`;

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const wrap = (text: string, maxWidth: number, maxLines: number) => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = w;
          if (lines.length === maxLines - 1) break;
        } else line = next;
      }
      if (line) lines.push(line);
      return lines.slice(0, maxLines);
    };

    const draw = (qr: HTMLImageElement | null) => {
      if (cancelled) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);

      // Navy header band
      const grad = ctx.createLinearGradient(0, 0, W, 420);
      grad.addColorStop(0, NAVY);
      grad.addColorStop(1, BLUE);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 420);

      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 40px Outfit, system-ui, sans-serif';
      ctx.letterSpacing = '10px';
      ctx.fillText('LILIW TOURISM', W / 2, 130);
      ctx.letterSpacing = '0px';

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 76px Outfit, system-ui, sans-serif';
      ctx.fillText('Scan to Check In', W / 2, 250);

      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '38px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Earn points on your Liliw visit', W / 2, 320);

      // Business name
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 60px Outfit, system-ui, sans-serif';
      const nameLines = wrap(attractionName, W - 160, 2);
      nameLines.forEach((l, i) => ctx.fillText(l, W / 2, 540 + i * 74));

      const qrTop = 540 + nameLines.length * 74 + 60;

      // Gold frame + QR
      const size = 700;
      const x = (W - size) / 2;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 10;
      ctx.strokeRect(x - 26, qrTop - 26, size + 52, size + 52);
      if (qr) {
        ctx.drawImage(qr, x, qrTop, size, size);
      } else {
        // Network blocked the QR service — say so on the poster rather than
        // handing the owner a blank frame they might print anyway.
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('QR unavailable — check your connection', W / 2, qrTop + size / 2);
      }

      // Steps
      let y = qrTop + size + 110;
      ctx.fillStyle = BLUE;
      ctx.font = 'bold 40px Outfit, system-ui, sans-serif';
      ctx.fillText('1.  Open your camera    2.  Scan    3.  Earn points', W / 2, y);

      y += 70;
      ctx.fillStyle = '#6B7280';
      ctx.font = '30px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Allow location so your visit counts as on-site.', W / 2, y);

      // Footer
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, H - 120, W, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '30px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Liliw, Laguna · Culture, History, Arts and Tourism Office', W / 2, H - 60);

      setBusy(false);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous'; // required or the canvas taints and toDataURL throws
    img.onload = () => draw(img);
    img.onerror = () => { if (!cancelled) { setFailed(true); draw(null); } };
    img.src = qrSrc;

    return () => { cancelled = true; };
  }, [attractionName, qrSrc]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `${attractionName.replace(/\s+/g, '-').toLowerCase()}-checkin-poster.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('QR poster download failed:', err);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 p-3">
        <canvas ref={canvasRef} width={W} height={H}
          className="w-full h-auto rounded-lg shadow-sm bg-white" />
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <button onClick={download} disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download poster
        </button>
        <a href={scanUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          style={{ color: BLUE }}>
          <QrCode className="w-4 h-4" /> Test the link
        </a>
      </div>

      {failed && (
        <p className="text-xs text-red-500 mt-2">
          The QR image could not be loaded, so the poster is incomplete. Check your connection and reload before printing.
        </p>
      )}
    </div>
  );
}
