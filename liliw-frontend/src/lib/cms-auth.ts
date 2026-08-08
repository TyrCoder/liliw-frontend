import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from './session';
import { supabaseServer } from './supabase-server';

export type CmsRole = 'admin' | 'officer' | 'editor';

/** Returns the caller's CMS role + email. Fast path uses signed session cookie. */
export async function getCmsIdentity(req: NextRequest): Promise<{ role: CmsRole | null; email: string }> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    const session = verifySession(cookie);
    if (session) {
      let role: CmsRole | null = null;
      if (session.role === 'admin')        role = 'admin';
      if (session.role === 'chatoofficer') role = 'officer';
      if (session.role === 'chatoeditor')  role = 'editor';
      return { role, email: session.email || 'unknown' };
    }
  }
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { role: null, email: 'unknown' };
  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token);
    if (!user) return { role: null, email: 'unknown' };
    const adminEmails = [
      ...(process.env.ADMIN_EMAILS || '').split(','),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes((user.email || '').toLowerCase())) return { role: 'admin', email: user.email! };
    const { data: profile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single();
    const r = profile?.role ?? '';
    const role: CmsRole | null = r === 'admin' ? 'admin' : r === 'chatoofficer' ? 'officer' : r === 'chatoeditor' ? 'editor' : null;
    return { role, email: user.email || 'unknown' };
  } catch {
    return { role: null, email: 'unknown' };
  }
}

/** Returns the caller's CMS role, or null if not staff. Fast path uses signed session cookie. */
export async function getCmsRole(req: NextRequest): Promise<CmsRole | null> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    const session = verifySession(cookie);
    if (session) {
      if (session.role === 'admin')        return 'admin';
      if (session.role === 'chatoofficer') return 'officer';
      if (session.role === 'chatoeditor')  return 'editor';
      return null;
    }
  }

  // Fallback: Supabase bearer token
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token);
    if (!user) return null;

    const adminEmails = [
      ...(process.env.ADMIN_EMAILS || '').split(','),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes((user.email || '').toLowerCase())) return 'admin';

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? '';
    if (role === 'admin')        return 'admin';
    if (role === 'chatoofficer') return 'officer';
    if (role === 'chatoeditor')  return 'editor';
    return null;
  } catch {
    return null;
  }
}

/**
 * A URL-safe slug from a title.
 *
 * Nothing generated one before, so every entry was created with slug '' — and
 * because slug carries a unique constraint, the first save in a table
 * succeeded and every one after it failed on "duplicate key value violates
 * unique constraint". The detail pages route by slug too, so an empty one was
 * never going to resolve.
 */
export function slugify(input: string): string {
  return (input || '')
    // Normalise before lowercasing, not after. Titles pasted from Facebook are
    // often in mathematical bold (𝐆𝐎𝐁𝐓𝐎𝐔𝐑), and those characters have no
    // lowercase mapping — so lowercasing first left them untouched, NFKD then
    // produced uppercase ASCII, and the a-z filter deleted them. "GOBTOUR"
    // came out as "btour". This way NFKD folds them to ASCII first.
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // strip the accents NFKD split off
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '');
}

/**
 * Which column holds the human-readable label, per content type.
 *
 * This was previously inferred as "name for attractions, art-forms and
 * artisans, title for everything else", which is wrong for FAQs — they have
 * `question`. The consequence was silent: /api/cms/pending asked cms_faqs for
 * a title, the query errored, the empty fallback hid it, and a submitted FAQ
 * could never appear in Content Approvals at all.
 */
export const CMS_LABEL_FIELDS: Record<string, string> = {
  attractions:  'name',
  'art-forms':  'name',
  artisans:     'name',
  faqs:         'question',
  events:       'title',
  news:         'title',
  stories:      'title',
  itineraries:  'title',
};

export const labelFieldFor = (type: string): string => CMS_LABEL_FIELDS[type] ?? 'title';

export const CMS_TABLES: Record<string, string> = {
  attractions:   'cms_attractions',
  events:        'cms_events',
  news:          'cms_news',
  'art-forms':   'cms_art_forms',
  artisans:      'cms_artisans',
  stories:       'cms_stories',
  faqs:          'cms_faqs',
  itineraries:   'cms_itineraries',
};

export const CMS_CONTENT_TYPES: Record<string, string> = {
  attractions:   'attraction',
  events:        'event',
  news:          'news',
  'art-forms':   'art_form',
  artisans:      'artisan',
  stories:       'story',
  faqs:          'faq',
  itineraries:   'itinerary',
};
