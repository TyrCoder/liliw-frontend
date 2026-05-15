import { createClient } from '@supabase/supabase-js';

// Server-only client — uses service role key to bypass RLS.
// Falls back to anon key if service role key is not set (still needs permissive RLS policies).
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);
