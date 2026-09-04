/**
 * What the CMS will accept into a content entry.
 *
 * The create route checked that a label was present and nothing else, so an
 * attraction called "asdad" with letters in its latitude was a valid entry as
 * far as the server was concerned — it reached the approval queue, and the
 * audit log has two of them.
 *
 * These are guards against mistakes and mashing, not a judgement of whether a
 * place is real. Nothing here can tell that "Casita Carlo" is a typo, which is
 * exactly why the approval step exists.
 */

const LABEL_MIN = 3;
const LABEL_MAX = 120;

/** Runs of adjacent keys — how a mashed name usually looks. */
const KEYBOARD_RUNS = [
  'qwer', 'wert', 'erty', 'rtyu', 'tyui', 'yuio', 'uiop',
  'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl',
  'zxcv', 'xcvb', 'cvbn', 'vbnm',
  'asd', 'sdf', 'qwe', 'zxc', 'jkl',
  '1234', '2345', 'abcd',
];

/**
 * Whether a name looks typed rather than chosen.
 *
 * Deliberately conservative: a false positive blocks a real place, which is
 * worse than letting one piece of nonsense through to a human reviewer.
 */
function looksLikeNonsense(value: string): boolean {
  const v = value.toLowerCase().trim();
  const letters = v.replace(/[^a-z]/g, '');

  // Too short to judge — the length rule already covers it.
  if (letters.length < 4) return false;

  // "aaaa", "ssss"
  if (/(.)\1{2,}/.test(letters)) return true;

  // No vowel at all in a word of any length: not a name anyone says out loud.
  // Filipino place names are vowel-rich, so this is safe here.
  if (!/[aeiou]/.test(letters)) return true;

  // A run of adjacent keys anywhere in it — this is what catches "asdad".
  if (KEYBOARD_RUNS.some(run => v.includes(run))) return true;

  return false;
}

/** Numeric fields, with the range each one has to fall in. */
const NUMERIC: Record<string, { label: string; min?: number; max?: number; integer?: boolean }> = {
  latitude:      { label: 'Latitude',  min: -90,  max: 90 },
  longitude:     { label: 'Longitude', min: -180, max: 180 },
  map_lat:       { label: 'Latitude',  min: -90,  max: 90 },
  map_lng:       { label: 'Longitude', min: -180, max: 180 },
  rating:        { label: 'Rating',    min: 0,    max: 5 },
  sort_order:    { label: 'Sort order', min: 0, integer: true },
  duration_days: { label: 'Duration in days', min: 0, max: 365, integer: true },
};

/**
 * Returns null when the entry is acceptable, or the first reason it is not.
 *
 * `label` is the entry's title, already resolved by the caller — the column
 * differs per content type (`question` for FAQs, `name` for attractions).
 */
export function contentProblem(label: unknown, body: Record<string, unknown>): string | null {
  const name = String(label ?? '').trim();

  if (name.length < LABEL_MIN) return `Name must be at least ${LABEL_MIN} characters.`;
  if (name.length > LABEL_MAX) return `Name must be under ${LABEL_MAX} characters.`;
  if (!/[A-Za-z]/.test(name))  return 'Name must contain letters, not only numbers or symbols.';
  if (looksLikeNonsense(name)) {
    return 'That name does not look like a real place. Please enter the name as people would say it.';
  }

  for (const [field, rule] of Object.entries(NUMERIC)) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') continue;

    // Rejected rather than coerced: Number('') is 0 and Number('12abc') is NaN,
    // and a latitude silently stored as 0 puts the pin in the Atlantic.
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isFinite(n)) return `${rule.label} must be a number.`;
    if (rule.integer && !Number.isInteger(n)) return `${rule.label} must be a whole number.`;
    if (rule.min !== undefined && n < rule.min) return `${rule.label} must be ${rule.min} or more.`;
    if (rule.max !== undefined && n > rule.max) return `${rule.label} must be ${rule.max} or less.`;
  }

  // A phone number is not a numeric field — it carries +, spaces and brackets —
  // but it should not carry words either.
  const phone = body.phone;
  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    const p = String(phone).trim();
    if (!/^[0-9+()\-\s]{7,20}$/.test(p)) {
      return 'Contact number can only contain digits, spaces, and + ( ) -';
    }
  }

  return null;
}
