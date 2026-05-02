'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, MapPin, Phone, ExternalLink, Search, Filter } from 'lucide-react';

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || '';
const TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

const FALLBACK_ARTS = [
  { name: 'Tsinelas Crafting', description: 'Liliw is world-renowned for its handmade tsinelas (slippers). Skilled artisans have perfected this craft over generations, creating footwear that blends comfort, artistry, and cultural identity.', icon_emoji: '👞', features: ['Hand-stitched leather', 'Traditional techniques', 'Hundreds of designs', 'Export-quality products'] },
  { name: 'Traditional Weaving', description: 'Intricate textiles and fabrics created using traditional looms. Local weavers transform natural fibers into beautiful patterns that tell stories of the community.', icon_emoji: '🧵', features: ['Native fiber materials', 'Generational skills', 'Intricate patterns', 'Wearable cultural art'] },
  { name: 'Culinary Arts', description: "Local delicacies and traditional dishes representing Liliw's rich gastronomic heritage, passed down through family recipes and community traditions.", icon_emoji: '🍲', features: ['Traditional recipes', 'Local ingredients', 'Family traditions', 'Unique flavors'] },
  { name: 'Visual Arts & Crafts', description: 'A thriving community of painters, sculptors, and craft artists who draw inspiration from Liliw\'s natural beauty and cultural heritage.', icon_emoji: '🎨', features: ['Landscape paintings', 'Local sculptures', 'Mixed media works', 'Craft workshops'] },
  { name: 'Music & Performing Arts', description: "Traditional music and dance performances that celebrate Liliw's vibrant culture, from folk songs to contemporary interpretations.", icon_emoji: '🎵', features: ['Folk music', 'Cultural dance', 'Community performances', 'Festival celebrations'] },
  { name: 'Woodcarving & Sculpture', description: 'Master woodcarvers transform native timber into intricate sculptures, furniture, and decorative pieces that reflect Filipino artistry.', icon_emoji: '🪵', features: ['Native timber', 'Intricate detailing', 'Custom commissions', 'Heritage motifs'] },
];

const FALLBACK_ARTISANS = [
  { name: 'Liliw Tsinelas Makers', craft_type: 'Footwear Artisans', location: 'Footwear District, Liliw', rating: 5, description: 'Master craftsmen producing handmade tsinelas for over 50 years.' },
  { name: 'Laguna Weavers Guild', craft_type: 'Textile Weavers', location: 'Liliw, Laguna', rating: 5, description: 'Collective preserving traditional weaving techniques and patterns.' },
  { name: 'Liliw Culinary Masters', craft_type: 'Culinary Artists', location: 'Public Market, Liliw', rating: 4, description: 'Keepers of traditional Liliw recipes and local delicacies.' },
  { name: 'Native Arts Collective', craft_type: 'Visual Artists', location: 'Arts District, Liliw', rating: 5, description: 'Contemporary Filipino artists inspired by local culture.' },
  { name: 'Budol Craft Makers', craft_type: 'Woodcarvers', location: 'Liliw, Laguna', rating: 4, description: 'Skilled woodcarvers specializing in decorative and functional pieces.' },
  { name: 'Liliw Dance Company', craft_type: 'Performing Artists', location: 'Cultural Center, Liliw', rating: 5, description: 'Traditional and contemporary dance troupe celebrating Filipino culture.' },
];

const CATEGORIES = ['All', 'Footwear', 'Textile', 'Culinary', 'Visual', 'Music', 'Woodcarving'];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-3.5 h-3.5" fill={i <= rating ? '#FFB400' : 'none'} stroke={i <= rating ? '#FFB400' : '#d1d5db'} />
      ))}
    </div>
  );
}

