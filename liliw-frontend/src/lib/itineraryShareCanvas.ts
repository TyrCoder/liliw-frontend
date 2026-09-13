/**
 * The drawing behind the itinerary share card — a Strava-style "here's my
 * trip" image sized for Instagram/Facebook Stories, built the same
 * framework-free way as posterCanvas.ts: a plain CanvasRenderingContext2D in,
 * nothing else, so it draws identically wherever it's called from.
 */

import { NAVY, BLUE, GOLD, HEAD, BODY, DISPLAY, makePosterHelpers } from './posterCanvas';

// Instagram/Facebook Story ratio (9:16), at a size sharp enough to post.
export const CARD_W = 1080;
export const CARD_H = 1920;

// The map panel's inner box, in the same units as the two above. Exported so
// the map image can be requested from Mapbox at exactly this aspect ratio —
// the only way to fill the frame with no crop, which matters because a crop
// could cut off the attribution Mapbox's terms require staying visible.
export const MAP_PANEL_W = 904;
export const MAP_PANEL_H = 1040;

export interface ShareCardData {
  title: string;
  distanceKm: number | null;
  placesCount: number;
  daysCount: number;
  /** A day's theme or the trip summary — one line of context under the title. */
  subtitle: string;
  /** Loaded Mapbox static map with the route drawn on it, or null if it couldn't be fetched. */
  mapImage: HTMLImageElement | null;
  /** The site's own mark, drawn in the header. */
  logoImage: HTMLImageElement | null;
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number,
  value: string, label: string,
) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 64px ${HEAD}`;
  ctx.fillText(value, cx, y);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `700 24px ${HEAD}`;
  ctx.letterSpacing = '3px';
  ctx.fillText(label.toUpperCase(), cx, y + 38);
  ctx.letterSpacing = '0px';
}

export function drawItineraryShareCard(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const helpers = makePosterHelpers(ctx);
  const W = CARD_W, H = CARD_H;

  // Field: the same navy-to-blue gradient every shareable image on the site
  // opens on, so this reads as one family with the printable posters.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(0.55, BLUE);
  bg.addColorStop(1, NAVY);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  helpers.sunburst(W / 2, 220, 22, 1100);

  // Header: mark + wordmark.
  const headerY = 120;
  if (data.logoImage) {
    const s = 84;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, headerY, s / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(data.logoImage, W / 2 - s / 2, headerY - s / 2, s, s);
    ctx.restore();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `700 30px ${HEAD}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('LILIW ITINERARY', W / 2, headerY + 76);
  ctx.letterSpacing = '0px';

  // Title, auto-fit down from a large start size, up to two lines.
  const titleY = 300;
  const maxTitleWidth = W - 140;
  const titleSize = helpers.fitText(data.title, maxTitleWidth, 76, (s) => `700 ${s}px ${DISPLAY}`);
  ctx.font = `700 ${titleSize}px ${DISPLAY}`;
  ctx.fillStyle = '#FFFFFF';
  // Wrap onto a second line if it still doesn't fit at the floor size.
  const words = data.title.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxTitleWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 2);
  shown.forEach((l, i) => ctx.fillText(l, W / 2, titleY + i * (titleSize * 1.15)));

  const afterTitleY = titleY + (shown.length - 1) * (titleSize * 1.15);

  if (data.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `500 32px ${BODY}`;
    ctx.fillText(data.subtitle, W / 2, afterTitleY + 60);
  }

  // Map panel: a scalloped cream frame around the route, the same panel
  // shape every poster uses, so a photo-less card still looks designed
  // rather than empty.
  const panelX = 70, panelY = afterTitleY + 110;
  const panelW = MAP_PANEL_W + 36, panelH = MAP_PANEL_H + 60;
  const mapX = panelX + 18, mapY = panelY + 18;
  helpers.scallopedPanel(panelX, panelY, panelW, panelH);
  ctx.save();
  helpers.roundRect(mapX, mapY, MAP_PANEL_W, MAP_PANEL_H, 24);
  ctx.clip();
  if (data.mapImage) {
    // Requested from Mapbox at exactly MAP_PANEL_W x MAP_PANEL_H, so it fills
    // edge to edge with no crop — a cover-fit crop risks cutting off the
    // attribution Mapbox's terms require staying on screen, which only not
    // cropping at all can guarantee.
    ctx.drawImage(data.mapImage, mapX, mapY, MAP_PANEL_W, MAP_PANEL_H);
  } else {
    ctx.fillStyle = '#EFE7D2';
    ctx.fillRect(mapX, mapY, MAP_PANEL_W, MAP_PANEL_H);
    ctx.fillStyle = NAVY;
    ctx.font = `600 30px ${HEAD}`;
    ctx.fillText('A trip through Liliw, Laguna', W / 2, panelY + panelH / 2);
  }
  ctx.restore();

  ctx.fillStyle = NAVY;
  ctx.font = `600 26px ${BODY}`;
  ctx.fillText('Liliw, Laguna, Philippines', W / 2, panelY + panelH - 24);

  // Stat row — the numbers this card exists to show off.
  const stats: [string, string][] = [
    [data.distanceKm != null ? `${data.distanceKm.toFixed(1)}` : '—', 'km'],
    [String(data.placesCount), data.placesCount === 1 ? 'place' : 'places'],
    [String(data.daysCount), data.daysCount === 1 ? 'day' : 'days'],
  ];
  const statsY = panelY + panelH + 100;
  const colW = W / stats.length;
  stats.forEach(([value, label], i) => drawStat(ctx, colW * i + colW / 2, statsY, value, label));

  // Divider + footer, matching every other poster's close.
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, H - 140);
  ctx.lineTo(W / 2 + 220, H - 140);
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = `bold italic 56px ${DISPLAY}`;
  ctx.fillText('Liliw', W / 2, H - 76);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `600 22px ${HEAD}`;
  ctx.fillText('Plan your own trip at the Liliw Virtual Guide', W / 2, H - 38);
}
