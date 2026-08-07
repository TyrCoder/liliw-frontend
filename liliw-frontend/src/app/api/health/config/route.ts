import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer, hasServiceRole } from '@/lib/supabase-server';

/**
 * Reports what the running server actually has configured.
 *
 * Added because "new row violates row-level security policy" turned out to be
 * a missing service role key rather than a policy problem, and there was no way
 * to tell those apart from the outside — the same error appears whether the
 * key is absent, wrong, or genuinely unprivileged. Guessing at that from a
 * screenshot cost more than this endpoint does.
 *
 * Presence only. No value is ever returned, and the key's own claims are read
 * from the JWT payload, which says what role it grants without revealing the
 * signature that makes it work.
 */
export async function GET(req: NextRequest) {
  if (!await requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const present = (name: string) => !!process.env[name];

  // A Supabase key is a JWT; its middle segment names the role it acts as.
  let keyRole: string | null = null;
  let keyProject: string | null = null;
  try {
    const raw = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    const claims = JSON.parse(Buffer.from(raw.split('.')[1], 'base64url').toString());
    keyRole = claims.role ?? null;
    keyProject = claims.ref ?? null;
  } catch { /* not a JWT we can read — leave null */ }

  // Does the key in use actually bypass RLS right now? A harmless read of a
  // table anon cannot see answers that better than any amount of inspection.
  let canBypassRls: boolean | null = null;
  let rlsProbeError: string | null = null;
  try {
    const { error } = await supabaseServer.from('tourist_profiles').select('email').limit(1);
    canBypassRls = !error;
    rlsProbeError = error?.message ?? null;
  } catch (e) {
    canBypassRls = false;
    rlsProbeError = e instanceof Error ? e.message : 'probe failed';
  }

  return NextResponse.json({
    supabase: {
      urlSet: present('NEXT_PUBLIC_SUPABASE_URL'),
      anonKeySet: present('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKeySet: hasServiceRole,
      keyInUseRole: keyRole,
      keyProjectRef: keyProject,
      canReadProtectedTable: canBypassRls,
      probeError: rlsProbeError,
    },
    other: {
      sessionSecretSet: present('SESSION_SECRET'),
      cloudinarySet: present('CLOUDINARY_NAME') && present('CLOUDINARY_SECRET'),
      groqSet: present('GROQ_API_KEY'),
      resendSet: present('RESEND_API_KEY'),
      adminEmailsSet: present('ADMIN_EMAILS') || present('NEXT_PUBLIC_ADMIN_EMAILS'),
    },
    // If serviceRoleKeySet is false, that is the answer: set
    // SUPABASE_SERVICE_ROLE_KEY in the deployment environment and redeploy.
    // Vercel only applies environment changes to builds made after them.
    hint: hasServiceRole
      ? 'Service role key is present.'
      : 'SUPABASE_SERVICE_ROLE_KEY is missing from this deployment — set it in Vercel (Production scope) and redeploy.',
  });
}
