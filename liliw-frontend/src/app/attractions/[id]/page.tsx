import type { Metadata } from 'next';
import AttractionDetail from './AttractionDetail';
import { getAllAttractions } from '@/lib/content';
import { stripHtml } from '@/lib/text';
import { siteUrl } from '@/lib/siteUrl';

/**
 * Gives this one attraction its own title, description, and share image
 * instead of the whole site's. See layout.tsx for why that mattered beyond
 * SEO: a shared link with no page-specific openGraph data is what made
 * sharing an attraction open the homepage on the other end.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const attraction = (await getAllAttractions()).find((a: { id: string }) => a.id === id);
  if (!attraction) return { title: 'Attraction not found' };

  const name = attraction.attributes.name as string;
  const description =
    stripHtml(attraction.attributes.description as string).slice(0, 160) ||
    `Discover ${name} in Liliw, Laguna.`;
  // No page-specific photo — fall back to the site's own share image rather
  // than omitting og:image outright, which some platforms render as a
  // blank, unappealing card.
  const image = (attraction.attributes.photos?.[0]?.url as string | undefined) ?? `${siteUrl()}/icons/icon-512x512.png`;

  return {
    title: name,
    description,
    openGraph: {
      type: 'article',
      title: name,
      description,
      url: `/attractions/${id}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [image],
    },
  };
}

/**
 * A server component that hands the id to the client page.
 *
 * The page itself was a client component receiving `params`, and in that shape
 * every /attractions/[id] request answered 500 in production while serving
 * fine from the same build locally — as did /stories/[slug] and
 * /community/events/[slug], the other two client pages under a dynamic
 * segment. /trips/[id], the one dynamic route whose page is a server
 * component, was unaffected.
 *
 * Awaiting params here and passing a plain string is the shape Next expects,
 * and it costs nothing: the component below is still the client component it
 * always was.
 */
export default async function AttractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AttractionDetail id={id} />;
}
