'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Phone, Clock, Globe, Users, Star, Layers, Utensils } from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import FavoriteButton from '@/components/FavoriteButton';
import ImageGallery from '@/components/ImageGallery';
import Ratings from '@/components/Ratings';
import EventCalendar from '@/components/EventCalendar';
import InteractiveMap from '@/components/InteractiveMap';
import QRCodeGenerator from '@/components/QRCodeGenerator';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage Site', spot: 'Tourist Spot', dining: 'Dining & Food' };

interface Attraction {
  id: string | number;
  strapiId?: string;
  attributes: {
    name: string; description?: string; location?: string; category?: string;
    is_featured?: boolean; rating?: number; phone?: string; hours?: string;
    website?: string; best_for?: string; google_place_id?: string;
    coordinates?: { latitude: number; longitude: number };
    photos?: Array<{ id: number; name: string; url: string; width?: number; height?: number; formats?: any; mime?: string; }>;
  };
  type: 'heritage' | 'spot' | 'dining';
}

interface ExternalReview {
  google_rating: number | null;
  review_count: number;
  reviews: { author: string; rating: number; text: string; published: string | null }[];
  last_scraped_at: string | null;
}

export default function AttractionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [attractionId, setAttractionId] = useState<string | null>(null);
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedAttractions, setRelatedAttractions] = useState<Attraction[]>([]);
  const [externalReview, setExternalReview] = useState<ExternalReview | null>(null);

  useEffect(() => {
    Promise.resolve(params).then(async (resolved) => { setAttractionId(resolved.id); });
  }, [params]);

  useEffect(() => {
    if (!attractionId) return;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/strapi/attractions');
        const json = await res.json();
        const allAttractions: any[] = json.data ?? [];
        const current = allAttractions.find((a: any) => String(a.id) === attractionId);
        if (!current) { setError('Attraction not found'); return; }
        setAttraction(current);
        setRelatedAttractions(
          allAttractions.filter((a: any) => a.attributes.category === current.attributes.category && a.id !== current.id).slice(0, 3)
        );
        // Fetch external reviews from Supabase cache
        if (current.strapiId) {
          fetch(`/api/admin/external-reviews?strapiId=${current.strapiId}`)
            .then(r => r.json())
            .then(d => { if (d.data?.[0]) setExternalReview(d.data[0]); })
            .catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attraction');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [attractionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8" />
          <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded mb-2 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-white" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/attractions" className="inline-flex items-center font-semibold text-sm" style={{ color: '#1565C0', fontFamily: BL }}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Attractions
          </Link>
          <div className="mt-8 text-center">
            <p className="text-red-600 font-semibold" style={{ fontFamily: HL }}>{error || 'Attraction not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const typeIcon = attraction.type === 'dining' ? <Utensils className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0B3D91 0%,#1565C0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/attractions" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Attractions
            </Link>
            <div className="flex items-start gap-3 mb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ backgroundColor: '#22C55E', color: '#fff', fontFamily: HL }}>
                  {typeIcon} {TYPE_LABELS[attraction.type] || attraction.type}
                  {attraction.attributes.category && ` · ${attraction.attributes.category}`}
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold text-white" style={{ fontFamily: DL }}>{attraction.attributes.name}</h1>
              </div>
              <FavoriteButton attractionId={String(attraction.id)} attractionName={attraction.attributes.name}
                attractionType={attraction.type} attractionCategory={attraction.attributes.category}
                size="md" className="mt-1 shrink-0 ml-auto" />
            </div>
            {attraction.attributes.location && (
              <div className="flex items-center gap-2 text-white/70 mt-3" style={{ fontFamily: BL }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: '#F5C518' }} />
                <span className="text-sm">{attraction.attributes.location}</span>
              </div>
            )}
            {attraction.attributes.rating && (
              <div className="flex items-center gap-1.5 mt-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4" fill={i < Math.round(attraction.attributes.rating!) ? '#F5C518' : 'none'} stroke={i < Math.round(attraction.attributes.rating!) ? '#F5C518' : 'rgba(255,255,255,0.3)'} />
                ))}
                <span className="text-sm font-semibold text-white/80 ml-1" style={{ fontFamily: BL }}>{attraction.attributes.rating}/5</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">

        {/* Description */}
        {attraction.attributes.description && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-12 text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed p-5 sm:p-6 rounded-2xl border-l-4 bg-white"
            style={{ borderLeftColor: '#1565C0' }}>
            {attraction.attributes.description}
          </motion.div>
        )}

        {/* Info Grid */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {attraction.attributes.phone && (
            <div className="p-5 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#1565C0' }} />
                <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>Phone</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: BL }}>{attraction.attributes.phone}</p>
            </div>
          )}
          {attraction.attributes.hours && (
            <div className="p-5 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#1565C0' }} />
                <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>Hours</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: BL }}>{attraction.attributes.hours}</p>
            </div>
          )}
          {attraction.attributes.website && (
            <div className="p-5 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#1565C0' }} />
                <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>Website</h3>
              </div>
              <a href={attraction.attributes.website} target="_blank" rel="noopener noreferrer"
                className="font-semibold break-all text-xs sm:text-sm" style={{ color: '#1565C0', fontFamily: BL }}>
                {attraction.attributes.website}
              </a>
            </div>
          )}
          {attraction.attributes.best_for && (
            <div className="p-5 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#1565C0' }} />
                <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>Best For</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: BL }}>{attraction.attributes.best_for}</p>
            </div>
          )}
        </motion.div>

        {/* Social Share */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100">
          <SocialShare title={attraction.attributes.name} description={attraction.attributes.description} />
        </motion.div>

        {/* Image Gallery */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8 sm:mb-12">
          {attraction.attributes.photos && attraction.attributes.photos.length > 0 ? (
            <ImageGallery
              images={attraction.attributes.photos.map(photo => ({
                src: photo.url.startsWith('http') ? photo.url : `${process.env.NEXT_PUBLIC_STRAPI_URL}${photo.url}`,
                alt: photo.name,
                caption: photo.name,
              }))}
              title="Photo Gallery"
            />
          ) : (
            <div className="p-8 bg-white rounded-2xl text-center text-gray-500 border border-gray-100">
              <p style={{ fontFamily: BL }}>No photos available for this attraction yet.</p>
              <p className="text-sm mt-2 text-gray-400" style={{ fontFamily: BL }}>Upload photos in the Strapi admin panel to see them here.</p>
            </div>
          )}
        </motion.div>

        {/* Interactive Map */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A1A2E', fontFamily: HL }}>Location & Directions</h2>
          <InteractiveMap
            attractions={[{
              name: attraction.attributes.name,
              lat: attraction.attributes.coordinates?.latitude || 14.3086,
              lng: attraction.attributes.coordinates?.longitude || 121.2286,
              google_place_id: attraction.attributes.google_place_id,
              category: attraction.attributes.category,
              description: attraction.attributes.description,
            }]}
          />
        </motion.div>

        {/* QR Code */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-8 sm:mb-12 flex gap-4 flex-wrap items-center">
          <QRCodeGenerator itemId={String(attraction.id)} itemName={attraction.attributes.name} itemType="attraction" />
        </motion.div>

        {/* Itinerary CTA */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 sm:mb-12">
          <div className="rounded-2xl overflow-hidden flex flex-col sm:flex-row items-center gap-5 px-6 py-5"
            style={{ background: 'linear-gradient(135deg, rgba(11,61,145,0.06), rgba(21,101,192,0.08))', border: '1px solid rgba(11,61,145,0.15)' }}>
            <MapPin className="w-7 h-7 shrink-0" style={{ color: '#1565C0' }} />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-gray-800 text-base" style={{ fontFamily: HL }}>Want to include this in an itinerary?</p>
              <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: BL }}>Use our AI trip planner to build a full Liliw tour around {attraction.attributes.name}.</p>
            </div>
            <Link href="/itineraries"
              className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
              Plan My Trip →
            </Link>
          </div>
        </motion.div>

        {/* Ratings & Reviews */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
          className="mb-8 sm:mb-12">
          <Ratings itemId={String(attraction.id)} itemName={attraction.attributes.name} />
        </motion.div>

        {/* Google Maps Reviews */}
        {externalReview && externalReview.reviews.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>Google Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                <span className="text-lg font-black text-gray-900">{externalReview.google_rating ?? '—'}</span>
                <span className="text-sm text-gray-400">· {externalReview.review_count.toLocaleString()} reviews on Google Maps</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {externalReview.reviews.map((rev, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#1565C0,#0B3D91)' }}>
                      {(rev.author || 'A')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{rev.author || 'Anonymous'}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= (rev.rating||0) ? 'fill-amber-400 stroke-amber-400' : 'fill-gray-200 stroke-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {rev.text && <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{rev.text}</p>}
                  {rev.published && (() => {
                    const d = new Date(rev.published);
                    const label = isNaN(d.getTime())
                      ? rev.published
                      : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                    return <p className="text-xs text-gray-400 mt-2">{label}</p>;
                  })()}
                </div>
              ))}
            </div>
            {externalReview.last_scraped_at && (
              <p className="text-xs text-gray-400 mt-3 text-right">
                Last updated {new Date(externalReview.last_scraped_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </motion.div>
        )}

        {/* Event Calendar */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8 sm:mb-12">
          <EventCalendar attractionName={attraction?.attributes?.name} />
        </motion.div>

        {/* Related Attractions */}
        {relatedAttractions.length > 0 && (
          <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }} className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1A1A2E', fontFamily: HL }}>Similar Attractions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedAttractions.map((related, idx) => (
                <motion.div key={`${related.id}-${idx}`} whileHover={{ y: -4 }}>
                  <Link href={`/attractions/${related.id}`}>
                    <div className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition cursor-pointer h-full">
                      <h3 className="font-bold text-base mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{related.attributes.name}</h3>
                      {related.attributes.location && (
                        <p className="flex items-center gap-2 text-sm text-gray-600 mb-3" style={{ fontFamily: BL }}>
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: '#1565C0' }} />{related.attributes.location}
                        </p>
                      )}
                      {related.attributes.description && (
                        <p className="text-sm text-gray-500 line-clamp-2" style={{ fontFamily: BL }}>{related.attributes.description}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Bottom CTA */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
          className="flex gap-4 justify-center">
          <Link href="/attractions"
            className="px-8 py-3 font-semibold rounded-xl transition hover:opacity-90"
            style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}>
            Explore More Attractions
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
