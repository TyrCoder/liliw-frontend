/**
 * Strapi v5 → Supabase CMS Migration Script
 *
 * Run from liliw-frontend directory:
 *   node scripts/migrate-strapi-to-supabase.mjs
 *
 * Set env vars before running (or put in .env.local):
 *   NEXT_PUBLIC_STRAPI_URL, NEXT_PUBLIC_STRAPI_API_TOKEN,
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe to re-run — duplicate slugs are ignored (except FAQs).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── load .env.local ───────────────────────────────────────────────────────
const __dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dir, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const STRAPI_URL   = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const SB_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SB_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MIGRATED_BY  = 'strapi-migration';

if (!STRAPI_URL || !SB_URL || !SB_KEY) {
  console.error('Missing STRAPI URL, SUPABASE_URL or SERVICE_ROLE_KEY.');
  process.exit(1);
}

// ─── Supabase REST ─────────────────────────────────────────────────────────
const sbH = {
  apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json', Prefer: 'return=representation',
};

async function sbInsert(table, rows) {
  if (!rows.length) return [];
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, { method: 'POST', headers: sbH, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`Supabase INSERT ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbUpsert(table, rows) {
  if (!rows.length) return [];
  const res = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=slug`, {
    method: 'POST',
    headers: { ...sbH, Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Strapi v5 fetch (flat structure — no attributes wrapper) ──────────────
const strapiH = STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {};

async function fetchAll(endpoint) {
  const results = [];
  let start = 0;
  const limit = 100;
  while (true) {
    const url = `${STRAPI_URL}/api/${endpoint}?populate=*&pagination[limit]=${limit}&pagination[start]=${start}&publicationState=live`;
    const res = await fetch(url, { headers: strapiH });
    if (!res.ok) { console.warn(`  ⚠  ${endpoint} → ${res.status} (skipping)`); return []; }
    const { data = [], meta } = await res.json();
    results.push(...data);
    start += limit;
    if (start >= (meta?.pagination?.total ?? 0)) break;
  }
  return results;
}

// ─── Strapi v5 blocks → HTML ───────────────────────────────────────────────
function inlineHtml(children = []) {
  return (children || []).map(n => {
    if (n.type === 'link') return `<a href="${n.url || ''}">${inlineHtml(n.children)}</a>`;
    let t = (n.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (n.bold)          t = `<strong>${t}</strong>`;
    if (n.italic)        t = `<em>${t}</em>`;
    if (n.underline)     t = `<u>${t}</u>`;
    if (n.strikethrough) t = `<s>${t}</s>`;
    if (n.code)          t = `<code>${t}</code>`;
    return t;
  }).join('');
}

function blocksToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(b => {
    switch (b.type) {
      case 'paragraph': return `<p>${inlineHtml(b.children)}</p>`;
      case 'heading':   return `<h${b.level}>${inlineHtml(b.children)}</h${b.level}>`;
      case 'list': {
        const tag = b.format === 'ordered' ? 'ol' : 'ul';
        const items = (b.children||[]).map(li=>`<li>${inlineHtml(li.children)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'quote': return `<blockquote>${inlineHtml(b.children)}</blockquote>`;
      case 'code':  return `<pre><code>${inlineHtml(b.children)}</code></pre>`;
      default:      return inlineHtml(b.children || []);
    }
  }).filter(Boolean).join('\n');
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function slugify(str) {
  return (str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
const _seenSlugs = new Set();
function uniqueSlug(base) {
  let s = slugify(base); let n = 0;
  while (_seenSlugs.has(s)) s = `${slugify(base)}-${++n}`;
  _seenSlugs.add(s); return s;
}

// Strapi v5: photos is a flat array [{id, url, alternativeText, ...}]
function mediaRows(contentType, contentId, photos) {
  if (!Array.isArray(photos) || !photos.length) return [];
  return photos.filter(p => p?.url).map((p, i) => ({
    content_type: contentType, content_id: contentId,
    url: p.url,               // already full Cloudinary URL
    public_id:  p.provider_metadata?.public_id || null,
    alt_text:   p.alternativeText || p.name || null,
    sort_order: i,
  }));
}

const NOW = new Date().toISOString();
const BASE = { status: 'approved', created_by: MIGRATED_BY, reviewed_by: MIGRATED_BY, published_at: NOW };

// ─── Migrations ────────────────────────────────────────────────────────────

async function migrateAttractions() {
  console.log('\n📍 Attractions (heritage sites, tourist spots, dining, culture)…');

  const heritage = await fetchAll('heritage-sites');
  const spots    = await fetchAll('tourist-spots');
  const dining   = await fetchAll('dining-and-foods');
  const accomm   = await fetchAll('accommodations');
  const culture  = await fetchAll('culture-heritages');
  console.log(`  heritage:${heritage.length} spots:${spots.length} dining:${dining.length} accommodation:${accomm.length} culture:${culture.length}`);

  const rows = [];

  for (const a of heritage) {
    rows.push({ ...BASE, name: a.name, category: 'heritage',
      description: blocksToHtml(a.description),
      location:    a.location || null,
      map_lat:     a.coordinates?.latitude  ?? null,
      map_lng:     a.coordinates?.longitude ?? null,
      features:    blocksToHtml(a.history),
      slug: uniqueSlug(a.slug || a.name), sort_order: 0 });
  }
  for (const a of spots) {
    const extra = [a.best_time_to_visit && `<p>Best time: ${a.best_time_to_visit}</p>`,
                   a.entrance_fee       && `<p>Entrance fee: ${a.entrance_fee}</p>`,
                   a.opening_hours      && `<p>Hours: ${a.opening_hours}</p>`].filter(Boolean).join('');
    rows.push({ ...BASE, name: a.name, category: 'tourist_spot',
      description: blocksToHtml(a.description),
      location: a.location || null,
      map_lat:  a.coordinates?.latitude  ?? null,
      map_lng:  a.coordinates?.longitude ?? null,
      features: extra + blocksToHtml(a.tips),
      slug: uniqueSlug(a.slug || a.name), sort_order: 0 });
  }
  for (const a of dining) {
    const extra = [a.cuisine_type   && `<p>Cuisine: ${a.cuisine_type}</p>`,
                   a.price_range    && `<p>Price: ${a.price_range}</p>`,
                   a.contact_number && `<p>Contact: ${a.contact_number}</p>`,
                   a.opening_hours  && `<p>Hours: ${a.opening_hours}</p>`].filter(Boolean).join('');
    rows.push({ ...BASE, name: a.name, category: 'dining',
      description: blocksToHtml(a.description),
      location: a.location || null,
      map_lat:  a.coordinates?.latitude  ?? null,
      map_lng:  a.coordinates?.longitude ?? null,
      features: extra,
      slug: uniqueSlug(a.slug || a.name), sort_order: 0 });
  }
  for (const a of accomm) {
    const extra = [a.type           && `<p>Type: ${a.type}</p>`,
                   a.price_per_night && `<p>Price/night: ${a.price_per_night}</p>`,
                   a.contact_number && `<p>Contact: ${a.contact_number}</p>`,
                   a.amenities      && `<p>Amenities: ${Array.isArray(a.amenities)?a.amenities.join(', '):a.amenities}</p>`].filter(Boolean).join('');
    rows.push({ ...BASE, name: a.name, category: 'other',
      description: blocksToHtml(a.description),
      location: a.location || null,
      map_lat:  a.coordinates?.latitude  ?? null,
      map_lng:  a.coordinates?.longitude ?? null,
      features: extra,
      slug: uniqueSlug(a.slug || a.name), sort_order: 0 });
  }
  for (const a of culture) {
    rows.push({ ...BASE, name: a.title || 'Untitled', category: 'heritage',
      description: blocksToHtml(a.description),
      location: null, map_lat: null, map_lng: null, features: null,
      slug: uniqueSlug(a.slug || a.title), sort_order: 0 });
  }

  if (!rows.length) { console.log('  (nothing)'); return; }
  const inserted = await sbUpsert('cms_attractions', rows);
  console.log(`  ✓ ${inserted.length} attractions`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  const addMedia = (contentType, items, nameField = 'name') => {
    for (const a of items) {
      const id = slugToId[slugify(a.slug || a[nameField])];
      if (id && a.photos?.length) mRows.push(...mediaRows(contentType, id, a.photos));
    }
  };
  addMedia('attraction', heritage);
  addMedia('attraction', spots);
  addMedia('attraction', dining);
  addMedia('attraction', accomm);

  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateEvents() {
  console.log('\n📅 Events…');
  const data = await fetchAll('events');
  console.log(`  events: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    title: a.title, category: a.category || null,
    description: blocksToHtml(a.description),
    venue: a.venue || null, date_start: a.date_start || null,
    date_end: a.date_end || null, is_joinable: a.is_joinable ?? false,
    slug: uniqueSlug(a.slug || a.title),
  }));
  const inserted = await sbUpsert('cms_events', rows);
  console.log(`  ✓ ${inserted.length} events`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.title)];
    if (!id) continue;
    if (a.photos?.length)      mRows.push(...mediaRows('event', id, a.photos));
    if (a.cover_image?.url)    mRows.push(...mediaRows('event', id, [a.cover_image]));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateNews() {
  console.log('\n📰 News…');
  const data = await fetchAll('articles');
  console.log(`  articles: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    title: a.title, category: a.category || null,
    content: blocksToHtml(a.content),
    slug: uniqueSlug(a.slug || a.title),
  }));
  const inserted = await sbUpsert('cms_news', rows);
  console.log(`  ✓ ${inserted.length} news`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.title)];
    if (!id) continue;
    if (a.photos?.length)     mRows.push(...mediaRows('news', id, a.photos));
    if (a.cover_photo?.url)   mRows.push(...mediaRows('news', id, [a.cover_photo]));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateArtForms() {
  console.log('\n🎨 Art Forms…');
  const data = await fetchAll('art-forms');
  console.log(`  art-forms: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    name: a.name, icon: a.icon_emoji || null,
    description: blocksToHtml(a.description),
    features: Array.isArray(a.features)
      ? a.features.map(f => `<p>${typeof f==='string'?f:JSON.stringify(f)}</p>`).join('')
      : (a.features || null),
    sort_order: a.sort_order ?? 0,
    slug: uniqueSlug(a.slug || a.name),
  }));
  const inserted = await sbUpsert('cms_art_forms', rows);
  console.log(`  ✓ ${inserted.length} art forms`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.name)];
    if (id && a.photos?.length) mRows.push(...mediaRows('art_form', id, a.photos));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateArtisans() {
  console.log('\n👤 Artisans…');
  const data = await fetchAll('artisans');
  console.log(`  artisans: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    name: a.name, craft_type: a.craft_type || null,
    description: blocksToHtml(a.description),
    location: a.location || null, contact_number: a.contact_number || null,
    rating: a.rating || 0,
    social_media: a.social_media ? JSON.stringify(a.social_media) : '{}',
    slug: uniqueSlug(a.slug || a.name),
  }));
  const inserted = await sbUpsert('cms_artisans', rows);
  console.log(`  ✓ ${inserted.length} artisans`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.name)];
    if (id && a.photos?.length) mRows.push(...mediaRows('artisan', id, a.photos));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateStories() {
  console.log('\n📖 Stories…');
  const data = await fetchAll('stories');
  console.log(`  stories: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    title: a.title, category: a.category || null,
    content: blocksToHtml(a.content), author: a.author || null,
    slug: uniqueSlug(a.slug || a.title),
  }));
  const inserted = await sbUpsert('cms_stories', rows);
  console.log(`  ✓ ${inserted.length} stories`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.title)];
    if (!id) continue;
    if (a.photos?.length)    mRows.push(...mediaRows('story', id, a.photos));
    if (a.cover_image?.url)  mRows.push(...mediaRows('story', id, [a.cover_image]));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateFaqs() {
  console.log('\n❓ FAQs…');
  const data = await fetchAll('faqs');
  console.log(`  faqs: ${data.length}`);
  if (!data.length) return;

  const rows = data.map((a, i) => ({ ...BASE,
    question: a.question,
    answer: typeof a.answer === 'string' ? a.answer : blocksToHtml(a.answer),
    category: a.category || null, sort_order: i,
  }));
  const inserted = await sbInsert('cms_faqs', rows);
  console.log(`  ✓ ${inserted.length} FAQs`);
}

async function migrateHeroSlides() {
  console.log('\n🖼  Hero Slides…');
  const data = await fetchAll('hero-slides');
  console.log(`  hero-slides: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => ({ ...BASE,
    title: a.title, subtitle: a.subtitle || null,
    button_text: a.cta_text || null, button_link: a.cta_link || null,
    sort_order: a.sort_order ?? 0,
    slug: uniqueSlug(a.slug || a.title),
  }));
  const inserted = await sbUpsert('cms_hero_slides', rows);
  console.log(`  ✓ ${inserted.length} hero slides`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mRows = [];
  for (const a of data) {
    const id = slugToId[slugify(a.slug || a.title)];
    if (id && a.image?.url) mRows.push(...mediaRows('hero_slide', id, [a.image]));
  }
  if (mRows.length) { await sbInsert('cms_media', mRows); console.log(`  ✓ ${mRows.length} media`); }
}

async function migrateItineraries() {
  console.log('\n🗺  Itineraries…');
  const data = await fetchAll('itineraries');
  console.log(`  itineraries: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(a => {
    const days = parseInt(a.duration) || 1;
    const hl = [...(Array.isArray(a.highlights)?a.highlights:[]),
                ...(Array.isArray(a.stops)?a.stops:[])];
    const hlHtml = hl.length ? `<ul>${hl.map(h=>`<li>${typeof h==='string'?h:(h.name||JSON.stringify(h))}</li>`).join('')}</ul>` : null;
    return { ...BASE,
      title: a.title, description: blocksToHtml(a.description),
      duration_days: days, category: a.difficulty || null,
      highlights: hlHtml, slug: uniqueSlug(a.slug || a.title),
    };
  });
  const inserted = await sbUpsert('cms_itineraries', rows);
  console.log(`  ✓ ${inserted.length} itineraries`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
console.log('='.repeat(55));
console.log('  Strapi v5 → Supabase Migration');
console.log(`  Strapi:   ${STRAPI_URL}`);
console.log(`  Supabase: ${SB_URL}`);
console.log('='.repeat(55));

try {
  await migrateAttractions();
  await migrateEvents();
  await migrateNews();
  await migrateArtForms();
  await migrateArtisans();
  await migrateStories();
  await migrateFaqs();
  await migrateHeroSlides();
  await migrateItineraries();

  console.log('\n' + '='.repeat(55));
  console.log('  ✅ Migration complete!');
  console.log('  • All entries set to status=approved (Published)');
  console.log('  • Media URLs are Cloudinary — no dependency on Strapi');
  console.log('  • Re-running is safe (slug-based dedup, except FAQs)');
  console.log('='.repeat(55));
} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
}
