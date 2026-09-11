import type { Metadata } from 'next';
import EventDetail from './EventDetail';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';
import { stripHtml } from '@/lib/text';
import { siteUrl } from '@/lib/siteUrl';

/**
 * Server wrapper — see attractions/[id]/page.tsx for why. The component below
 * reads the slug through useParams and is unchanged.
 */
export default function CommunityEventPage() {
  return <EventDetail />;
}

/**
 * Gives this one event its own title, description, and share image, for the
 * same reason attractions and stories needed it — see layout.tsx. Fetched
 * with its media joined, which the by-slug API route this page's client
 * component calls does not do; the cover photo exists in the CMS even though
 * that route does not currently return it.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const items = await fetchApprovedWithMedia('cms_events', 'event');
  const event = (items as { slug: string; title: string; description: string; venue?: string; _media: unknown[] }[])
    .find(e => e.slug === slug);
  if (!event) return { title: 'Event not found' };

  const description =
    stripHtml(event.description).slice(0, 160) ||
    (event.venue ? `Happening at ${event.venue}, Liliw, Laguna.` : 'An event in Liliw, Laguna.');
  // No page-specific photo — fall back to the site's own share image rather
  // than omitting og:image outright, which some platforms render as a
  // blank, unappealing card.
  const image = mediaToPhotos(event._media as never)[0]?.url ?? `${siteUrl()}/icons/icon-512x512.png`;

  return {
    title: event.title,
    description,
    openGraph: {
      type: 'article',
      title: event.title,
      description,
      url: `/community/events/${slug}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [image],
    },
  };
}
