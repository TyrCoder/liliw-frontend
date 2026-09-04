/**
 * The rules for a username and a password, in one place.
 *
 * They used to live only in AuthModal, as two `if`s before the fetch. Anything
 * posting straight to /api/auth/register met no rules at all beyond Supabase's
 * own six-character floor — so the strength meter on the form was decoration,
 * not a control. Both the form and the route import these now, and they cannot
 * disagree.
 */

export const PASSWORD_MIN = 8;

/** The four character classes a password has to draw from. */
const CLASSES: { test: RegExp; label: string }[] = [
  { test: /[a-z]/,                     label: 'a lowercase letter' },
  { test: /[A-Z]/,                     label: 'an uppercase letter' },
  { test: /[0-9]/,                     label: 'a number' },
  { test: /[^A-Za-z0-9]/,              label: 'a special character' },
];

/**
 * Returns null when the password is acceptable, or the reason it is not.
 *
 * One sentence naming everything still missing, rather than one rule at a
 * time: being told about the missing capital, fixing it, and then being told
 * about the missing digit is how people give up on a form.
 */
export function passwordProblem(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }

  const missing = CLASSES.filter(c => !c.test.test(password)).map(c => c.label);
  if (!missing.length) return null;

  const list = missing.length === 1
    ? missing[0]
    : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`;

  return `Password needs ${list}.`;
}

/**
 * Usernames: letters, numbers and hyphens, 3–20 characters.
 *
 * Hyphen rather than underscore, and not at either end — a name like '-liliw-'
 * reads as a typo and looks wrong everywhere it is printed.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{1,18}[A-Za-z0-9])?$/;

export function usernameProblem(username: string): string | null {
  if (!username || username.length < 3 || username.length > 20) {
    return 'Username must be 3–20 characters.';
  }
  if (/_/.test(username)) {
    return 'Usernames use hyphens rather than underscores.';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can use letters, numbers and hyphens, starting and ending with a letter or number.';
  }
  return null;
}

/** What the form strips as the visitor types, so the field cannot hold anything invalid. */
export const USERNAME_ALLOWED = /[^A-Za-z0-9-]/g;
