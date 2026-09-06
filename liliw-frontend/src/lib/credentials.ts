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
 * Usernames: letters and numbers, 5–12 characters.
 *
 * Letters and numbers only. Separators were allowed before — hyphens in, and
 * underscores rejected with a message about it — which made two names that
 * read identically aloud into two different accounts, and gave the sign-up
 * form a rule it had to explain before anyone could get past it. There is
 * nothing to explain now.
 *
 * Only registration checks this. Sign-in matches on the stored name, so
 * accounts created under the older rule keep working.
 */
export const USERNAME_MIN = 5;
export const USERNAME_MAX = 12;

export const USERNAME_PATTERN = /^[A-Za-z0-9]{5,12}$/;

export function usernameProblem(username: string): string | null {
  if (!username || username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can use letters and numbers only.';
  }
  return null;
}

/** What the form strips as the visitor types, so the field cannot hold anything invalid. */
export const USERNAME_ALLOWED = /[^A-Za-z0-9]/g;
