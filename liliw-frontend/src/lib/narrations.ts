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
 * The file for a narration in a language.
 *
 * `welcome` is the exception and deliberately so: it was recorded once, with
 * no Filipino counterpart, so asking for welcome in Filipino returns the only
 * recording there is rather than a path that 404s. Everything else exists in
 * both.
 */
export const narrationSrc = (key: NarrationKey, lang: NarrationLang): string =>
  key === 'welcome' ? '/audio/welcome.mp3' : `/audio/${key}-${lang}.mp3`;

/** Whether a narration can actually be heard in this language. */
export const hasLanguage = (key: NarrationKey, lang: NarrationLang): boolean =>
  key !== 'welcome' || lang === 'en';
