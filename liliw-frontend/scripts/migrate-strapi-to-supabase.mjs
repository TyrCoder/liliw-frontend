/**
 * Strapi → Supabase CMS Migration Script
 *
 * Reads all published content from Strapi v4 and inserts it into the
 * Supabase CMS tables with status='approved' so it appears as Published.
 *
 * Run from the liliw-frontend directory:
 *   node scripts/migrate-strapi-to-supabase.mjs
 *
 * Env vars are loaded from .env.local automatically.
 * Run once only — re-running will skip already-migrated entries (slug conflict).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── load .env.local ───────────────────────────────────────────────────────
const __dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dir, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const E = (k) => env[k] || process.env[k] || '';

const STRAPI_URL   = E('NEXT_PUBLIC_STRAPI_URL').replace(/\/$/, '');
const STRAPI_TOKEN = E('NEXT_PUBLIC_STRAPI_API_TOKEN');
const SB_URL       = E('NEXT_PUBLIC_SUPABASE_URL');
const SB_KEY       = E('SUPABASE_SERVICE_ROLE_KEY');
const MIGRATED_BY  = 'strapi-migration';

if (!STRAPI_URL || !SB_URL || !SB_KEY) {
  console.error('Missing STRAPI URL, SUPABASE_URL or SERVICE_ROLE_KEY. Check .env.local.');
  process.exit(1);
}

// ─── Supabase REST helper ──────────────────────────────────────────────────
const sbHeaders = {
  apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json', Prefer: 'return=representation',
};

async function sbInsert(table, rows) {
  if (!rows.length) return [];
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST', headers: sbHeaders, body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase insert into ${table} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function sbUpsert(table, rows, conflict = 'slug') {
  if (!rows.length) return [];
  const res = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase upsert into ${table} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// ─── Strapi fetch helper ───────────────────────────────────────────────────
const strapiHeaders = STRAPI_TOKEN
  ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
  : {};

async function fetchAll(endpoint) {
  const results = [];
  let start = 0;
  const limit = 100;
  while (true) {
    const url = `${STRAPI_URL}/api/${endpoint}?populate=*&pagination[limit]=${limit}&pagination[start]=${start}&publicationState=live`;
    const res = await fetch(url, { headers: strapiHeaders });
    if (!res.ok) {
      console.warn(`  ⚠  Strapi ${endpoint} returned ${res.status} — skipping`);
      return results;
    }
    const { data, meta } = await res.json();
    if (!data?.length) break;
    results.push(...data);
    const total = meta?.pagination?.total ?? 0;
    start += limit;
    if (start >= total) break;
  }
  return results;
}

// ─── Strapi blocks → HTML ─────────────────────────────────────────────────
function inlineToHtml(children = []) {
  return children.map(n => {
    let t = (n.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (n.bold)          t = `<strong>${t}</strong>`;
    if (n.italic)        t = `<em>${t}</em>`;
    if (n.underline)     t = `<u>${t}</u>`;
    if (n.strikethrough) t = `<s>${t}</s>`;
    if (n.code)          t = `<code>${t}</code>`;
    if (n.type === 'link') t = `<a href="${n.url}">${t}</a>`;
    return t;
  }).join('');
}

function blocksToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return `<p>${inlineToHtml(block.children)}</p>`;
      case 'heading':
        return `<h${block.level}>${inlineToHtml(block.children)}</h${block.level}>`;
      case 'list':
        const tag = block.format === 'ordered' ? 'ol' : 'ul';
        const items = (block.children || []).map(li => `<li>${inlineToHtml(li.children)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      case 'quote':
        return `<blockquote>${inlineToHtml(block.children)}</blockquote>`;
      case 'code':
        return `<pre><code>${inlineToHtml(block.children)}</code></pre>`;
      case 'image':
        return block.image?.url ? `<img src="${STRAPI_URL}${block.image.url}" alt="${block.image.alternativeText || ''}" />` : '';
      default:
        return inlineToHtml(block.children || []);
    }
  }).join('\n');
}

// ─── Media helper ─────────────────────────────────────────────────────────
function buildMediaRows(contentType, contentId, photos) {
  if (!photos?.data && !Array.isArray(photos)) return [];
  const list = Array.isArray(photos) ? photos : (photos.data || []);
  return list.filter(p => p?.attributes?.url || p?.url).map((p, i) => {
    const attr = p.attributes || p;
    const rawUrl = attr.url || '';
    const url = rawUrl.startsWith('http') ? rawUrl : `${STRAPI_URL}${rawUrl}`;
    return {
      content_type: contentType,
      content_id:   contentId,
      url,
      alt_text:  attr.alternativeText || attr.name || null,
      sort_order: i,
    };
  });
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueSlug(base, seen) {
  let s = slugify(base);
  let n = 0;
  while (seen.has(s)) { s = `${slugify(base)}-${++n}`; }
  seen.add(s);
  return s;
}

// ─── Migration functions ───────────────────────────────────────────────────

async function migrateAttractions() {
  console.log('\n📍 Migrating Attractions (heritage sites, tourist spots, dining, accommodation, culture)…');
  const now = new Date().toISOString();
  const seen = new Set();
  const rows = [];

  // heritage sites
  const heritage = await fetchAll('heritage-sites');
  console.log(`  heritage-sites: ${heritage.length}`);
  for (const { id: _id, attributes: a } of heritage) {
    rows.push({
      name:        a.name,
      category:    'heritage',
      description: blocksToHtml(a.description),
      location:    a.location || null,
      map_lat:     a.coordinates?.lat ?? a.coordinates?.latitude ?? null,
      map_lng:     a.coordinates?.lng ?? a.coordinates?.longitude ?? null,
      features:    blocksToHtml(a.history),
      slug:        uniqueSlug(a.slug || a.name, seen),
      sort_order:  0,
      status:      'approved', created_by: MIGRATED_BY,
      reviewed_by: MIGRATED_BY, published_at: now,
    });
  }

  // tourist spots
  const spots = await fetchAll('tourist-spots');
  console.log(`  tourist-spots: ${spots.length}`);
  for (const { attributes: a } of spots) {
    const parts = [];
    if (a.best_time_to_visit) parts.push(`Best time to visit: ${a.best_time_to_visit}`);
    if (a.entrance_fee)       parts.push(`Entrance fee: ${a.entrance_fee}`);
    if (a.opening_hours)      parts.push(`Opening hours: ${a.opening_hours}`);
    const tipsHtml = blocksToHtml(a.tips);
    rows.push({
      name:        a.name,
      category:    'tourist_spot',
      description: blocksToHtml(a.description),
      location:    a.location || null,
      map_lat:     a.coordinates?.lat ?? a.coordinates?.latitude ?? null,
      map_lng:     a.coordinates?.lng ?? a.coordinates?.longitude ?? null,
      features:    [parts.map(p => `<p>${p}</p>`).join(''), tipsHtml].filter(Boolean).join('\n'),
      slug:        uniqueSlug(a.slug || a.name, seen),
      sort_order:  0,
      status:      'approved', created_by: MIGRATED_BY,
      reviewed_by: MIGRATED_BY, published_at: now,
    });
  }

  // dining
  const dining = await fetchAll('dining-and-foods');
  console.log(`  dining-and-foods: ${dining.length}`);
  for (const { attributes: a } of dining) {
    const parts = [];
    if (a.cuisine_type)   parts.push(`Cuisine: ${a.cuisine_type}`);
    if (a.price_range)    parts.push(`Price range: ${a.price_range}`);
    if (a.contact_number) parts.push(`Contact: ${a.contact_number}`);
    if (a.opening_hours)  parts.push(`Hours: ${a.opening_hours}`);
    rows.push({
      name:        a.name,
      category:    'dining',
      description: blocksToHtml(a.description),
      location:    a.location || null,
      map_lat:     a.coordinates?.lat ?? a.coordinates?.latitude ?? null,
      map_lng:     a.coordinates?.lng ?? a.coordinates?.longitude ?? null,
      features:    parts.map(p => `<p>${p}</p>`).join('\n'),
      slug:        uniqueSlug(a.slug || a.name, seen),
      sort_order:  0,
      status:      'approved', created_by: MIGRATED_BY,
      reviewed_by: MIGRATED_BY, published_at: now,
    });
  }

  // accommodation
  const accomm = await fetchAll('accommodations');
  console.log(`  accommodations: ${accomm.length}`);
  for (const { attributes: a } of accomm) {
    const parts = [];
    if (a.type)             parts.push(`Type: ${a.type}`);
    if (a.price_per_night)  parts.push(`Price per night: ${a.price_per_night}`);
    if (a.contact_number)   parts.push(`Contact: ${a.contact_number}`);
    if (a.opening_hours)    parts.push(`Hours: ${a.opening_hours}`);
    if (a.amenities)        parts.push(`Amenities: ${Array.isArray(a.amenities) ? a.amenities.join(', ') : a.amenities}`);
    rows.push({
      name:        a.name,
      category:    'other',
      description: blocksToHtml(a.description),
      location:    a.location || null,
      map_lat:     a.coordinates?.lat ?? a.coordinates?.latitude ?? null,
      map_lng:     a.coordinates?.lng ?? a.coordinates?.longitude ?? null,
      features:    parts.map(p => `<p>${p}</p>`).join('\n'),
      slug:        uniqueSlug(a.slug || a.name, seen),
      sort_order:  0,
      status:      'approved', created_by: MIGRATED_BY,
      reviewed_by: MIGRATED_BY, published_at: now,
    });
  }

  // culture & heritage
  const culture = await fetchAll('culture-heritages');
  console.log(`  culture-heritages: ${culture.length}`);
  for (const { attributes: a } of culture) {
    rows.push({
      name:        a.title || 'Untitled',
      category:    'heritage',
      description: blocksToHtml(a.description),
      location:    null,
      map_lat:     null, map_lng: null,
      features:    null,
      slug:        uniqueSlug(a.slug || a.title, seen),
      sort_order:  0,
      status:      'approved', created_by: MIGRATED_BY,
      reviewed_by: MIGRATED_BY, published_at: now,
    });
  }

  if (!rows.length) { console.log('  (nothing to migrate)'); return; }
  const inserted = await sbUpsert('cms_attractions', rows);
  console.log(`  ✓ ${inserted.length} attractions inserted`);

  // media: re-fetch with photos and match to inserted rows by slug
  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];

  const heritageFull  = heritage.map(h => ({ ...h.attributes, _slug: uniqueSlug2(h.attributes.slug || h.attributes.name) }));

  // helper to match slug
  for (const { attributes: a } of heritage) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('attraction', id, a.photos));
  }
  for (const { attributes: a } of spots) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('attraction', id, a.photos));
  }
  for (const { attributes: a } of dining) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('attraction', id, a.photos));
  }
  for (const { attributes: a } of accomm) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('attraction', id, a.photos));
  }

  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} attraction media rows inserted`);
  }
}

// simple slugify for matching (no dedup)
function slugify2(str) { return slugify(str); }
function uniqueSlug2(base) { return slugify(base); }

async function migrateEvents() {
  console.log('\n📅 Migrating Events…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('events');
  console.log(`  events: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => ({
    title:       a.title,
    category:    a.category || null,
    description: blocksToHtml(a.description),
    venue:       a.venue || null,
    date_start:  a.date_start || null,
    date_end:    a.date_end || null,
    is_joinable: a.is_joinable ?? false,
    slug:        uniqueSlug(a.slug || a.title, seen),
    status:      'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_events', rows);
  console.log(`  ✓ ${inserted.length} events inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of data) {
    const slug = slugify(a.slug || a.title);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (!id) continue;
    mediaRows.push(...buildMediaRows('event', id, a.photos));
    if (a.cover_image?.data) mediaRows.push(...buildMediaRows('event', id, { data: [a.cover_image.data] }));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} event media rows inserted`);
  }
}

async function migrateNews() {
  console.log('\n📰 Migrating News…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('news-articles');
  // try singular if plural fails
  const articles = data.length ? data : await fetchAll('articles');
  console.log(`  news: ${articles.length}`);
  if (!articles.length) return;

  const rows = articles.map(({ attributes: a }) => ({
    title:    a.title,
    category: a.category || null,
    content:  blocksToHtml(a.content),
    slug:     uniqueSlug(a.slug || a.title, seen),
    status:      'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_news', rows);
  console.log(`  ✓ ${inserted.length} news inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of articles) {
    const slug = slugify(a.slug || a.title);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (!id) continue;
    mediaRows.push(...buildMediaRows('news', id, a.photos));
    if (a.cover_photo?.data) mediaRows.push(...buildMediaRows('news', id, { data: [a.cover_photo.data] }));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} news media rows inserted`);
  }
}

async function migrateArtForms() {
  console.log('\n🎨 Migrating Art Forms…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('art-forms');
  console.log(`  art-forms: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => ({
    name:        a.name,
    icon:        a.icon_emoji || null,
    description: blocksToHtml(a.description),
    features:    Array.isArray(a.features)
                   ? a.features.map(f => `<p>${typeof f === 'string' ? f : JSON.stringify(f)}</p>`).join('')
                   : (a.features || null),
    sort_order:  a.sort_order ?? 0,
    slug:        uniqueSlug(a.slug || a.name, seen),
    status:      'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_art_forms', rows);
  console.log(`  ✓ ${inserted.length} art forms inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of data) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('art_form', id, a.photos));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} art form media rows inserted`);
  }
}

async function migrateArtisans() {
  console.log('\n👤 Migrating Artisans…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('artisans');
  console.log(`  artisans: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => ({
    name:           a.name,
    craft_type:     a.craft_type || null,
    description:    blocksToHtml(a.description),
    location:       a.location || null,
    contact_number: a.contact_number || null,
    rating:         a.rating || 0,
    social_media:   a.social_media ? JSON.stringify(a.social_media) : '{}',
    slug:           uniqueSlug(a.slug || a.name, seen),
    status:         'approved', created_by: MIGRATED_BY,
    reviewed_by:    MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_artisans', rows);
  console.log(`  ✓ ${inserted.length} artisans inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of data) {
    const slug = slugify(a.slug || a.name);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (id) mediaRows.push(...buildMediaRows('artisan', id, a.photos));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} artisan media rows inserted`);
  }
}

async function migrateStories() {
  console.log('\n📖 Migrating Stories…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('stories');
  console.log(`  stories: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => ({
    title:    a.title,
    category: a.category || null,
    content:  blocksToHtml(a.content),
    author:   a.author || null,
    slug:     uniqueSlug(a.slug || a.title, seen),
    status:      'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_stories', rows);
  console.log(`  ✓ ${inserted.length} stories inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of data) {
    const slug = slugify(a.slug || a.title);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (!id) continue;
    mediaRows.push(...buildMediaRows('story', id, a.photos));
    if (a.cover_image?.data) mediaRows.push(...buildMediaRows('story', id, { data: [a.cover_image.data] }));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} story media rows inserted`);
  }
}

async function migrateFaqs() {
  console.log('\n❓ Migrating FAQs…');
  const now = new Date().toISOString();
  const data = await fetchAll('faqs');
  console.log(`  faqs: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }, i) => ({
    question:   a.question,
    answer:     blocksToHtml(a.answer) || (typeof a.answer === 'string' ? a.answer : ''),
    category:   a.category || null,
    sort_order: i,
    status:     'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  // FAQs have no slug — use id as conflict column won't work, just insert
  const inserted = await sbInsert('cms_faqs', rows);
  console.log(`  ✓ ${inserted.length} FAQs inserted`);
}

async function migrateHeroSlides() {
  console.log('\n🖼  Migrating Hero Slides…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('hero-slides');
  console.log(`  hero-slides: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => ({
    title:       a.title,
    subtitle:    a.subtitle || null,
    button_text: a.cta_text || null,
    button_link: a.cta_link || null,
    sort_order:  a.sort_order ?? 0,
    slug:        uniqueSlug(a.slug || a.title, seen),
    status:      'approved', created_by: MIGRATED_BY,
    reviewed_by: MIGRATED_BY, published_at: now,
  }));

  const inserted = await sbUpsert('cms_hero_slides', rows);
  console.log(`  ✓ ${inserted.length} hero slides inserted`);

  const slugToId = Object.fromEntries(inserted.map(r => [r.slug, r.id]));
  const mediaRows = [];
  for (const { attributes: a } of data) {
    const slug = slugify(a.slug || a.title);
    const id   = slugToId[slug] || Object.entries(slugToId).find(([k]) => k.startsWith(slug))?.[1];
    if (!id) continue;
    // hero-slide has a single `image` field
    if (a.image?.data) mediaRows.push(...buildMediaRows('hero_slide', id, { data: [a.image.data] }));
  }
  if (mediaRows.length) {
    await sbInsert('cms_media', mediaRows);
    console.log(`  ✓ ${mediaRows.length} hero slide media rows inserted`);
  }
}

async function migrateItineraries() {
  console.log('\n🗺  Migrating Itineraries…');
  const now = new Date().toISOString();
  const seen = new Set();
  const data = await fetchAll('itineraries');
  console.log(`  itineraries: ${data.length}`);
  if (!data.length) return;

  const rows = data.map(({ attributes: a }) => {
    const dur = a.duration || '';
    const days = parseInt(dur) || 1;
    const hlParts = [];
    if (Array.isArray(a.highlights)) hlParts.push(...a.highlights.map(h => `<li>${typeof h === 'string' ? h : JSON.stringify(h)}</li>`));
    if (Array.isArray(a.stops))      hlParts.push(...a.stops.map(s => `<li>${typeof s === 'string' ? s : (s.name || JSON.stringify(s))}</li>`));
    return {
      title:         a.title,
      description:   blocksToHtml(a.description),
      duration_days: days,
      category:      a.difficulty || null,
      highlights:    hlParts.length ? `<ul>${hlParts.join('')}</ul>` : null,
      slug:          uniqueSlug(a.slug || a.title, seen),
      status:        'approved', created_by: MIGRATED_BY,
      reviewed_by:   MIGRATED_BY, published_at: now,
    };
  });

  const inserted = await sbUpsert('cms_itineraries', rows);
  console.log(`  ✓ ${inserted.length} itineraries inserted`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(55));
  console.log('  Strapi → Supabase CMS Migration');
  console.log(`  Strapi: ${STRAPI_URL}`);
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
    console.log('='.repeat(55));
    console.log('\nNotes:');
    console.log('  • All migrated entries have status = "approved" (Published).');
    console.log('  • Media URLs point to Strapi — keep Strapi running until Phase 4.');
    console.log('  • Re-running is safe — duplicate slugs are ignored.');
    console.log('  • FAQs are NOT idempotent (no slug) — avoid running twice.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

main();
