/**
 * Backs up every table Supabase serves, to timestamped JSON.
 *
 *   node scripts/backup-database.mjs
 *
 * The table list is read from PostgREST's own schema rather than hardcoded, so
 * a table added later is backed up without anyone remembering to add it here —
 * a hand-maintained list is exactly the kind that goes stale and is discovered
 * to be stale on the day it matters.
 *
 * Rows are fetched in pages of 1000 because that is PostgREST's ceiling; asking
 * for everything silently returns the first 1000 and looks like a complete
 * backup. page_views alone is past that.
 *
 * Writes OUTSIDE the repository, to ../liliw-backups. The dump contains real
 * names, emails and check-in locations, and a backup committed to a public
 * repo would be worse than no backup at all.
 *
 * This is a data dump, not a full restore image: it does not carry schema,
 * policies, functions or auth users. Keep the SQL files in supabase/ for the
 * schema, and see the note at the end for the pg_dump route.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function readEnv() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) {
    console.error('No .env.local found — run this from the project.');
    process.exit(1);
  }
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

const env = readEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const PAGE = 1000;

async function tableNames() {
  const res = await fetch(`${URL_}/rest/v1/`, { headers });
  if (!res.ok) throw new Error(`Could not read the schema (${res.status})`);
  const spec = await res.json();
  return Object.keys(spec.definitions ?? spec.components?.schemas ?? {}).sort();
}

async function dumpTable(name) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${URL_}/rest/v1/${name}?select=*`, {
      headers: { ...headers, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.join(ROOT, '..', '..', 'liliw-backups', stamp);
fs.mkdirSync(outDir, { recursive: true });

const summary = [];
let failed = 0;

for (const name of await tableNames()) {
  try {
    const rows = await dumpTable(name);
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(rows, null, 2));
    summary.push({ table: name, rows: rows.length });
    console.log(`  ${name.padEnd(28)} ${String(rows.length).padStart(6)} rows`);
  } catch (err) {
    // Reported, not swallowed. A backup that skipped a table quietly is the
    // one you discover was incomplete while trying to restore from it.
    failed++;
    summary.push({ table: name, error: String(err.message ?? err) });
    console.error(`  ${name.padEnd(28)} FAILED — ${err.message ?? err}`);
  }
}

fs.writeFileSync(
  path.join(outDir, '_manifest.json'),
  JSON.stringify({ takenAt: new Date().toISOString(), project: URL_, tables: summary }, null, 2),
);

const total = summary.reduce((n, t) => n + (t.rows ?? 0), 0);
console.log(`\n${summary.length - failed} tables, ${total} rows -> ${outDir}`);
if (failed) console.error(`${failed} table(s) failed — the backup is incomplete.`);
process.exit(failed ? 1 : 0);
