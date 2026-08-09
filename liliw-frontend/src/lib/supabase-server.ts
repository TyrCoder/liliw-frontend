import { createClient } from '@supabase/supabase-js';

/**
 * Server-only client. It is expected to hold the service role key, which
 * bypasses RLS — every API route that writes on a user's behalf depends on it.
 *
 * It used to fall back to the anon key when the service role key was missing.
 * That fallback is why saving a profile failed with "new row violates
 * row-level security policy": the deployment had no SUPABASE_SERVICE_ROLE_KEY,
 * so the whole server-side API quietly ran with anon privileges and every
 * protected write failed as a policy error, miles from the actual cause.
 *
 * Missing configuration is now stated once, plainly, rather than degraded into
 * a class of errors that look like a database problem.
 */
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to the anon key, ' +
    'which cannot bypass RLS — writes to protected tables will fail with policy errors. ' +
    'Set it in the deployment environment.',
  );
} else if (keyRole(process.env.SUPABASE_SERVICE_ROLE_KEY) !== 'service_role') {
  console.error(
    '[supabase-server] SUPABASE_SERVICE_ROLE_KEY is set but reads as ' +
    `"${keyRole(process.env.SUPABASE_SERVICE_ROLE_KEY)}", not service_role. It cannot bypass ` +
    'RLS, so protected writes will fail as policy errors. Copy the service_role key from ' +
    'Supabase → Settings → API.',
  );
}

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key!,
  { auth: { persistSession: false } },
);

/**
 * What the key actually is, rather than which variable it arrived in.
 *
 * Supabase issues two shapes: legacy JWTs carrying a `role` claim, and the
 * newer `sb_secret_…` / `sb_publishable_…` strings. Both are read here so that
 * setting SUPABASE_SERVICE_ROLE_KEY to the wrong value — the anon key pasted
 * into the service role slot, which looks correct in a dashboard and is easy
 * to do — is detected as anon rather than trusted as elevated.
 */
export function keyRole(k: string | undefined): 'service_role' | 'anon' | 'unknown' {
  if (!k) return 'unknown';
  if (k.startsWith('sb_secret_')) return 'service_role';
  if (k.startsWith('sb_publishable_')) return 'anon';
  try {
    const payload = JSON.parse(Buffer.from(k.split('.')[1], 'base64').toString());
    return payload.role === 'service_role' ? 'service_role' : payload.role === 'anon' ? 'anon' : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * True when the client can actually bypass RLS.
 *
 * Deliberately not `!!process.env.SUPABASE_SERVICE_ROLE_KEY` — that only says
 * the variable is set, so a wrong value read as elevated and every diagnostic
 * built on it pointed away from the real problem.
 */
export const hasServiceRole = keyRole(key) === 'service_role';

/**
 * Turns a database error into something that names the actual cause.
 *
 * A missing service role key surfaces as "new row violates row-level security
 * policy for table X", which reads as a database misconfiguration and sends
 * people to look at policies. It has now cost two rounds of investigation.
 * When we already know the key is absent, say so instead — the policies are
 * fine, the server simply is not allowed to bypass them.
 *
 * Verified against the live database: every cms_* table refuses an insert from
 * the anon key and accepts one from the service role, so an RLS error on a
 * write is this, not a per-table policy gap.
 */
export function explainDbError(error: { code?: string; message: string } | null): string {
  if (!error) return '';
  const isRls = error.code === '42501' || /row-level security/i.test(error.message);
  if (isRls && !hasServiceRole) {
    const set = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    return set
      ? 'The server has a SUPABASE_SERVICE_ROLE_KEY, but it is not a service role key — it reads '
        + `as "${keyRole(process.env.SUPABASE_SERVICE_ROLE_KEY)}", so it cannot bypass RLS. Copy the `
        + 'service_role key from Supabase → Settings → API into that variable and redeploy. The '
        + 'content itself is fine.'
      : 'The server is running without SUPABASE_SERVICE_ROLE_KEY, so it cannot write to the '
        + 'database. Add it to the deployment environment (Production scope) and redeploy — '
        + 'the content itself is fine.';
  }
  return error.message;
}
