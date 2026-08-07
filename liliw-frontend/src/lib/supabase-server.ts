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
