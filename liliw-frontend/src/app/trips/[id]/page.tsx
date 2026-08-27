import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getSharedTrip } from '@/lib/shared-trip';
import TripView from './TripView';

type Params = { params: Promise<{ id: string }> };

// The absolute origin, taken from the incoming request so links and image URLs
// in the social card resolve without hardcoding a domain. Social crawlers read
// the server-rendered <head>, so these tags must come from the server, not the
// client TripView.
async function origin(): Promise<string | undefined> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return undefined;
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const trip = await getSharedTrip(id);
  const base = await origin();

  if (!trip) {
    return { title: 'Shared Itinerary — Liliw Tourism' };
  }

  const title = trip.plan?.title || trip.title;
  const description = trip.plan?.summary
    || `A ${trip.duration} trip plan for Liliw, Laguna. Made with the Liliw Tourism itinerary builder.`;
  const url = base ? `${base}/trips/${id}` : undefined;
  const image = '/icon-512x512.png';

  return {
    metadataBase: base ? new URL(base) : undefined,
    title: `${title} — Liliw Itinerary`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Liliw Tourism',
      type: 'article',
      images: [{ url: image, width: 512, height: 512, alt: 'Liliw Tourism' }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedTripPage({ params }: Params) {
  const { id } = await params;
  const trip = await getSharedTrip(id);
  return <TripView trip={trip} />;
}