export default function ArtsPage() {
  const [loading, setLoading] = useState(true);
  const [artForms, setArtForms] = useState<any[]>(FALLBACK_ARTS);
  const [artisans, setArtisans] = useState<any[]>(FALLBACK_ARTISANS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArtisan, setSelectedArtisan] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${STRAPI}/api/art-forms?populate=*&sort=sort_order:asc`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }).then(r => r.json()).catch(() => null),
      fetch(`${STRAPI}/api/artisans?populate=*`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }).then(r => r.json()).catch(() => null),
    ]).then(([artData, artisanData]) => {
      if (artData?.data?.length) setArtForms(artData.data.map((i: any) => i.attributes || i));
      if (artisanData?.data?.length) setArtisans(artisanData.data.map((i: any) => ({ ...(i.attributes || i), id: i.id })));
    }).finally(() => setLoading(false));
  }, []);

  const filteredArtisans = artisans.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.craft_type?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || a.craft_type?.toLowerCase().includes(activeCategory.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1F3C 0%, #1a3a5c 60%, #0F1F3C 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00BFB3 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FFB400 0%, transparent 40%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8 px-3 py-1.5 rounded-lg transition hover:bg-white/10" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">🎨</span>
              <div>
                <p className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: '#00BFB3' }}>Discover</p>
                <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">Arts &<br />Creatives</h1>
              </div>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mt-6 leading-relaxed">
              Explore the vibrant artistic soul of Liliw — from world-renowned tsinelas craftsmanship to contemporary Filipino art that blends heritage with innovation.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {['100+ Artisans', 'UNESCO Heritage Craft', 'Live Workshops', 'Open Ateliers'].map(tag => (
                <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,191,179,0.15)', color: '#00BFB3', border: '1px solid rgba(0,191,179,0.3)' }}>{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Art Forms */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#00BFB3' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#0F1F3C' }}>Art Forms & Traditions</h2>
          </div>
          <p className="text-gray-500 ml-4 max-w-2xl">Living traditions passed down through generations of Liliw's creative community.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artForms.map((art, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,191,179,0.12)' }}
              className="group relative rounded-2xl p-6 bg-white border-2 border-gray-100 hover:border-teal-200 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: '#00BFB3' }} />
              <div className="text-5xl mb-4">{art.icon_emoji || '🎨'}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0F1F3C' }}>{art.name || art.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{art.description}</p>
              <div className="space-y-1.5">
                {(Array.isArray(art.features) ? art.features : []).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#00BFB3' }} />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-auto max-w-6xl" style={{ background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />

      {/* Artisans */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#FFB400' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#0F1F3C' }}>Meet Our Artisans</h2>
          </div>
          <p className="text-gray-500 ml-4 max-w-2xl">The creative souls behind Liliw's thriving arts scene.</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artisans..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-gray-800 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? '#0F1F3C' : '#f1f5f9',
                  color: activeCategory === cat ? '#00BFB3' : '#64748b',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredArtisans.map((artisan, idx) => {
                const photo = artisan.photos?.data?.[0]?.attributes?.url || artisan.photos?.[0]?.url;
                const photoUrl = photo ? (photo.startsWith('http') ? photo : `${STRAPI}${photo}`) : null;
                return (
                  <motion.div
                    key={artisan.id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedArtisan(artisan)}
                    className="group rounded-2xl border-2 border-gray-100 hover:border-teal-200 bg-white overflow-hidden cursor-pointer transition-all duration-300"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  >
                    {/* Photo or gradient placeholder */}
                    <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1F3C, #1a3a5c)' }}>
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt={artisan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">🎨</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,191,179,0.85)', color: 'white' }}>
                          {artisan.craft_type || 'Artisan'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{artisan.name}</h3>
                      {artisan.rating && <StarRow rating={artisan.rating} />}
                      {artisan.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {artisan.location}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {typeof artisan.description === 'string' ? artisan.description : artisan.description?.[0]?.children?.[0]?.text || ''}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredArtisans.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold">No artisans found</p>
                <p className="text-sm mt-1">Try a different search or category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artisan detail modal */}
      <AnimatePresence>
        {selectedArtisan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedArtisan(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
            >
              <div className="h-52 relative" style={{ background: 'linear-gradient(135deg, #0F1F3C, #1a3a5c)' }}>
                {(() => {
                  const photo = selectedArtisan.photos?.data?.[0]?.attributes?.url || selectedArtisan.photos?.[0]?.url;
                  const url = photo ? (photo.startsWith('http') ? photo : `${STRAPI}${photo}`) : null;
                  return url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={selectedArtisan.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">🎨</div>
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={() => setSelectedArtisan(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition">✕</button>
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#00BFB3', color: 'white' }}>{selectedArtisan.craft_type}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedArtisan.name}</h3>
                    {selectedArtisan.rating && <StarRow rating={selectedArtisan.rating} />}
                  </div>
                </div>
                {selectedArtisan.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#00BFB3' }} />
                    {selectedArtisan.location}
                  </div>
                )}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {typeof selectedArtisan.description === 'string'
                    ? selectedArtisan.description
                    : selectedArtisan.description?.[0]?.children?.[0]?.text || 'Skilled artisan from Liliw.'}
                </p>
                <div className="flex gap-3">
                  {selectedArtisan.contact_number && (
                    <a href={`tel:${selectedArtisan.contact_number}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#00BFB3' }}>
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {selectedArtisan.social_media && (
                    <a href={selectedArtisan.social_media} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 border-gray-200 hover:border-teal-300 text-gray-700">
                      <ExternalLink className="w-4 h-4" /> Social
                    </a>
                  )}
                  <button onClick={() => setSelectedArtisan(null)} className="ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #0F1F3C 0%, #1a3a5c 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #00BFB3, transparent 60%), radial-gradient(circle at 70% 30%, #FFB400, transparent 50%)' }} />
          <div className="relative">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-3xl font-bold text-white mb-3">Support Local Creatives</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Visit artisan workshops, attend live demonstrations, and bring home unique handcrafted pieces from Liliw's talented creators.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/attractions"
                className="px-7 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)', boxShadow: '0 4px 16px rgba(0,191,179,0.4)' }}
              >
                Visit Artisan Shops
              </Link>
              <Link
                href="/community"
                className="px-7 py-3 rounded-xl font-bold transition-all hover:bg-white/10"
                style={{ color: '#00BFB3', border: '2px solid rgba(0,191,179,0.5)' }}
              >
                Participate & Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
