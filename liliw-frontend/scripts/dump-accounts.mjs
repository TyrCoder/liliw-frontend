/**
 * Writes a snapshot of every account in the system to docs/accounts.md.
 *
 * Reads the same two variables the server does, out of .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (service_role — profiles is behind RLS)
 *
 *   node scripts/dump-accounts.mjs
 *
 * The output holds real email addresses, so it is written to a gitignored
 * path. Keep it out of the repository and off shared drives.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Put both in .env.local (Supabase → Settings → API) and run again.',
  );
  process.exit(1);
}

// The anon key can read almost nothing here — say so now rather than emit an
// empty file that looks like an empty database.
if (!key.startsWith('sb_secret_') && !/"role":"service_role"/.test(
  Buffer.from((key.split('.')[1] ?? ''), 'base64').toString(),
)) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not a service_role key — profiles is behind RLS and will read as empty.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

/** The four slugs every access gate in the app checks for. */
const KNOWN_ROLES = ['admin', 'chatoofficer', 'chatoeditor', 'authenticated'];

const ROLE_LABELS = {
  admin:         'Admin',
  chatoofficer:  'CHATO Officer',
  chatoeditor:   'CHATO Editor',
  authenticated: 'Tourist / Visitor',
};

const fail = (what, error) => {
  console.error(`Could not read ${what}: ${error.message}`);
  process.exit(1);
};

const { data: profiles, error: pErr } = await db
  .from('profiles')
  .select('id, email, username, role, created_at')
  .order('created_at', { ascending: true });
if (pErr) fail('profiles', pErr);

const { data: lbo, error: lErr } = await db
  .from('lbo_applications')
  .select('email, owner_name, business_name, status, created_at')
  .order('created_at', { ascending: true });
if (lErr) console.warn(`Skipping LBO applications: ${lErr.message}`);

const byRole = (role) => (profiles ?? []).filter((p) => p.role === role);
const unknown = (profiles ?? []).filter((p) => !KNOWN_ROLES.includes(p.role));
const lboByEmail = new Map((lbo ?? []).map((a) => [String(a.email || '').toLowerCase(), a]));

const date = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '—');
const cell = (v) => String(v ?? '—').replace(/\|/g, '\\|');

const table = (rows, cols) => [
  `| ${cols.map((c) => c[0]).join(' | ')} |`,
  `| ${cols.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${cols.map((c) => cell(c[1](r))).join(' | ')} |`),
].join('\n');

const STAFF_COLS = [
  ['Email',    (p) => p.email],
  ['Username', (p) => p.username],
  ['Slug',     (p) => `\`${p.role}\``],
  ['Created',  (p) => date(p.created_at)],
];

const out = [];
out.push('# Account register');
out.push('');
out.push(`Snapshot taken ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. ` +
         'Regenerate with `node scripts/dump-accounts.mjs`.');
out.push('');
out.push('Contains real email addresses — gitignored on purpose. Do not commit or share.');
out.push('');
out.push('## Totals');
out.push('');
out.push(table(
  [...KNOWN_ROLES.map((r) => ({ role: ROLE_LABELS[r], slug: r, n: byRole(r).length })),
   { role: 'LBO applications', slug: 'lbo_applications', n: (lbo ?? []).length }],
  [['Role', (r) => r.role], ['Slug', (r) => `\`${r.slug}\``], ['Accounts', (r) => r.n]],
));
out.push('');

for (const role of ['admin', 'chatoofficer', 'chatoeditor']) {
  const rows = byRole(role);
  out.push(`## ${ROLE_LABELS[role]} — ${rows.length}`);
  out.push('');
  out.push(rows.length ? table(rows, STAFF_COLS) : '_None._');
  out.push('');
}

out.push(`## Local Business Owners — ${(lbo ?? []).length} application(s)`);
out.push('');
out.push((lbo ?? []).length
  ? table(lbo, [
      ['Business', (a) => a.business_name],
      ['Owner',    (a) => a.owner_name],
      ['Email',    (a) => a.email],
      ['Status',   (a) => a.status],
      ['Has account', (a) => (profiles ?? []).some(
        (p) => p.email?.toLowerCase() === String(a.email || '').toLowerCase()) ? 'yes' : 'no'],
      ['Applied',  (a) => date(a.created_at)],
    ])
  : '_None._');
out.push('');

const tourists = byRole('authenticated');
out.push(`## Tourists / Visitors — ${tourists.length}`);
out.push('');
out.push(tourists.length
  ? table(tourists, [
      ['Email',    (p) => p.email],
      ['Username', (p) => p.username],
      ['LBO applicant', (p) => lboByEmail.has(String(p.email || '').toLowerCase()) ? 'yes' : '—'],
      ['Created',  (p) => date(p.created_at)],
    ])
  : '_None._');
out.push('');

// The reason this section exists: profiles.role is plain TEXT with no
// constraint, so a hand-edited row can hold a slug no gate recognises — the
// account then signs in normally and is bounced off /admin and /cms with no
// error to explain why.
out.push(`## Unrecognised role slugs — ${unknown.length}`);
out.push('');
out.push(unknown.length
  ? table(unknown, STAFF_COLS) + '\n\n' +
    'These accounts have no staff access. Fix by setting the role through ' +
    'Admin → Role Management, or with:\n\n' +
    '```sql\nupdate profiles set role = \'chatoofficer\' where email = \'…\';\n```'
  : '_None — every account carries a slug the access gates recognise._');
out.push('');

const target = path.join(ROOT, 'docs', 'accounts.md');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out.join('\n'));

console.log(
  `Wrote ${path.relative(process.cwd(), target)} — ` +
  `${(profiles ?? []).length} account(s), ${(lbo ?? []).length} LBO application(s)` +
  (unknown.length ? `, ${unknown.length} with an unrecognised role slug.` : '.'),
);
