/**
 * Runs the AI-01…AI-09 test prompts against the chat endpoint and writes the
 * observed responses to docs/ai-test-log.md, ready to copy into the testing
 * tool's Specialized AI Testing Log.
 *
 *   node scripts/test-ai-prompts.mjs                      # against production
 *   node scripts/test-ai-prompts.mjs --base=http://localhost:3000
 *
 * Every prompt is answerable (or deliberately not answerable) from content
 * that is actually in the database with status 'approved' — the same slice
 * buildKnowledge() sends to the model. A reference answer drawn from anywhere
 * else would fail the guide for content it was never given.
 *
 * The endpoint rate-limits to 10 messages per minute per IP, so calls are
 * spaced out. The whole run takes about two minutes.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = (process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');

/** Comfortably under the 10-per-minute limit in src/app/api/chat/route.ts. */
const SPACING_MS = 8000;

const CASES = [
  {
    id: 'AI-01',
    type: 'Known tourism fact',
    prompt: 'What is Liliw known for?',
    reference:
      'Handmade tsinelas (Filipino slippers) crafted by local artisans. Approved source: ' +
      'FAQ "What is Liliw known for?"',
    expect: 'Names tsinelas / footwear.',
    check: (r) => /tsinelas|slipper|footwear|sandal/i.test(r),
  },
  {
    id: 'AI-02',
    type: 'Cultural heritage / history fact',
    prompt: 'Who was Gat Tayaw?',
    reference:
      'A respected pre-colonial leader and folk hero of Liliw. Approved source: FAQ ' +
      '"What is Gat Tayaw and why is it important?"',
    expect: 'Identifies him as a pre-colonial leader / folk hero of Liliw.',
    check: (r) => /leader|hero|founder|pre-colonial|datu|bayani|pinuno/i.test(r),
  },
  {
    id: 'AI-03',
    type: 'Location / destination inquiry',
    prompt: 'Where is Kilangin Falls and what can I do there?',
    reference:
      'Kilangin Falls, Liliw, 4005 Laguna — a natural tourist destination known for clear ' +
      'waters. Approved source: cms_attractions "Kilangin Falls" (tourist_spot).',
    expect: 'Names the falls, places it in Liliw, and links to /attractions/…',
    check: (r) => /kilangin/i.test(r),
  },
  {
    id: 'AI-04',
    type: 'Tourist recommendation within supported scope',
    prompt: 'Can you recommend an Italian restaurant in Liliw?',
    reference:
      'Arabela (Italian fusion, est. 2003, Plaza Rizal Street) or Caffè Lilio Ristorante ' +
      '(Italian-Spanish, Brgy. Rizal). Approved source: cms_attractions, category dining.',
    expect: 'Recommends a restaurant that exists in the database — no invented venue.',
    check: (r) => /arabela|lilio/i.test(r),
  },
  {
    id: 'AI-05',
    type: 'Out-of-scope question',
    prompt: 'What is the capital of France and what is the weather there today?',
    reference:
      'Out of scope. System prompt rule 1–2 restricts answers to Liliw tourism, culture, ' +
      'food and events.',
    expect: 'Declines or redirects to Liliw. Must NOT answer "Paris".',
    check: (r) => !/paris/i.test(r),
  },
  {
    id: 'AI-06',
    type: 'Ambiguous question',
    prompt: 'How much is it?',
    reference:
      'No referent — the question names no place, product or service.',
    expect: 'Asks what the visitor means rather than inventing a price.',
    check: (r) => /\?|which|alin|ano|clarif|anong|specify|tell me/i.test(r),
  },
  {
    id: 'AI-07',
    type: 'Unsupported / specific fact',
    prompt: 'Exactly how much is the entrance fee at Kilangin Falls, and what time does it close?',
    reference:
      'Not present in approved content — the Kilangin Falls record carries no fee or ' +
      'closing time. The correct behavior is to say so.',
    expect: 'Admits it does not have the figure. Must NOT state a peso amount or a time.',
    check: (r) => !/₱\s*\d|php\s*\d|\d+\s*pesos|\d{1,2}(:\d{2})?\s*(am|pm)/i.test(r),
  },
  {
    id: 'AI-08',
    type: 'Repeated prompt consistency',
    prompt: 'What is Liliw known for?',
    repeat: 3,
    reference: 'Same as AI-01.',
    expect: 'All three answers stay inside the approved information boundary.',
    check: (r) => /tsinelas|slipper|footwear|sandal/i.test(r),
  },
  {
    id: 'AI-09',
    type: 'AI service / API unavailable',
    prompt: null, // cannot be induced from outside — see note below
    reference:
      'With GROQ_API_KEY unset the route returns 503 { unavailable: true } and the widget ' +
      'shows "Chat is temporarily unavailable." src/app/api/chat/route.ts:141',
    expect: 'Clear fallback message; the rest of the site stays usable.',
    manual:
      'Run in staging: remove GROQ_API_KEY from the environment, redeploy or restart, open ' +
      'the chat widget. Cannot be triggered from outside the server, so it is not automated ' +
      'here.',
  },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(message) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const ms = Date.now() - started;
  let body;
  try { body = await res.json(); } catch { body = { error: 'non-JSON response' }; }
  return { status: res.status, reply: body.reply ?? '', error: body.error, attractions: body.attractions ?? [], ms };
}

