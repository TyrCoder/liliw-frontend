/**
 * The drawing behind every printable poster on the site.
 *
 * Lifted out of QRPoster, which drew all of this inline and only ever drew
 * one thing: a check-in poster for one business. A second poster — this
 * site's own, for SitePoster — needed the exact same construction (the
 * blue field, the sunburst, the bunting, the scalloped cream panel, the
 * styled QR with the Liliw mark) with different words on it. Duplicating
 * five hundred lines of canvas drawing to change three lines of copy would
 * have meant the two posters drifting apart the first time either was
 * touched; sharing this module means they cannot.
 *
 * Framework-free on purpose — no 'use client', no React. Every function here
 * takes a plain CanvasRenderingContext2D, which both the browser's <canvas>
 * and a server-side canvas implementation provide identically, so the same
 * code that draws a poster in a visitor's browser can draw one on a build
 * machine with no visitor involved at all.
 */

import QRCode from 'qrcode';

export const NAVY = '#0B3D91';
export const BLUE = '#1565C0';
export const GOLD = '#F5C518';
export const CREAM = '#FBF7EC';

// A4 at 150dpi — prints sharp, and the PNG stays a few hundred KB.
export const W = 1240;
export const H = 1754;

export const HEAD = 'Outfit, system-ui, sans-serif';
export const BODY = '"Plus Jakarta Sans", system-ui, sans-serif';
export const DISPLAY = '"Cormorant Garamond", Georgia, serif';

/**
 * The QR itself: rounded modules, rounded-square eyes, and the Liliw mark in
 * the middle.
 *
 * Drawn from the module matrix rather than dropped in as a finished image,
 * because neither a QR image service nor qrcode.react can produce this shape
 * — they emit plain squares. Working from the matrix means the poster's code
 * looks like it belongs to the same design as everything around it.
 *
 * Error correction is level H, which tolerates roughly 30% loss. The logo
 * covers about 5% of the area, so the code still reads with room to spare —
 * that headroom is also what lets it survive a scuffed or rained-on print.
 */
export function drawStyledQr(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  bg = '#FFFFFF',
) {
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

/**
 * The festive drawing primitives every poster is built from — the blue field,
 * the sunburst, the bunting, the scalloped panel, the corner brackets. A
 * factory rather than free functions so every call site closes over one
 * `ctx` implicitly, the same as when this lived inline in QRPoster; nothing
 * about how they are called changes, only where they are defined.
 */
export function makePosterHelpers(ctx: CanvasRenderingContext2D) {
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

  return { roundRect, sunburst, bunting, scallopedPanel, diamond, cornerTicks, fitText };
}

/** The navy field every poster opens on: gradient, sunburst, bunting. */
export function drawHeader(ctx: CanvasRenderingContext2D, helpers: ReturnType<typeof makePosterHelpers>) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(0.5, BLUE);
  bg.addColorStop(1, NAVY);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  helpers.sunburst(W / 2, 300, 26, 1300);
  helpers.bunting(64, 9);
}

/** The footer every poster closes on: the Liliw wordmark and the office line. */
export function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'center';
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
}
