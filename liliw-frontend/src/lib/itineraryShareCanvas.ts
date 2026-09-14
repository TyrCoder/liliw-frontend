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
export const MAP_PANEL_H = 820;

export interface ShareCardData {
  title: string;
  distanceKm: number | null;
  placesCount: number;
  daysCount: number;
  /** A day's theme or the trip summary — one line of context under the title. */
  subtitle: string;
  /** Loaded Mapbox static map with the route and numbered pins drawn on it, or null if it couldn't be fetched. */
  mapImage: HTMLImageElement | null;
  /** The site's own mark, drawn in the header. */
  logoImage: HTMLImageElement | null;
  /**
   * Stop names in the same order as the numbered pins on the map, so "1" on
   * the map and "1" in this list are the same place. A pin can only show a
   * number — Mapbox's marker labels are a single digit or letter — so this
   * is the only place the actual names appear.
   */
  stopNames: string[];
}

/**
 * Wraps text to fit a width, word by word, up to maxLines — the last shown
 * line gets an ellipsis if there was more left over. `ctx.font` must already
 * be set to the size this should measure and draw at.
 *
 * The subtitle used to be drawn with a bare fillText and no width at all, so
 * an AI-generated summary longer than about eight words ran straight off
 * both edges of the card instead of wrapping — this is what actually fixes
 * that, not just the subtitle's font size.
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

  // Anything left over after maxLines means the last shown line needs an
  // ellipsis — trimmed word by word until "<line>…" actually fits, rather
  // than letting the ellipsis push it back over the edge it was added to fix.
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
  const maxTextWidth = W - 140;
  const titleSize = helpers.fitText(data.title, maxTextWidth, 76, (s) => `700 ${s}px ${DISPLAY}`);
  ctx.font = `700 ${titleSize}px ${DISPLAY}`;
  ctx.fillStyle = '#FFFFFF';
  const titleLines = wrapLines(ctx, data.title, maxTextWidth, 2);
  const titleLineHeight = titleSize * 1.15;
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, titleY + i * titleLineHeight));

  const afterTitleY = titleY + (titleLines.length - 1) * titleLineHeight;

  // Subtitle: wrapped the same way, not a bare fillText with no width at all
  // — that was the actual cause of a long summary running off both edges of
  // the card, not a centering problem.
  let afterSubtitleY = afterTitleY;
  if (data.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const subtitleSize = 32;
    ctx.font = `500 ${subtitleSize}px ${BODY}`;
    const subtitleLines = wrapLines(ctx, data.subtitle, maxTextWidth, 2);
    const subtitleLineHeight = subtitleSize * 1.35;
    const subtitleStartY = afterTitleY + 60;
    subtitleLines.forEach((l, i) => ctx.fillText(l, W / 2, subtitleStartY + i * subtitleLineHeight));
    afterSubtitleY = subtitleStartY + (subtitleLines.length - 1) * subtitleLineHeight;
  }

  // Map panel: a scalloped cream frame around the route, the same panel
  // shape every poster uses, so a photo-less card still looks designed
  // rather than empty.
  const panelX = 70, panelY = afterSubtitleY + 70;
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

  // The legend the numbered pins on the map actually point at. Each entry is
  // packed as one unit — "3 Riverfront" never splits into a lone "3" at the
  // end of a line and "Riverfront" starting the next — and any name too long
  // for one entry's own share of the line is clipped with an ellipsis rather
  // than crowding out the rest.
  const afterPanelY = panelY + panelH;
  let afterLegendY = afterPanelY;
  if (data.stopNames.length > 0) {
    const legendSize = 26;
    ctx.font = `700 ${legendSize}px ${HEAD}`;
    const GAP = 36;

    // Only clip a name if it alone can't fit a full line — most real stop
    // names are nowhere near that wide, so this only ever bites on outliers,
    // instead of the fixed narrow slot this used to force every name into.
    const clip = (s: string, max: number) => {
      let out = s;
      while (out.length > 0 && ctx.measureText(out).width > max) out = out.slice(0, -1).trimEnd();
      return out.length < s.length ? `${out}…` : out;
    };
    const entries = data.stopNames.map((name, i) => {
      const label = `${i + 1}  `;
      const nameMax = maxTextWidth - ctx.measureText(label).width;
      return label + clip(name, nameMax);
    });

    const maxLines = 3;
    const lines: string[][] = [[]];
    let lineWidth = 0;
    for (const entry of entries) {
      const w = ctx.measureText(entry).width;
      const addWidth = lineWidth === 0 ? w : lineWidth + GAP + w;
      if (addWidth > maxTextWidth && lineWidth > 0) {
        if (lines.length === maxLines) break;
        lines.push([]);
        lineWidth = w;
      } else {
        lineWidth = addWidth;
      }
      lines[lines.length - 1].push(entry);
    }

    // A trip with more stops than fit in three lines still needs every pin
    // accounted for, so the ones that didn't fit become a "+N more" note
    // tacked onto the end rather than just vanishing with no explanation.
    const shown = lines.reduce((n, row) => n + row.length, 0);
    let remaining = entries.length - shown;
    if (remaining > 0) {
      let lastRow = lines[lines.length - 1];
      while (lastRow.length > 0) {
        const candidate = [...lastRow, `+${remaining} more`].join('    ');
        if (ctx.measureText(candidate).width <= maxTextWidth) {
          lines[lines.length - 1] = [...lastRow, `+${remaining} more`];
          break;
        }
        lastRow = lastRow.slice(0, -1);
        remaining += 1;
      }
      if (lastRow.length === 0) lines[lines.length - 1] = [`+${remaining} more`];
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center';
    const legendLineHeight = legendSize * 1.6;
    const legendStartY = afterPanelY + 58;
    lines.forEach((row, i) => ctx.fillText(row.join('    '), W / 2, legendStartY + i * legendLineHeight));
    afterLegendY = legendStartY + (lines.length - 1) * legendLineHeight;
  }

  // Stat row — the numbers this card exists to show off.
  const stats: [string, string][] = [
    [data.distanceKm != null ? `${data.distanceKm.toFixed(1)}` : '—', 'km'],
    [String(data.placesCount), data.placesCount === 1 ? 'place' : 'places'],
    [String(data.daysCount), data.daysCount === 1 ? 'day' : 'days'],
  ];
  const statsY = afterLegendY + 70;
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
