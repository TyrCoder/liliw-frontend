/**
 * The narrations Gat Tayaw can read, in one place.
 *
 * Two things have to agree about this list and they used to be strangers: the
 * scripts and audio files in the storyteller component, and the story page
 * that decides which of them to play. The decision was made by looking for
 * words in the slug and title — "church", "tsinelas", "ancestral", "legend" —
 * so a story named anything else quietly fell back to whatever its category
 * mapped to. A piece about weaving would be narrated with the ancestral houses
 * script, with nothing anywhere reporting a mismatch.
 *
 * An editor picks the narration now, and the keyword guess is only what
 * happens when they have not. Adding one means adding it here, adding its two
 * audio files, and adding its script to NARRATIONS in GatTayaw — no other
 * file needs to change, and the CMS dropdown updates itself.
 */

export const NARRATION_KEYS = [
  'welcome',
  'legend',
  'church',
  'ancestral',
  'tsinelas',
] as const;

export type NarrationKey = (typeof NARRATION_KEYS)[number];

/** What an editor sees in the dropdown, rather than the bare file stem. */
export const NARRATION_LABELS: Record<NarrationKey, string> = {
  welcome:   'Welcome to Liliw (general)',
  legend:    'The Legend of Liliw',
  church:    'The Parish Church',
  ancestral: 'Ancestral Houses',
  tsinelas:  'The Slipper Trade',
};

export const isNarrationKey = (v: unknown): v is NarrationKey =>
  typeof v === 'string' && (NARRATION_KEYS as readonly string[]).includes(v);

export type NarrationLang = 'en' | 'fil';

/**
 * Which narration belongs to a story.
 *
 * The editor's choice wins; the keyword search of the slug and title is the
 * fallback for everything published before that column existed. Lifted out of
 * the story page so the listing can ask the same question and get the same
 * answer — two places deciding this independently is how they drift.
 */
export function narrationFor(
  category: string,
  slug: string,
  title = '',
  chosen?: string | null,
): NarrationKey {
  if (isNarrationKey(chosen)) return chosen;

  const s = `${slug} ${title}`.toLowerCase();
  const c = (category || '').toLowerCase();

  if (s.includes('church') || s.includes('simbahan') || s.includes('parish'))   return 'church';
  if (s.includes('tsinelas') || s.includes('slipper') || s.includes('sapatos')) return 'tsinelas';
  if (s.includes('ancestral') || s.includes('bahay') || s.includes('house'))    return 'ancestral';
  if (s.includes('legend') || s.includes('alamat') || s.includes('myth'))       return 'legend';

  if (c === 'history') return 'legend';
  if (c === 'culture') return 'ancestral';
  if (c === 'people')  return 'welcome';
  return 'welcome';
}

/**
 * The file for a narration in a language, or nothing.
 *
 * `welcome` has no recording. It was the one narration with no Filipino
 * counterpart and no story to attach it to, so it could never be replaced
 * through the CMS the way the others now can — it has been retired as audio
 * and kept only as the words in Gat Tayaw's bubble.
 *
 * An empty string means "there is nothing to play", and callers are expected
 * to hide the control rather than offer a button that does nothing. Silence
 * behind a Listen button is the failure nobody reports, because it looks
 * exactly like a recording that has not started yet.
 */
export const narrationSrc = (key: NarrationKey, lang: NarrationLang): string =>
  key === 'welcome' ? '' : `/audio/${key}-${lang}.mp3`;

/** Whether a narration has a recording at all, in any language. */
export const hasRecording = (key: NarrationKey): boolean => key !== 'welcome';

/**
 * The recording to play for a story, in a language.
 *
 * An uploaded file wins over the built-in one. The two languages are decided
 * independently on purpose: a story may have English recorded and Filipino
 * still to come, and it should play the new English rather than wait for the
 * pair to be complete.
 *
 * Falling back to the built-in recording is what keeps every story published
 * before uploads existed working exactly as it did.
 */
export function storyNarrationSrc(
  story: {
    category: string; slug: string; title: string;
    audio_key?: string | null; audio_en?: string | null; audio_fil?: string | null;
  },
  lang: NarrationLang,
): string {
  const uploaded = (lang === 'fil' ? story.audio_fil : story.audio_en)?.trim();
  if (uploaded) return uploaded;
  return narrationSrc(narrationFor(story.category, story.slug, story.title, story.audio_key), lang);
}
