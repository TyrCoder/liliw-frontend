/**
 * The drawing behind the itinerary share card — a Strava-style "here's my
 * trip" image sized for Instagram/Facebook Stories, built the same
 * framework-free way as posterCanvas.ts: a plain CanvasRenderingContext2D in,
 * nothing else, so it draws identically wherever it's called from.
 */

import { NAVY, BLUE, GOLD, CREAM, HEAD, BODY, DISPLAY, makePosterHelpers } from './posterCanvas';

// Instagram/Facebook Story ratio (9:16), at a size sharp enough to post.
export const CARD_W = 1080;
export const CARD_H = 1920;

const MARGIN_X = 70;
const TEXT_W = CARD_W - MARGIN_X * 2;
const PANEL_PAD = 18;
/** Clears the scalloped bumps along the panel's top edge, so the map sits under them rather than through them. */
const PANEL_TOP = Math.round(TEXT_W / 9 / 2) + 10;
const CAPTION_BAND = 74;
const LEGEND_ROW_H = 54;
const LEGEND_BADGE = 36;
const LEGEND_MAX_ROWS = 3;
const STATS_BASELINE = CARD_H - 252;

/**
 * The day colours the itinerary's own map and day badges use, so a stop that
 * is orange on the plan is orange here too.
 */
const PENNANT = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#0D9488', '#3B82F6', '#8B5CF6'];

export function dayColorHex(day: number): string {
  return PENNANT[(Math.max(1, day) - 1) % PENNANT.length];
}

/** Readable text on a given badge colour — the palette runs from yellow to navy-blue. */
function contrastInk(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? NAVY : '#FFFFFF';
}

export interface ShareCardStop {
  name: string;
  /** 1-based day number, which colours this stop's map pin and legend badge. */
  day: number;
}

/** Everything the layout depends on — measured before the map image is requested. */
export interface ShareCardInput {
  title: string;
  /** A day's theme or the trip summary — context under the title. */
  subtitle: string;
  /**
   * Stops in itinerary order. Their position here is their number on the map
   * and in the legend: a pin can only show a number, so the legend under the
   * map is the only place the names appear.
   */
  stops: ShareCardStop[];
}

export interface ShareCardData extends ShareCardInput {
  distanceKm: number | null;
  placesCount: number;
  daysCount: number;
  /** Loaded Mapbox static map, requested at exactly the measured map size, or null if it couldn't be fetched. */
  mapImage: HTMLImageElement | null;
  /** The site's own mark, drawn in the header. */
  logoImage: HTMLImageElement | null;
}

interface LegendEntry {
  /** Empty for the "+N more" note, which has no badge. */
  label: string;
  text: string;
  color: string;
  width: number;
}

export interface ShareCardLayout {
  titleSize: number;
  titleLines: string[];
  subtitleLines: string[];
  panelY: number;
  panelH: number;
  mapW: number;
  mapH: number;
  legendRows: LegendEntry[][];
  legendFirstCenterY: number;
}

/**
 * Wraps text to fit a width, word by word, up to maxLines — the last shown
 * line gets an ellipsis if there was more left over. `ctx.font` must already
 * be set to the size this should measure and draw at.
 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  const consumed = lines.join(' ').split(/\s+/).length;
  if (consumed < words.length && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 0 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    lines[maxLines - 1] = last + '…';
  }
  return lines;
}

/**
 * The largest size at which the text still fits in maxLines — so a short
 * title stays big and a long one shrinks before it starts dropping words,
 * rather than being both shrunk to a single line and then truncated.
 */
