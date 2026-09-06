import AttractionDetail from './AttractionDetail';

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
