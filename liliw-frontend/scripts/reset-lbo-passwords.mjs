/**
 * Sets a fresh password on every approved LBO account and writes the list to
 * docs/lbo-credentials.md.
 *
 * For the case where the original passwords are gone: they were typed by an
 * admin at approval time and emailed as a temporary password
 * (src/app/api/admin/lbo-register/route.ts), and Supabase stores only a bcrypt
 * hash — so there is nothing to recover and a reset is the only route.
 *
 *   node scripts/reset-lbo-passwords.mjs            # dry run — changes nothing
 *   node scripts/reset-lbo-passwords.mjs --confirm  # actually sets them
 *
 * One shared password across every LBO account by default. These are
 * placeholder accounts operated by the research team rather than logins
 * belonging to 34 separate people, so a per-account password would only mean
 * looking up a table on every switch. Two overrides:
 *
 *   --password=<value>   use a password you choose instead of a generated one
 *   --unique             go back to a different password per account
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The output holds live credentials in plaintext; it is written to a gitignored
 * path. Hand each owner their own line and delete the file afterwards.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const CONFIRMED = process.argv.includes('--confirm');
const UNIQUE    = process.argv.includes('--unique');
const CHOSEN    = process.argv.find((a) => a.startsWith('--password='))?.slice('--password='.length);

if (CHOSEN && CHOSEN.length < 6) {
  console.error('--password must be at least 6 characters — Supabase rejects anything shorter.');
  process.exit(1);
}
if (CHOSEN && UNIQUE) {
  console.error('--password and --unique contradict each other. Pick one.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

/**
 * Readable rather than maximally random: these get read aloud, written on
 * paper and typed on a phone by business owners. Ambiguous characters are out
 * — no O/0, l/1, I — and the shape stays constant so a mistyped one is easy to
 * spot.
 */
const WORDS = ['liliw', 'tsinelas', 'gubat', 'bundok', 'sampaguita', 'ilog', 'bulaklak', 'dagat'];
function makePassword() {
  const word = WORDS[crypto.randomInt(WORDS.length)];
  const digits = String(crypto.randomInt(1000, 10000));
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const tag = letters[crypto.randomInt(letters.length)] + letters[crypto.randomInt(letters.length)];
  return `${word}-${digits}-${tag}`;
}

const { data: apps, error: appErr } = await db
  .from('lbo_applications')
  .select('email, business_name, owner_name, status')
  .eq('status', 'approved')
  .order('business_name');

if (appErr) {
  console.error(`Could not read lbo_applications: ${appErr.message}`);
  process.exit(1);
}

if (!apps?.length) {
  console.log('No approved LBO applications found — nothing to reset.');
  process.exit(0);
}

// profiles carries the auth user id, which is what updateUserById needs.
const { data: profiles, error: profErr } = await db.from('profiles').select('id, email');
if (profErr) {
  console.error(`Could not read profiles: ${profErr.message}`);
  process.exit(1);
}
const idByEmail = new Map((profiles ?? []).map((p) => [String(p.email || '').toLowerCase(), p.id]));

// Generated once, up here, so every account below receives the same one.
const shared = UNIQUE ? null : (CHOSEN ?? makePassword());

console.log(
  CONFIRMED
    ? `Resetting ${apps.length} approved LBO account(s).`
    : `DRY RUN — ${apps.length} approved LBO account(s) would be reset. Re-run with --confirm to apply.`,
);
console.log(shared ? `Shared password: ${shared}\n` : 'A different password per account.\n');

const results = [];
for (const app of apps) {
  const email = String(app.email || '').toLowerCase();
  const id = idByEmail.get(email);

  if (!id) {
    // An approved application with no account behind it — the owner was never
    // registered, so there is no password to reset. Worth surfacing rather
    // than skipping silently.
    results.push({ ...app, password: null, note: 'no account — never registered' });
    console.warn(`  skipped  ${app.business_name} — no profile for ${email}`);
    continue;
  }

  const password = shared ?? makePassword();

  if (CONFIRMED) {
    const { error } = await db.auth.admin.updateUserById(id, { password });
    if (error) {
      results.push({ ...app, password: null, note: `failed — ${error.message}` });
      console.error(`  FAILED   ${app.business_name}: ${error.message}`);
      continue;
    }
  }

  results.push({ ...app, password, note: CONFIRMED ? 'reset' : 'dry run — not applied' });
  console.log(`  ${CONFIRMED ? 'reset   ' : 'would set'} ${app.business_name}`);
}

const cell = (v) => String(v ?? '—').replace(/\|/g, '\\|');
const lines = [
  '# LBO credentials',
  '',
  CONFIRMED
    ? `Passwords set ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`
    : `DRY RUN ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC — these were **not** applied.`,
  '',
  '**Live credentials in plaintext.** Gitignored on purpose. Delete this file once',
  'the testing round is over.',
  '',
  ...(shared
    ? [`One password for every account below:`, '', `    ${shared}`, '',
       'Sign in with the business email and this password.', '']
    : ['Each account has its own password.', '']),
  '| Business | Owner | Email | Password | Result |',
  '| --- | --- | --- | --- | --- |',
  ...results.map((r) => `| ${cell(r.business_name)} | ${cell(r.owner_name)} | ${cell(r.email)} | ${cell(r.password)} | ${cell(r.note)} |`),
  '',
  'Owners should change this at first sign-in.',
  '',
];

const target = path.join(ROOT, 'docs', 'lbo-credentials.md');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, lines.join('\n'));

console.log(`\nWrote ${path.relative(process.cwd(), target)}.`);
if (!CONFIRMED) console.log('Nothing was changed. Re-run with --confirm to apply.');
