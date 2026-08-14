/**
 * Stamps the current build into public/sw.js before `next build`.
 *
 * A browser reinstalls a service worker only when the worker's own bytes
 * differ from the copy it already has. With a fixed version string the worker
 * installed once, on a visitor's first ever visit, and never again — so the
 * pages it had precached that day were the pages it kept serving offline
 * forever, however many times the site was deployed since.
 *
 * Changing one constant per deploy is enough to make the browser notice.
 *
 * Locally there is no commit SHA in the environment, so the stamp stays 'dev'
 * and the file in git is left untouched — running a local build does not show
 * up as a modified file.
 */
import fs from 'node:fs';
import path from 'node:path';

const SW = path.resolve(import.meta.dirname, '..', 'public', 'sw.js');

const build =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.GITHUB_SHA?.slice(0, 12) ||
  'dev';

const src = fs.readFileSync(SW, 'utf8');
const next = src.replace(/^const BUILD = '.*';$/m, `const BUILD = '${build}';`);

if (next === src && build !== 'dev') {
  // Loud, not silent: if the marker ever stops matching, the worker quietly
  // freezes again and nobody finds out until the offline copy is months old.
  console.error('[stamp-sw] Could not find the BUILD line in public/sw.js — the service worker will not update.');
  process.exit(1);
}

fs.writeFileSync(SW, next);
console.log(`[stamp-sw] service worker build = ${build}`);
