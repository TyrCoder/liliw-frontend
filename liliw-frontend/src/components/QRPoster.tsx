'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileDown, Loader2, QrCode, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

// A printable check-in poster for a business or spot to display on site.
// Composed on a canvas rather than screenshotting the DOM so the download is a
// clean, fixed-size PNG that prints sharply.
//
// The look follows the town's festive blue-and-gold palette: a deep blue field
// with sunburst rays and bunting, over a cream panel carrying the QR. The
// illustrated flourishes are drawn geometrically (pennants, rays, scalloped
// panel edge, corner ornaments) rather than shipped as artwork, so a poster
// renders for any business without needing a designer per spot.

const NAVY = '#0B3D91';
const BLUE = '#1565C0';
const GOLD = '#F5C518';
const CREAM = '#FBF7EC';

// A5 at 150dpi — prints sharp, and the PNG stays a few hundred KB.
const W = 1240;
const H = 1754;

const HEAD = 'Outfit, system-ui, sans-serif';
const BODY = '"Plus Jakarta Sans", system-ui, sans-serif';
const DISPLAY = '"Cormorant Garamond", Georgia, serif';

interface Props {
  /** Public attraction id, i.e. '<type>-<uuid>'. */
  attractionId: string;
  attractionName: string;
}

export default function QRPoster({ attractionId, attractionName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrHostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [dlError, setDlError] = useState('');
  // Bumped by Regenerate to redraw. The code itself is deterministic — the
  // same listing always yields the same QR — so this repaints the poster
  // rather than issuing a different code; see the note by the button.
  const [regen, setRegen] = useState(0);

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
  // Same ?src=qr contract the check-in route reads — a scan of this poster is
  // what gets distance-verified against the attraction's coordinates.
  const scanUrl = `${baseUrl}/attractions/${attractionId}?src=qr`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=0&data=${encodeURIComponent(scanUrl)}`;

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* ── drawing helpers ─────────────────────────────────────────── */

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Rays fanning from behind the title, the way a fiesta backdrop does.
    const sunburst = (cx: number, cy: number, count: number, len: number) => {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const spread = Math.PI / count / 1.7;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - spread) * len, cy + Math.sin(a - spread) * len);
        ctx.lineTo(cx + Math.cos(a + spread) * len, cy + Math.sin(a + spread) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    // Pennant string across the top — the same bunting motif the site uses.
    const bunting = (y: number, count: number) => {
      const step = W / count;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      for (let i = 0; i < count; i++) {
        const x = i * step + step / 2;
        const w = step * 0.46;
        const h = step * 0.62;
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.85)' : GOLD;
        ctx.fill();
      }
    };

    // Cream panel whose top edge scallops, so it reads as a banner rather than
    // a plain rectangle sitting on the blue.
    const scallopedPanel = (x: number, y: number, w: number, h: number) => {
      const bumps = 9;
      const r = w / bumps / 2;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      for (let i = 0; i < bumps; i++) {
        ctx.arc(x + r + i * r * 2, y + r, r, Math.PI, 0, false);
      }
      ctx.lineTo(x + w, y + h - 40);
      ctx.arcTo(x + w, y + h, x + w - 40, y + h, 40);
      ctx.lineTo(x + 40, y + h);
      ctx.arcTo(x, y + h, x, y + h - 40, 40);
      ctx.closePath();
      ctx.fillStyle = CREAM;
      ctx.fill();
    };

    // Small gold diamond used as a divider ornament.
    const diamond = (x: number, y: number, s: number, color = GOLD) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Bracket ornaments at the QR frame corners.
    const cornerTicks = (x: number, y: number, w: number, h: number, len: number) => {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      const corners: [number, number, number, number][] = [
        [x, y + len, x, y], [x, y, x + len, y],
        [x + w - len, y, x + w, y], [x + w, y, x + w, y + len],
        [x, y + h - len, x, y + h], [x, y + h, x + len, y + h],
        [x + w - len, y + h, x + w, y + h], [x + w, y + h - len, x + w, y + h],
      ];
      for (const [x1, y1, x2, y2] of corners) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    };

    const fitText = (text: string, maxWidth: number, start: number, font: (s: number) => string) => {
      let size = start;
      ctx.font = font(size);
      while (ctx.measureText(text).width > maxWidth && size > 24) {
        size -= 2;
        ctx.font = font(size);
      }
      return size;
    };

    /* ── the poster ──────────────────────────────────────────────── */

    const draw = (qr: CanvasImageSource | null) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);

      // Blue field
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, NAVY);
      bg.addColorStop(0.5, BLUE);
      bg.addColorStop(1, NAVY);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      sunburst(W / 2, 300, 26, 1300);
      bunting(64, 9);

      ctx.textAlign = 'center';

      // Kicker
      ctx.fillStyle = GOLD;
      ctx.font = `bold 42px ${HEAD}`;
      ctx.letterSpacing = '12px';
      ctx.fillText('LILIW TOURISM', W / 2 + 6, 320);
      ctx.letterSpacing = '0px';

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold italic 132px ${DISPLAY}`;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillText('Scan to Check In', W / 2, 450);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Sub-pill
      ctx.font = `600 34px ${BODY}`;
      const pillText = 'Earn points on your Liliw visit!';
      const pw = ctx.measureText(pillText).width + 90;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(W / 2 - pw / 2, 490, pw, 74, 37);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pillText, W / 2, 539);

      // Cream panel. Heights below are laid out so the QR frame, the three
      // steps and the location note all sit inside it, clearing the footer.
      const px = 70;
      const py = 616;
      const pWidth = W - px * 2;
      const pHeight = 924;      // panel spans 616 -> 1540; footer starts 1606
      scallopedPanel(px, py, pWidth, pHeight);

      // Business name
      const nameSize = fitText(attractionName, pWidth - 220, 74, s => `bold italic ${s}px ${DISPLAY}`);
      ctx.fillStyle = NAVY;
      ctx.font = `bold italic ${nameSize}px ${DISPLAY}`;
      const nameY = py + 120;
      ctx.fillText(attractionName, W / 2, nameY);

      // Flourish under the name
      const nameW = Math.min(ctx.measureText(attractionName).width, pWidth - 220);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nameW / 2 - 30, nameY + 26);
      ctx.lineTo(W / 2 - 26, nameY + 26);
      ctx.moveTo(W / 2 + 26, nameY + 26);
      ctx.lineTo(W / 2 + nameW / 2 + 30, nameY + 26);
      ctx.stroke();
      diamond(W / 2, nameY + 26, 10);

      // QR, framed
      const size = 480;
      const qx = (W - size) / 2;
      const qy = nameY + 94;          // 830 — clears the flourish at nameY+26
      ctx.fillStyle = '#FFFFFF';
      roundRect(qx - 28, qy - 28, size + 56, size + 56, 32);
      ctx.fill();
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 8;
      ctx.stroke();
      cornerTicks(qx - 42, qy - 42, size + 84, size + 84, 32);

      if (qr) {
        ctx.drawImage(qr, qx, qy, size, size);
      } else {
        // Network blocked the QR service — say so on the poster rather than
        // handing the owner a blank frame they might print anyway.
        ctx.fillStyle = '#9CA3AF';
        ctx.font = `30px ${BODY}`;
        ctx.fillText('QR unavailable — check your connection', W / 2, qy + size / 2);
      }

      // Three steps
      const stepY = qy + size + 115;   // 1425 — inside the panel
      const steps = ['OPEN', 'SCAN', 'EARN'];
      const subs = ['your camera', 'the QR code', 'points'];
      const colW = pWidth / 3;
      steps.forEach((s, i) => {
        const cx = px + colW * i + colW / 2;
        ctx.beginPath();
        ctx.arc(cx - 78, stepY - 10, 30, 0, Math.PI * 2);
        ctx.fillStyle = BLUE;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 30px ${HEAD}`;
        ctx.fillText(String(i + 1), cx - 78, stepY);

        ctx.textAlign = 'left';
        ctx.fillStyle = NAVY;
        ctx.font = `bold 34px ${HEAD}`;
        ctx.fillText(s, cx - 36, stepY - 6);
        ctx.fillStyle = '#64748B';
        ctx.font = `26px ${BODY}`;
        ctx.fillText(subs[i], cx - 36, stepY + 28);
        ctx.textAlign = 'center';

        if (i < 2) {
          ctx.strokeStyle = 'rgba(11,61,145,0.18)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + colW * (i + 1), stepY - 44);
          ctx.lineTo(px + colW * (i + 1), stepY + 34);
          ctx.stroke();
        }
      });

      // Location note
      const noteY = py + pHeight - 40; // 1500 — above the panel's bottom edge
      ctx.fillStyle = BLUE;
      ctx.font = `600 29px ${BODY}`;
      ctx.fillText('Allow location so your visit counts as on-site.', W / 2, noteY);
      const noteW = ctx.measureText('Allow location so your visit counts as on-site.').width;
      diamond(W / 2 - noteW / 2 - 28, noteY - 10, 7, 'rgba(21,101,192,0.45)');
      diamond(W / 2 + noteW / 2 + 28, noteY - 10, 7, 'rgba(21,101,192,0.45)');

      // Footer
      ctx.fillStyle = GOLD;
      ctx.font = `bold italic 70px ${DISPLAY}`;
      ctx.fillText('Liliw', W / 2, H - 148);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `600 26px ${HEAD}`;
      ctx.letterSpacing = '10px';
      ctx.fillText('LAGUNA', W / 2 + 5, H - 106);
      ctx.letterSpacing = '0px';

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 260, H - 78);
      ctx.lineTo(W / 2 + 260, H - 78);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `25px ${BODY}`;
      ctx.fillText('Culture, History, Arts and Tourism Office', W / 2, H - 40);

      setBusy(false);
    };

    // Wait for the webfonts the page already loads, or canvas silently falls
    // back to a default face and the poster prints in the wrong typeface.
    const start = (qr: CanvasImageSource | null) => {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) fonts.ready.then(() => draw(qr)).catch(() => draw(qr));
      else draw(qr);
    };

    // The QR is rendered locally by qrcode.react into the hidden canvas below,
    // rather than fetched from api.qrserver.com as it used to be. A poster is
    // printed once and displayed for months, so it should not depend on a
    // third-party image host being up — and a remote image also risks tainting
    // the canvas, which would break the download rather than just the QR.
    const qrCanvas = qrHostRef.current?.querySelector('canvas') ?? null;
    if (!qrCanvas) { setFailed(true); start(null); }
    else { setFailed(false); start(qrCanvas); }

    return () => { cancelled = true; };
  }, [attractionName, scanUrl, regen]);

  const fileBase = attractionName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'checkin';

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `${fileBase}-checkin-poster.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('QR poster download failed:', err);
      setDlError('The poster could not be saved. Reload the page and try again.');
    }
  };

  /**
   * The same poster as a print-ready A5 PDF.
   *
   * A PNG is fine on screen but a print shop wants a page with real
   * dimensions — handed a PNG they guess the scale, and the QR comes back
   * cropped or the wrong size. The canvas is already A5 at 150dpi, so it maps
   * onto the page exactly with no resampling.
   *
   * jsPDF is imported only when the button is pressed: it is a few hundred KB
   * and no visitor browsing the site should pay for it.
   */
  const downloadPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas || pdfBusy) return;
    setPdfBusy(true);
    setDlError('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      // JPEG at high quality rather than PNG: the poster is photographic-ish
      // flat colour, and an A5 PNG at this resolution makes a ~4MB file that
      // is slow to open on the shop's machine.
      doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 148, 210, undefined, 'FAST');
      doc.save(`${fileBase}-checkin-poster.pdf`);
    } catch (err) {
      console.error('QR poster PDF failed:', err);
      setDlError('The PDF could not be created. Try the PNG instead.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 p-3">
        <canvas ref={canvasRef} width={W} height={H}
          className="w-full h-auto rounded-lg shadow-sm bg-white" />
      </div>

      {/* Rendered off-screen and drawn onto the poster canvas. Level H so the
          code still reads with a logo-sized chunk obscured, a scuff, or the
          rain a poster by a farm entrance will meet. */}
      <div ref={qrHostRef} className="hidden" aria-hidden>
        <QRCodeCanvas value={scanUrl} size={800} level="H" marginSize={0} />
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {/* PDF first: a print shop wants a page, not an image. */}
        <button onClick={downloadPdf} disabled={busy || pdfBusy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Download PDF (A5)
        </button>
        <button onClick={downloadPng} disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50 border"
          style={{ borderColor: 'rgba(11,61,145,0.25)', color: BLUE }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PNG
        </button>
        <button onClick={() => { setBusy(true); setRegen(n => n + 1); }} disabled={busy}
          title="Redraws the poster. The code stays the same, so posters already on the wall keep working."
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
        <a href={scanUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          style={{ color: BLUE }}>
          <QrCode className="w-4 h-4" /> Test the link
        </a>
      </div>

      {failed && (
        <p className="text-xs text-red-500 mt-2">
          The QR code could not be drawn, so the poster is incomplete — do not print it. Press Regenerate, or reload the page.
        </p>
      )}
      {dlError && <p className="text-xs text-red-500 mt-2">{dlError}</p>}
    </div>
  );
}
