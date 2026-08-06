/**
 * In-browser screening for custom avatars.
 *
 * Cloudinary's AI moderation needs a paid Rekognition subscription this
 * account does not have, so the check runs client-side with NSFWJS instead.
 * Two consequences worth being clear about:
 *
 *  - It is advisory. Anyone can POST straight to /api/user/avatar and skip it.
 *    The server still enforces identity, size and MIME type; this stops a
 *    picture reaching other people's screens, not a determined uploader.
 *    A moderator clearing an avatar after the fact is the real backstop.
 *
 *  - The model is ~2MB. It is imported dynamically so it only downloads when
 *    someone actually opens the picker, never on a normal page load.
 */

export type ScreenVerdict =
  | { ok: true }
  | { ok: false; reason: string }
  | { ok: true; skipped: true };

// NSFWJS returns five classes. Porn and Hentai are refused outright; Sexy is
// borderline by design (swimwear scores here), so it needs a high score before
// it counts — a beach holiday photo is a legitimate avatar for a tourism site.
const HARD_LIMIT = 0.55;
const SEXY_LIMIT = 0.85;

let modelPromise: Promise<any> | null = null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [nsfw] = await Promise.all([
        import('nsfwjs'),
        import('@tensorflow/tfjs'),
      ]);
      // MobileNetV2 is the small one — accurate enough for a first pass and a
      // fraction of the download of the Inception model.
      return nsfw.load('MobileNetV2Mid');
    })().catch(err => {
      // Let a later attempt retry rather than caching the failure forever.
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

function toImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

export async function screenAvatar(file: File): Promise<ScreenVerdict> {
  let model: any;
  try {
    model = await getModel();
  } catch {
    // Offline, blocked, or the model host is down. Refusing every upload
    // because a best-effort check could not run would be worse than letting
    // it through — the moderator backstop still applies.
    return { ok: true, skipped: true };
  }

  try {
    const img = await toImage(file);
    const predictions: { className: string; probability: number }[] = await model.classify(img);
    const score = (name: string) =>
      predictions.find(p => p.className === name)?.probability ?? 0;

    if (score('Porn') > HARD_LIMIT || score('Hentai') > HARD_LIMIT) {
      return { ok: false, reason: 'That image looks explicit, so it cannot be used as a profile picture.' };
    }
    if (score('Sexy') > SEXY_LIMIT) {
      return { ok: false, reason: 'That image is too suggestive for a profile picture here.' };
    }
    return { ok: true };
  } catch {
    return { ok: true, skipped: true };
  }
}
