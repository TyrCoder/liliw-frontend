/**
 * Cuts public/images/gat-tayaw.png into rigged body-part layers for GatTayaw.tsx.
 *
 * The source art is a single flat raster, so nothing can move independently
 * until it is split. Each layer is written at the FULL canvas size (not
 * cropped) so the component can stack them at inset:0 and they line up with
 * no per-layer offset maths — only a transform-origin at the joint.
 *
 * Run: node scripts/build-gat-layers.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'public', 'images', 'gat-tayaw.png');
const OUT = path.join(__dirname, '..', 'public', 'images', 'gat');

// ── Joints (source-image pixel coords; mirrored in GatTayaw.tsx) ────────────
const PIVOTS = {
  head:     { x: 672, y: 548 },  // base of neck, at the collar V apex
  armFree:  { x: 862, y: 770 },  // his left sleeve cuff — the hanging arm swings here
  armStaff: { x: 372, y: 742 },  // his right sleeve cuff — forearm + staff swing here
};

// Left-hand cut line for the hanging arm: traced down the gap between the
// torso and the arm (measured off the alpha silhouette row by row).
const FREE_ARM_CUT = [
  [806, 690], [810, 800], [816, 870], [820, 930],
  [838, 1000], [848, 1050], [843, 1110], [838, 1180], [836, 1260],
];

// Forearm + fist gripping the staff.
const STAFF_HAND_POLY = [
  [268, 742], [452, 736], [516, 838], [574, 906],
  [566, 986], [478, 1022], [386, 1004], [312, 900], [276, 820],
];

// The staff itself: a band around its axis.
const STAFF_AXIS = { a: [742, 612], b: [124, 1302], halfWidth: 42 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// x of the cut polyline at a given y
function cutXAt(y, line) {
  if (y <= line[0][1]) return line[0][0];
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1], [x1, y1] = line[i];
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return line[line.length - 1][0];
}

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const at = (x, y) => (y * W + x) * 4;
  const alphaAt = (x, y) => data[at(x, y) + 3];

  // Shirt blue ≈ rgb(86,146,190). Used to find where the collar starts in each
  // column, so the head is cut exactly along the collar rather than on a
  // straight line that would slice through the shoulders.
  const isShirtBlue = (x, y) => {
    const i = at(x, y);
    return data[i + 3] > 128 && data[i + 2] > 150 && data[i + 2] > data[i] + 40 && data[i + 1] > 100 && data[i + 1] < 205;
  };

  const shirtTop = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (isShirtBlue(x, y)) { shirtTop[x] = y; break; }
    }
  }

  // Lowest sleeve-cuff pixel per column — the seam hides under the rolled cuff.
  const cuffBottom = (x0, x1, yLo, yHi) => {
    const out = new Int32Array(W).fill(-1);
    for (let x = x0; x <= x1; x++) {
      for (let y = yHi; y >= yLo; y--) {
        if (isShirtBlue(x, y)) { out[x] = y; break; }
      }
    }
    return out;
  };
  const freeCuff  = cuffBottom(796, 980, 600, 900);
  const staffCuff = cuffBottom(240, 470, 600, 860);

  // ── Region predicates ────────────────────────────────────────────────────
  // Head: everything above the collar, within the head/neck column range.
  const HEAD_X0 = 460, HEAD_X1 = 884;
  const inHead = (x, y) =>
    x >= HEAD_X0 && x <= HEAD_X1 && shirtTop[x] > 0 && y < shirtTop[x] - 6;

  // Hanging arm: right of the torso cut line, below the cuff. The layer is
  // drawn BEHIND the body and tucked up under the cuff, so the cut never shows.
  const inFreeArmLayer = (x, y) =>
    y > (freeCuff[x] > 0 ? freeCuff[x] - 70 : 700) && x > cutXAt(y, FREE_ARM_CUT) && y < 1280 && x < 1010;
  // What gets erased from the body: same region, but starting below the cuff
  // so the cuff itself stays put.
  const inFreeArmErase = (x, y) =>
    y > (freeCuff[x] > 0 ? freeCuff[x] + 2 : 772) && x > cutXAt(y, FREE_ARM_CUT) && y < 1280 && x < 1010;

  // Staff arm: forearm + fist + the staff, as one rigid unit.
  const inStaffArm = (x, y) => {
    const belowCuff = staffCuff[x] > 0 ? y > staffCuff[x] - 4 : true;
    if (pointInPoly(x, y, STAFF_HAND_POLY) && belowCuff) return true;
    return distToSegment(x, y, STAFF_AXIS.a, STAFF_AXIS.b) <= STAFF_AXIS.halfWidth;
  };

  // ── Emit layers ──────────────────────────────────────────────────────────
  const blank = () => Buffer.alloc(W * H * 4, 0);
  const head = blank(), armFree = blank(), armStaff = blank(), body = Buffer.from(data);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      if (!data[i + 3]) continue;
      const h = inHead(x, y);
      const s = inStaffArm(x, y);
      const aLayer = inFreeArmLayer(x, y);
      const aErase = inFreeArmErase(x, y);

      if (h) { head.set(data.subarray(i, i + 4), i); }
      if (s && !h) { armStaff.set(data.subarray(i, i + 4), i); }
      if (aLayer && !h && !s) { armFree.set(data.subarray(i, i + 4), i); }
      // Body keeps everything except the parts that now move on their own.
      if (h || s || aErase) body[i + 3] = 0;
    }
  }

  // Inpaint the shirt/sash revealed where the staff arm used to be, so the
  // body is complete behind the arm at any rotation. Iterative dilation:
  // each pass fills a hole pixel with the average of its already-opaque
  // 8-neighbours, growing inward from the hole boundary until closed. Flat
  // cartoon fills make this indistinguishable from hand-painting at render
  // size. Only the interior hole (was-opaque, now-erased, inside the torso
  // bbox) is filled — the true silhouette edge is left transparent.
  const holeBox = { x0: 480, y0: 500, x1: 780, y1: 1080 };
  const isHole = (x, y) =>
    body[at(x, y) + 3] === 0 && data[at(x, y) + 3] > 0 &&
    x >= holeBox.x0 && x <= holeBox.x1 && y >= holeBox.y0 && y <= holeBox.y1;

  for (let pass = 0; pass < 200; pass++) {
    let filled = 0;
    const snapshot = Buffer.from(body);
    for (let y = holeBox.y0; y <= holeBox.y1; y++) {
      for (let x = holeBox.x0; x <= holeBox.x1; x++) {
        if (!isHole(x, y)) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const j = at(x + dx, y + dy);
            if (snapshot[j + 3] > 200) { r += snapshot[j]; g += snapshot[j + 1]; b += snapshot[j + 2]; n++; }
          }
        }
        if (n >= 3) {
          const i = at(x, y);
          body[i] = Math.round(r / n); body[i + 1] = Math.round(g / n); body[i + 2] = Math.round(b / n); body[i + 3] = 255;
          filled++;
        }
      }
    }
    if (!filled) break;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const write = (buf, name) =>
    sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 })
      .toFile(path.join(OUT, name));

  await Promise.all([
    write(body, 'body.png'),
    write(head, 'head.png'),
    write(armFree, 'arm-free.png'),
    write(armStaff, 'arm-staff.png'),
  ]);

  console.log(`layers written to ${OUT} (${W}x${H})`);
  console.log('pivots (fraction of canvas):');
  for (const [k, p] of Object.entries(PIVOTS)) {
    console.log(`  ${k.padEnd(9)} ${(p.x / W * 100).toFixed(2)}% ${(p.y / H * 100).toFixed(2)}%`);
  }
})();
