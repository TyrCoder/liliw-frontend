/**
 * Fits oversized images under Cloudinary's per-file ceiling before upload.
 *
 * The ceiling is Cloudinary's, not ours — the Free plan rejects anything above
 * 10 MB outright, verified against the account:
 *
 *   File size too large. Got 12963838. Maximum is 10485760.
 *
 * Pixel dimensions are not capped in practice (an 8192x4096 panorama uploads
 * without complaint), so bytes are the only thing to solve for. Rather than
 * refusing a large file, re-encode it until it fits: quality first at full
 * resolution, and only then scale down, because for a 360° panorama sharpness
 * across the sphere matters more than the last few quality points.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Aim below the hard cap. Cloudinary counts the multipart body, not just the
// image, so landing at 9,999,999 bytes would still risk a rejection.
const TARGET_BYTES = Math.floor(9.5 * 1024 * 1024);

export interface FitResult {
  /** The file to upload — the original when it already fit. */
  file: File;
  /** True when the image had to be re-encoded to get under the cap. */
  shrunk: boolean;
  originalBytes: number;
  /** Set when the file is over the cap and could not be rescued. */
  error?: string;
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

/** Quality passes at full size first, then progressively smaller. */
const ATTEMPTS: { scale: number; quality: number }[] = [];
for (const scale of [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.25]) {
  for (const quality of [0.85, 0.72, 0.6]) ATTEMPTS.push({ scale, quality });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function fitForUpload(file: File): Promise<FitResult> {
  const originalBytes = file.size;
  if (file.size <= MAX_UPLOAD_BYTES) return { file, shrunk: false, originalBytes };

  if (!file.type.startsWith('image/')) {
    return {
      file, shrunk: false, originalBytes,
      error: `${file.name} is ${mb(file.size)} MB and is not an image, so it cannot be resized. The limit is 10 MB.`,
    };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return {
      file, shrunk: false, originalBytes,
      error: `${file.name} is ${mb(file.size)} MB and could not be read for resizing — try saving it as a JPEG first.`,
    };
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        file, shrunk: false, originalBytes,
        error: `${file.name} is ${mb(file.size)} MB and this browser could not resize it. Save it as a JPEG under 10 MB.`,
      };
    }

    for (const { scale, quality } of ATTEMPTS) {
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // JPEG has no alpha; without this, anything transparent turns black.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);

      const blob = await toBlob(canvas, quality);
      if (!blob) continue;

      if (blob.size <= TARGET_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        return {
          file: new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() }),
          shrunk: true,
          originalBytes,
        };
      }
    }

    return {
      file, shrunk: false, originalBytes,
      error: `${file.name} is ${mb(file.size)} MB and could not be compressed under 10 MB. Try exporting it smaller.`,
    };
  } finally {
    bitmap.close?.();
  }
}
