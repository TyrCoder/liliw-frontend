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
