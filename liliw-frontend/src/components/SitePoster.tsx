'use client';

import { useEffect, useRef, useState } from 'react';
import { browserSiteUrl } from '@/lib/siteUrl';
import { Download, FileDown, Loader2, RefreshCw } from 'lucide-react';
import {
  NAVY, BLUE, GOLD, W, H, HEAD, BODY, DISPLAY,
  drawStyledQr, makePosterHelpers, drawHeader, drawFooter,
} from '@/lib/posterCanvas';

/**
 * The site's own poster — same construction as QRPoster, different words.
 *
 * QRPoster answers "how do I check in here"; this answers "how do I find
 * this place at all." The distinction shows up in three spots that are not
 * just relabelled: the QR encodes the plain homepage rather than an
 * attraction's ?src=qr check-in link, since nothing here is meant to be
 * distance-verified against a location; the three steps read OPEN · SCAN ·
 * EXPLORE rather than ...EARN, because there is no point award for visiting
 * a website; and the note under them describes what the site holds rather
 * than warning that a permission is required, since there is no check-in to
 * fail without one.
 *
 * No props — there is exactly one of this poster, unlike QRPoster's one per
 * business.
 */
export default function SitePoster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [dlError, setDlError] = useState('');
  const [regen, setRegen] = useState(0);
  const regenerated = regen > 0;

  const siteUrlValue = `${browserSiteUrl()}/`;

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { roundRect, scallopedPanel, diamond, cornerTicks } = makePosterHelpers(ctx);

    const draw = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);

      drawHeader(ctx, makePosterHelpers(ctx));
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
      ctx.fillText('Visit Us Online', W / 2, 450);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Sub-pill
      ctx.font = `600 34px ${BODY}`;
      const pillText = 'Your guide to Liliw, Laguna';
      const pw = ctx.measureText(pillText).width + 90;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(W / 2 - pw / 2, 490, pw, 74, 37);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pillText, W / 2, 539);

      // Cream panel — identical proportions to QRPoster's, so the two hang
      // together as one family whether printed side by side or not.
      const px = 70;
      const py = 616;
      const pWidth = W - px * 2;
      const pHeight = 924;
      scallopedPanel(px, py, pWidth, pHeight);

      // Where QRPoster prints the business name, this line names what the
      // site holds instead — same slot, same styling, no business to name.
      const tagline = 'Attractions · Stories · Itineraries';
      ctx.fillStyle = NAVY;
      ctx.font = `bold italic 62px ${DISPLAY}`;
      const nameY = py + 120;
      ctx.fillText(tagline, W / 2, nameY);

      const nameW = Math.min(ctx.measureText(tagline).width, pWidth - 220);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nameW / 2 - 30, nameY + 26);
      ctx.lineTo(W / 2 - 26, nameY + 26);
      ctx.moveTo(W / 2 + 26, nameY + 26);
      ctx.lineTo(W / 2 + nameW / 2 + 30, nameY + 26);
      ctx.stroke();
      diamond(W / 2, nameY + 26, 10);

      // QR, framed — the plain homepage, no ?src=qr: nothing here is scanned
      // in person against a location, so there is nothing to mark as such.
      const size = 480;
      const qx = (W - size) / 2;
      const qy = nameY + 94;
      ctx.fillStyle = '#FFFFFF';
      roundRect(qx - 28, qy - 28, size + 56, size + 56, 32);
      ctx.fill();
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 8;
      ctx.stroke();
      cornerTicks(qx - 42, qy - 42, size + 84, size + 84, 32);
      drawStyledQr(ctx, siteUrlValue, qx, qy, size, '#FFFFFF');

      // Three steps
      const stepY = qy + size + 115;
      const steps = ['OPEN', 'SCAN', 'EXPLORE'];
      const subs = ['your camera', 'the QR code', 'Liliw Tourism'];
      const colW = pWidth / 3;
      const R = 30, GAP = 16;
      steps.forEach((s, i) => {
        const cx = px + colW * i + colW / 2;

        ctx.font = `bold 34px ${HEAD}`;
        const labelW = ctx.measureText(s).width;
        ctx.font = `26px ${BODY}`;
        const subW = ctx.measureText(subs[i]).width;

        const textW = Math.max(labelW, subW);
        const groupW = R * 2 + GAP + textW;
        const left = cx - groupW / 2;
        const circleX = left + R;
        const textX = left + R * 2 + GAP;

        ctx.beginPath();
        ctx.arc(circleX, stepY - 10, R, 0, Math.PI * 2);
        ctx.fillStyle = BLUE;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 30px ${HEAD}`;
        ctx.fillText(String(i + 1), circleX, stepY);

        ctx.textAlign = 'left';
        ctx.fillStyle = NAVY;
        ctx.font = `bold 34px ${HEAD}`;
        ctx.fillText(s, textX, stepY - 6);
        ctx.fillStyle = '#64748B';
        ctx.font = `26px ${BODY}`;
        ctx.fillText(subs[i], textX, stepY + 28);
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

      // Description note, in the slot QRPoster uses for a location warning —
      // there is nothing to warn about here, so it says what the site is for.
      const noteText = 'Heritage, dining, footwear, stays, stories and curated trips around Liliw.';
      const noteY = py + pHeight - 40;
      ctx.fillStyle = BLUE;
      ctx.font = `600 29px ${BODY}`;
      ctx.fillText(noteText, W / 2, noteY);
      const noteW = ctx.measureText(noteText).width;
      diamond(W / 2 - noteW / 2 - 28, noteY - 10, 7, 'rgba(21,101,192,0.45)');
      diamond(W / 2 + noteW / 2 + 28, noteY - 10, 7, 'rgba(21,101,192,0.45)');

      drawFooter(ctx);
      setBusy(false);
    };

    const start = () => {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) fonts.ready.then(draw).catch(draw);
      else draw();
    };
    start();

    return () => { cancelled = true; };
  }, [siteUrlValue, regen]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = 'liliw-tourism-poster.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Site poster download failed:', err);
      setDlError('The poster could not be saved. Reload the page and try again.');
    }
  };

  const downloadPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas || pdfBusy) return;
    setPdfBusy(true);
    setDlError('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      doc.save('liliw-tourism-poster.pdf');
    } catch (err) {
      console.error('Site poster PDF failed:', err);
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
        <button onClick={downloadPdf} disabled={busy || pdfBusy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Download PDF (A4)
        </button>
        <button onClick={downloadPng} disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50 border"
          style={{ borderColor: 'rgba(11,61,145,0.25)', color: BLUE }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PNG
        </button>
        <button
          onClick={() => { setBusy(true); setDlError(''); setRegen(n => n + 1); }}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
        {regenerated && !busy && (
          <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Redrawn.</span>
        )}
      </div>

      {dlError && <p className="text-xs text-red-500 mt-2">{dlError}</p>}
    </div>
  );
}
