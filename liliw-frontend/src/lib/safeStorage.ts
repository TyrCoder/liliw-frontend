/**
 * localStorage and sessionStorage, for browsers that refuse them.
 *
 * Reading either is not always allowed. Safari in private browsing, and any
 * browser set to block site data, throw a SecurityError on the very first
 * access rather than returning null — and `typeof window !== 'undefined'`
 * does not help, because the window is there and the storage is what is
 * refused.
 *
 * Four places read storage on every page: the auth provider, the navbar's
 * notification marker, the install prompt, and the analytics session id. All
 * four are mounted app-wide, and the auth provider wraps everything, so one
 * unguarded read took the whole site down to a blank page on those devices
 * with nothing on screen saying why.
 *
 * A refusal is treated as "nothing stored", which is what it means for anyone
 * browsing that way: no cached session, no remembered dismissal, a fresh
 * analytics id per page. The site works; it just remembers nothing.
 */

function wrap(pick: () => Storage) {
  return {
    get(key: string): string | null {
      try { return pick().getItem(key); } catch { return null; }
    },
    set(key: string, value: string): void {
      try { pick().setItem(key, value); } catch { /* nothing can be kept */ }
    },
    remove(key: string): void {
      try { pick().removeItem(key); } catch { /* already unreachable */ }
    },
  };
}

export const safeLocal   = wrap(() => localStorage);
export const safeSession = wrap(() => sessionStorage);