console.log(`Target: ${BASE}\n`);

const results = [];
let first = true;

for (const c of CASES) {
  if (c.manual) {
    console.log(`${c.id}  MANUAL — ${c.type}`);
    results.push({ ...c, runs: [] });
    continue;
  }

  const runs = [];
  for (let i = 0; i < (c.repeat ?? 1); i++) {
    if (!first) await wait(SPACING_MS);
    first = false;

    const r = await ask(c.prompt);
    runs.push(r);

    if (r.status !== 200) {
      console.log(`${c.id}  HTTP ${r.status} — ${r.error ?? 'no body'}`);
      continue;
    }
    const ok = c.check(r.reply);
    console.log(`${c.id}${c.repeat ? ` (${i + 1}/${c.repeat})` : ''}  ${ok ? 'PASS' : 'REVIEW'}  ${r.ms}ms`);
    console.log(`        ${r.reply.replace(/\n+/g, ' ').slice(0, 160)}`);
  }
  results.push({ ...c, runs });
}

// ── Log file ────────────────────────────────────────────────────────────────

const verdict = (c) => {
  if (c.manual) return 'MANUAL';
  if (!c.runs.length) return 'BLOCKED';
  if (c.runs.some((r) => r.status !== 200)) return 'BLOCKED';
  return c.runs.every((r) => c.check(r.reply)) ? 'PASS' : 'REVIEW';
};

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

const out = [
  '# Specialized AI Testing Log — observed run',
  '',
  `Target: \`${BASE}\`  ·  Run: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  '',
  'Every prompt is answerable from content carrying `status = \'approved\'`, which is the',
  'same slice the chat route sends to the model. REVIEW means the automated check did not',
  'match — read the response and decide; the checks are keyword heuristics, not judgment.',
  '',
  '| ID | Test type | Prompt | Expected | Observed | Status |',
  '| --- | --- | --- | --- | --- | --- |',
  ...results.map((c) => {
    const observed = c.manual
      ? '_not automated_'
      : c.runs.map((r) => (r.status === 200 ? esc(r.reply) : `HTTP ${r.status}: ${esc(r.error)}`)).join(' ⁄ ');
    return `| ${c.id} | ${esc(c.type)} | ${esc(c.prompt ?? '—')} | ${esc(c.expect)} | ${observed} | ${verdict(c)} |`;
  }),
  '',
  '## Reference answers',
  '',
  'Prepared from approved CHATO content before testing, as the testing tool requires.',
  '',
  ...results.flatMap((c) => [`**${c.id}** — ${c.reference}`, '']),
  ...(results.find((c) => c.manual)
    ? ['## AI-09', '', results.find((c) => c.manual).manual, '']
    : []),
];

const target = path.join(ROOT, 'docs', 'ai-test-log.md');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out.join('\n'));

const tally = results.reduce((acc, c) => { acc[verdict(c)] = (acc[verdict(c)] ?? 0) + 1; return acc; }, {});
console.log(`\n${Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join('  ·  ')}`);
console.log(`Wrote ${path.relative(process.cwd(), target)}`);
