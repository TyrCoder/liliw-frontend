import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from './session';

export type CmsRole = 'admin' | 'officer' | 'editor';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

/** Returns the caller's CMS role, or null if not staff. Fast path uses signed session cookie. */
export async function getCmsRole(req: NextRequest): Promise<CmsRole | null> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    const session = verifySession(cookie);
    if (session) {
      if (session.role === 'admin')       return 'admin';
      if (session.role === 'chatoofficer') return 'officer';
      if (session.role === 'chatoeditor')  return 'editor';
      return null;
    }
  }

  // Fallback: Strapi bearer token
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const res = await fetch(`${STRAPI}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    const adminEmails = [
      ...(process.env.ADMIN_EMAILS || '').split(','),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes((user.email || '').toLowerCase())) return 'admin';
    const role = (user.role?.name || '').toLowerCase().replace(/[\s_-]/g, '');
    if (role.includes('chatoofficer') || role.includes('officer')) return 'officer';
    if (role.includes('chatoeditor')  || role.includes('editor'))  return 'editor';
    if (role.includes('admin')) return 'admin';
    return null;
  } catch {
    return null;
  }
}

export const CMS_TABLES: Record<string, string> = {
  attractions:   'cms_attractions',
  events:        'cms_events',
  news:          'cms_news',
  'art-forms':   'cms_art_forms',
  artisans:      'cms_artisans',
  stories:       'cms_stories',
  'hero-slides': 'cms_hero_slides',
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
  'hero-slides': 'hero_slide',
  faqs:          'faq',
  itineraries:   'itinerary',
};