function fitWrapped(
  ctx: CanvasRenderingContext2D,
  text: string, maxWidth: number, maxLines: number,
  startSize: number, minSize: number, font: (s: number) => string,
): { size: number; lines: string[] } {
  for (let size = startSize; size > minSize; size -= 2) {
    ctx.font = font(size);
    const words = text.split(/\s+/).filter(Boolean);
    let lines = 1;
    let line = '';
    let fits = true;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines += 1;
        line = w;
        if (lines > maxLines || ctx.measureText(w).width > maxWidth) { fits = false; break; }
      } else {
        line = test;
      }
    }
    if (fits) return { size, lines: wrapLines(ctx, text, maxWidth, maxLines) };
  }
  ctx.font = font(minSize);
  return { size: minSize, lines: wrapLines(ctx, text, maxWidth, maxLines) };
}

/**
 * Works out where everything sits, including how big the map can be. The map
 * panel takes whatever room the title, subtitle and legend leave, so a short
 * trip gets a bigger map instead of the card ending in dead space — which
 * means the map image has to be requested at the size this returns, and the
 * caller needs that size before it can fetch anything. Pure and deterministic
 * for a given context and input, so measuring here and drawing later agree.
 */
export function measureShareCard(ctx: CanvasRenderingContext2D, input: ShareCardInput): ShareCardLayout {
  const titleY = 292;
  const { size: titleSize, lines: titleLines } = fitWrapped(
    ctx, input.title || 'My Liliw Itinerary', TEXT_W, 2, 78, 40, (s) => `700 ${s}px ${DISPLAY}`,
  );
  const titleLineHeight = titleSize * 1.14;
  const titleEnd = titleY + (titleLines.length - 1) * titleLineHeight;

  const subtitleSize = 32;
  ctx.font = `500 ${subtitleSize}px ${BODY}`;
  const subtitleLines = input.subtitle ? wrapLines(ctx, input.subtitle, TEXT_W, 2) : [];
  const subtitleEnd = subtitleLines.length
    ? titleEnd + 58 + (subtitleLines.length - 1) * subtitleSize * 1.35
    : titleEnd;

  // Whole pixels from here down: the map is fetched at exactly the size this
  // returns, and Mapbox 404s a static request with a fractional dimension.
  const panelY = Math.round(subtitleEnd + 66);

  // Legend entries: a numbered badge plus the place name, packed greedily
  // into rows. Each "badge + name" is one unit, so a number never ends up
  // stranded at the end of a row away from its own name.
  ctx.font = `600 27px ${HEAD}`;
  const entryWidth = (text: string, withBadge: boolean) =>
    (withBadge ? LEGEND_BADGE + 12 : 0) + ctx.measureText(text).width;

  const clip = (s: string, max: number) => {
    let out = s;
    while (out.length > 0 && ctx.measureText(out).width > max) out = out.slice(0, -1).trimEnd();
    return out.length < s.length ? `${out}…` : out;
  };

  const entries: LegendEntry[] = input.stops.map((stop, i) => {
    const text = clip(stop.name, TEXT_W - LEGEND_BADGE - 12);
    return { label: String(i + 1), text, color: dayColorHex(stop.day), width: entryWidth(text, true) };
  });

  const GAP = 40;
  const legendRows: LegendEntry[][] = [];
  let row: LegendEntry[] = [];
  let rowWidth = 0;
  let placed = 0;
  for (const entry of entries) {
    const next = rowWidth === 0 ? entry.width : rowWidth + GAP + entry.width;
    if (next > TEXT_W && row.length > 0) {
      legendRows.push(row);
      if (legendRows.length === LEGEND_MAX_ROWS) { row = []; break; }
      row = [entry];
      rowWidth = entry.width;
    } else {
      row.push(entry);
      rowWidth = next;
    }
    placed += 1;
  }
  if (row.length > 0 && legendRows.length < LEGEND_MAX_ROWS) legendRows.push(row);

  // Stops past the last row still need accounting for, so they become a
  // "+N more" note rather than silently vanishing off the card.
  let remaining = entries.length - placed;
  if (remaining > 0 && legendRows.length > 0) {
    const last = legendRows[legendRows.length - 1];
    for (;;) {
      const note: LegendEntry = { label: '', text: `+${remaining} more`, color: GOLD, width: entryWidth(`+${remaining} more`, false) };
      const total = [...last, note].reduce((w, e) => w + e.width, 0) + last.length * GAP;
      if (total <= TEXT_W || last.length === 0) { last.push(note); break; }
      remaining += 1;
      last.pop();
    }
  }

  // Anchor the bottom half: stats sit a fixed distance above the footer, the
  // legend sits above the stats, and the map panel stretches to fill the gap.
  const legendLastCenterY = (STATS_BASELINE - 64) - 66;
  const legendFirstCenterY = legendLastCenterY - (legendRows.length - 1) * LEGEND_ROW_H;
  const legendTop = legendRows.length > 0 ? legendFirstCenterY - LEGEND_ROW_H / 2 : STATS_BASELINE - 64 - 40;

  const panelBottom = legendTop - 44;
  const mapW = TEXT_W - PANEL_PAD * 2;
  const mapH = Math.round(Math.max(500, Math.min(1000, (panelBottom - panelY) - PANEL_TOP - CAPTION_BAND)));
  const panelH = mapH + PANEL_TOP + CAPTION_BAND;

  return { titleSize, titleLines, subtitleLines, panelY, panelH, mapW, mapH, legendRows, legendFirstCenterY };
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number,
  value: string, label: string,
) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 66px ${HEAD}`;
  ctx.fillText(value, cx, y);
  ctx.fillStyle = GOLD;
  ctx.font = `700 22px ${HEAD}`;
  ctx.letterSpacing = '4px';
  ctx.fillText(label.toUpperCase(), cx, y + 40);
  ctx.letterSpacing = '0px';
}

export function drawItineraryShareCard(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const helpers = makePosterHelpers(ctx);
  const W = CARD_W, H = CARD_H;
  const L = measureShareCard(ctx, data);

  // Field: the same navy-to-blue gradient every shareable image on the site
  // opens on, so this reads as one family with the printable posters.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(0.55, BLUE);
  bg.addColorStop(1, NAVY);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  helpers.sunburst(W / 2, 210, 22, 1100);

  // Header: mark + wordmark.
  const headerY = 118;
  if (data.logoImage) {
    const s = 88;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, headerY, s / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(data.logoImage, W / 2 - s / 2, headerY - s / 2, s, s);
    ctx.restore();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `700 28px ${HEAD}`;
  ctx.letterSpacing = '7px';
  ctx.fillText('LILIW ITINERARY', W / 2, headerY + 74);
  ctx.letterSpacing = '0px';

  // Title, sized to the largest that still fits two lines.
  const titleY = 292;
  ctx.font = `700 ${L.titleSize}px ${DISPLAY}`;
  ctx.fillStyle = '#FFFFFF';
  const titleLineHeight = L.titleSize * 1.14;
  L.titleLines.forEach((line, i) => ctx.fillText(line, W / 2, titleY + i * titleLineHeight));
  const titleEnd = titleY + (L.titleLines.length - 1) * titleLineHeight;

  if (L.subtitleLines.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.font = `500 32px ${BODY}`;
    L.subtitleLines.forEach((line, i) => ctx.fillText(line, W / 2, titleEnd + 58 + i * 32 * 1.35));
  }

  // Map panel: a scalloped cream frame around the route, the same panel shape
  // every poster uses, sized by the measurement above so it fills whatever
  // room the text leaves rather than the card trailing off into empty blue.
  const panelX = MARGIN_X, panelY = L.panelY, panelW = TEXT_W, panelH = L.panelH;
  const mapX = panelX + PANEL_PAD, mapY = panelY + PANEL_TOP;
  helpers.scallopedPanel(panelX, panelY, panelW, panelH);
  ctx.save();
  helpers.roundRect(mapX, mapY, L.mapW, L.mapH, 22);
  ctx.clip();
  if (data.mapImage) {
    // Requested from Mapbox at exactly this size, so it fills edge to edge
    // with no crop — a cover-fit crop risks cutting off the attribution
    // Mapbox's terms require staying on screen.
    ctx.drawImage(data.mapImage, mapX, mapY, L.mapW, L.mapH);
  } else {
    ctx.fillStyle = '#EFE7D2';
    ctx.fillRect(mapX, mapY, L.mapW, L.mapH);
    ctx.fillStyle = NAVY;
    ctx.font = `600 30px ${HEAD}`;
    ctx.fillText('A trip through Liliw, Laguna', W / 2, mapY + L.mapH / 2);
  }
  ctx.restore();

  ctx.save();
  helpers.roundRect(mapX, mapY, L.mapW, L.mapH, 22);
  ctx.strokeStyle = 'rgba(11,61,145,0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Caption, with clearance below the map rather than crowding its edge.
  const captionY = mapY + L.mapH + 48;
  ctx.fillStyle = NAVY;
  ctx.font = `700 25px ${BODY}`;
  ctx.letterSpacing = '1px';
  ctx.fillText('Liliw, Laguna, Philippines', W / 2, captionY);
  const captionHalf = ctx.measureText('Liliw, Laguna, Philippines').width / 2;
  ctx.letterSpacing = '0px';
  helpers.diamond(W / 2 - captionHalf - 26, captionY - 8, 7);
  helpers.diamond(W / 2 + captionHalf + 26, captionY - 8, 7);

  // Legend: the numbered badge on each row is the same number and day colour
  // as that stop's pin on the map, which is the only way a name can be read
  // off a map pin that can print nothing but a number.
  ctx.textBaseline = 'middle';
  L.legendRows.forEach((row, rowIdx) => {
    const GAP = 40;
    const total = row.reduce((w, e) => w + e.width, 0) + (row.length - 1) * GAP;
    const centerY = L.legendFirstCenterY + rowIdx * LEGEND_ROW_H;
    let x = (W - total) / 2;
    for (const entry of row) {
      if (entry.label) {
        ctx.beginPath();
        ctx.arc(x + LEGEND_BADGE / 2, centerY, LEGEND_BADGE / 2, 0, Math.PI * 2);
        ctx.fillStyle = entry.color;
        ctx.fill();
        ctx.fillStyle = contrastInk(entry.color);
        ctx.font = `800 19px ${HEAD}`;
        ctx.textAlign = 'center';
        ctx.fillText(entry.label, x + LEGEND_BADGE / 2, centerY + 1);
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
      }
      ctx.font = `600 27px ${HEAD}`;
      ctx.textAlign = 'left';
      ctx.fillText(entry.text, x + (entry.label ? LEGEND_BADGE + 12 : 0), centerY);
      x += entry.width + GAP;
    }
  });
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';

  // Stat row — the numbers this card exists to show off.
  const stats: [string, string][] = [
    [data.distanceKm != null ? `${data.distanceKm.toFixed(1)}` : '—', 'km'],
    [String(data.placesCount), data.placesCount === 1 ? 'place' : 'places'],
    [String(data.daysCount), data.daysCount === 1 ? 'day' : 'days'],
  ];
  const colW = W / stats.length;
  stats.forEach(([value, label], i) => drawStat(ctx, colW * i + colW / 2, STATS_BASELINE, value, label));
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  for (const i of [1, 2]) {
    ctx.beginPath();
    ctx.moveTo(colW * i, STATS_BASELINE - 52);
    ctx.lineTo(colW * i, STATS_BASELINE + 30);
    ctx.stroke();
  }

  // Divider + footer, matching every other poster's close.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, H - 140);
  ctx.lineTo(W / 2 + 220, H - 140);
  ctx.stroke();
  helpers.diamond(W / 2, H - 140, 8, CREAM);

  ctx.fillStyle = GOLD;
  ctx.font = `bold italic 56px ${DISPLAY}`;
  ctx.fillText('Liliw', W / 2, H - 74);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `600 22px ${HEAD}`;
  ctx.fillText('Plan your own trip at the Liliw Virtual Guide', W / 2, H - 36);
}
