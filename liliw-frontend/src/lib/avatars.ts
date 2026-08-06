/**
 * Profile avatars.
 *
 * The twelve illustrated defaults live in one sprite sheet rather than twelve
 * files: a single request, one thing to swap if the art is ever redrawn, and
 * picking one costs no storage at all. The sheet is 6 columns by 2 rows, so a
 * cell is addressed by background-position alone.
 *
 * A stored avatar is one string:
 *   'liliw-01' … 'liliw-12'  → a default, drawn from the sheet
 *   'https://…'              → a custom upload in Supabase Storage
 *   null / ''                → no choice made, fall back to initials
 */

export const AVATAR_SHEET = '/avatars/liliw-avatars.png';
export const AVATAR_COLS = 6;
export const AVATAR_ROWS = 2;

export type AvatarId = `liliw-${string}`;

export interface DefaultAvatar {
  id: AvatarId;
  /** Read aloud by screen readers and shown as the option's tooltip. */
  label: string;
  col: number;
  row: number;
}

// Ordered to match the sheet, left to right and top to bottom.
export const DEFAULT_AVATARS: DefaultAvatar[] = [
  { id: 'liliw-01', label: 'Visitor in a Liliw shirt',        col: 0, row: 0 },
  { id: 'liliw-02', label: 'Festival dancer',                 col: 1, row: 0 },
  { id: 'liliw-03', label: 'Tsinelas maker',                  col: 2, row: 0 },
  { id: 'liliw-04', label: 'Photographer',                    col: 3, row: 0 },
  { id: 'liliw-05', label: 'Hiker with a backpack',           col: 4, row: 0 },
  { id: 'liliw-06', label: 'Tourism officer',                 col: 5, row: 0 },
  { id: 'liliw-07', label: 'Traveller in a sun hat',          col: 0, row: 1 },
  { id: 'liliw-08', label: 'Cafe barista',                    col: 1, row: 1 },
  { id: 'liliw-09', label: 'Weaver with a woven sash',        col: 2, row: 1 },
  { id: 'liliw-10', label: 'Festival performer',              col: 3, row: 1 },
  { id: 'liliw-11', label: 'Student with a guidebook',        col: 4, row: 1 },
  { id: 'liliw-12', label: 'Local with a sampaguita flower',  col: 5, row: 1 },
];

const byId = new Map(DEFAULT_AVATARS.map(a => [a.id, a]));

export const isDefaultAvatar = (v: string | null | undefined): v is AvatarId =>
  !!v && byId.has(v as AvatarId);

export const isCustomAvatar = (v: string | null | undefined): boolean =>
  !!v && /^https:\/\//.test(v);

/** Whatever is stored, is it something we can actually draw? */
export const hasAvatar = (v: string | null | undefined): boolean =>
  isDefaultAvatar(v) || isCustomAvatar(v);

/**
 * Background rules that crop the sheet down to one cell.
 *
 * With six columns the stops land at 0%, 20%, 40%, 60%, 80%, 100% — positions
 * are a share of the *leftover* space, not of the image, which is why the
 * divisor is one less than the column count.
 */
export function spriteStyle(id: string): React.CSSProperties | null {
  const a = byId.get(id as AvatarId);
  if (!a) return null;
  return {
    backgroundImage: `url(${AVATAR_SHEET})`,
    backgroundSize: `${AVATAR_COLS * 100}% ${AVATAR_ROWS * 100}%`,
    backgroundPosition: `${(a.col / (AVATAR_COLS - 1)) * 100}% ${(a.row / (AVATAR_ROWS - 1)) * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}

export const avatarLabel = (id: string): string => byId.get(id as AvatarId)?.label ?? 'Profile picture';

/** Guards what may be written to tourist_profiles.avatar. */
export function normaliseAvatar(value: unknown, allowedHost: string): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  if (isDefaultAvatar(value)) return value;
  // A custom avatar may only ever point at our own Storage bucket. Without
  // this the column would accept any URL on the internet and the site would
  // happily hotlink it from every profile and review.
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return null;
    if (u.host !== allowedHost) return null;
    if (!u.pathname.includes('/avatars/')) return null;
    return value;
  } catch {
    return null;
  }
}
