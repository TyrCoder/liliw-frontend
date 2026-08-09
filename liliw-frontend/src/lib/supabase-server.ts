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
}

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key!,
  { auth: { persistSession: false } },
);

/** True when the server client actually has elevated rights. */
export const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    return 'The server is running without SUPABASE_SERVICE_ROLE_KEY, so it cannot write to the '
         + 'database. Add it to the deployment environment (Production scope) and redeploy — '
         + 'the content itself is fine.';
  }
  return error.message;
}
