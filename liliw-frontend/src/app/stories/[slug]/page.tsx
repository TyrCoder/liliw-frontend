import type { Metadata } from 'next';
import StoryDetail from './StoryDetail';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';
import { stripHtml } from '@/lib/text';
import { siteUrl } from '@/lib/siteUrl';

/**
 * Server wrapper — see attractions/[id]/page.tsx for why. The component below
 * reads the slug through useParams and is unchanged.
 */
export default function StoryPage() {
  return <StoryDetail />;
}

/**
 * Gives this one story its own title, description, and share image. Every
 * story was sharing the homepage's openGraph data before this, for the same
 * reason the attraction pages were — see layout.tsx.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const items = await fetchApprovedWithMedia('cms_stories', 'story');
  const story = (items as { slug: string; title: string; content: string; _media: unknown[] }[])
    .find(s => s.slug === slug);
  if (!story) return { title: 'Story not found' };

  const description = stripHtml(story.content).slice(0, 160) || `A story from Liliw, Laguna.`;
  // No page-specific photo — fall back to the site's own share image rather
  // than omitting og:image outright, which some platforms render as a
  // blank, unappealing card.
  const image = mediaToPhotos(story._media as never)[0]?.url ?? `${siteUrl()}/icons/icon-512x512.png`;

  return {
    title: story.title,
    description,
    openGraph: {
      type: 'article',
      title: story.title,
      description,
      url: `/stories/${slug}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description,
      images: [image],
    },
  };
}
