'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileDown, Loader2, QrCode, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

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

/**
 * The QR itself: rounded modules, rounded-square eyes, and the Liliw mark in
 * the middle.
 *
 * Drawn from the module matrix rather than dropped in as a finished image,
 * because neither a QR image service nor qrcode.react can produce this shape —
 * they emit plain squares. Working from the matrix means the poster's code
 * looks like it belongs to the same design as everything around it.
 *
 * Error correction is level H, which tolerates roughly 30% loss. The logo
 * covers about 5% of the area, so the code still reads with room to spare —
 * that headroom is also what lets it survive a scuffed or rained-on print.
 */
function drawStyledQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, bg = '#FFFFFF') {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const bits = qr.modules.data;
  const cell = size / n;
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && !!bits[r * n + c];

  // The three big squares are drawn by hand below, so the dot pass skips them.
  const inEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // Cleared for the logo. Odd span so it sits exactly on centre.
  const logoSpan = Math.floor(n * 0.2) | 1;
  const lo = (n - logoSpan) >> 1;
  const inLogo = (r: number, c: number) => r >= lo && r < lo + logoSpan && c >= lo && c < lo + logoSpan;

  // Modules as dots, slightly overlapping so runs read as soft bars rather
  // than a dotted line — easier for a camera than isolated circles.
  ctx.fillStyle = NAVY;
  const rad = cell * 0.56;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c) || inEye(r, c) || inLogo(r, c)) continue;
      ctx.beginPath();
      ctx.arc(x + c * cell + cell / 2, y + r * cell + cell / 2, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Finder eyes: rounded outer ring with a rounded core, as in the reference.
  const rrect = (px: number, py: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + w, py, px + w, py + h, r);
    ctx.arcTo(px + w, py + h, px, py + h, r);
    ctx.arcTo(px, py + h, px, py, r);
    ctx.arcTo(px, py, px + w, py, r);
    ctx.closePath();
  };

  // A finder pattern is read as dark ring / light gap / dark core. Both parts
  // of that have to be true optically, not just structurally:
  //
  //  - the gap is painted in the background colour, not punched out with
  //    destination-out, which erases to transparent; a decoder reading RGBA
  //    sees transparent as black and the ring disappears.
  //  - the core is drawn dark. It was gold, and gold is a light colour, so the
  //    core read as part of the gap.
  //
  // Both were caught by rendering the code and decoding it back with jsQR —
  // it looked correct on screen and scanned as nothing at all.
  const eye = (row: number, col: number) => {
    const ex = x + col * cell, ey = y + row * cell, s = cell * 7;
    ctx.fillStyle = NAVY;
    rrect(ex, ey, s, s, cell * 2.1);
    ctx.fill();
    ctx.fillStyle = bg;
    rrect(ex + cell, ey + cell, s - cell * 2, s - cell * 2, cell * 1.4);
    ctx.fill();
    ctx.fillStyle = NAVY;
    rrect(ex + cell * 2, ey + cell * 2, cell * 3, cell * 3, cell * 1);
    ctx.fill();
  };
  eye(0, 0); eye(0, n - 7); eye(n - 7, 0);

  // The mark. A filled disc rather than a knock-out, so it reads as deliberate
  // rather than as a hole in the code.
  const cx = x + size / 2, cy = y + size / 2;
  const rOuter = (logoSpan * cell) / 2;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(cx, cy, rOuter, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.arc(cx, cy, rOuter * 0.82, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = `700 ${Math.round(rOuter * 1.05)}px ${HEAD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', cx, cy + rOuter * 0.04);
}

export default function QRPoster({ attractionId, attractionName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [dlError, setDlError] = useState('');
  // Bumped by Regenerate to redraw. The code itself is deterministic — the
  // same listing always yields the same QR — so this repaints the poster
  // rather than issuing a different code; see the note by the button.
  const [regen, setRegen] = useState(0);
  const regenerated = regen > 0;

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
  // Same ?src=qr contract the check-in route reads — a scan of this poster is
  // what gets distance-verified against the attraction's coordinates.
  const scanUrl = `${baseUrl}/attractions/${attractionId}?src=qr`;

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

    const draw = (qr: CanvasImageSource | 'styled' | null) => {
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

      if (qr === 'styled') {
        drawStyledQr(ctx, scanUrl, qx, qy, size, '#FFFFFF');
      } else if (qr) {
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
    const start = (qr: CanvasImageSource | 'styled' | null) => {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) fonts.ready.then(() => draw(qr)).catch(() => draw(qr));
      else draw(qr);
    };

    // Drawn inline from the module matrix — see drawStyledQr. Nothing to load,
    // so nothing to fail on a slow connection or a blocked image host.
    setFailed(false);
    start('styled');

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
        {/* Redrawing produced an identical poster and no feedback, so it read
            as a dead button. It now says it has run — and says plainly that
            the code is unchanged, which is the point: posters already on a
            wall must keep working. */}
        <button
          onClick={() => { setBusy(true); setDlError(''); setRegen(n => n + 1); }}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
        {regenerated && !busy && (
          <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>
            Redrawn — same code, so printed posters still work.
          </span>
        )}
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
