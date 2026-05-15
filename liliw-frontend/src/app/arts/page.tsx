'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, MapPin, Phone, ExternalLink, Search } from 'lucide-react';

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || '';
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const CATEGORIES = ['All', 'Footwear', 'Textile', 'Culinary', 'Visual', 'Music', 'Woodcarving'];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-3.5 h-3.5" fill={i <= rating ? '#F5C518' : 'none'} stroke={i <= rating ? '#F5C518' : '#d1d5db'} />
      ))}
    </div>
  );
}

export default function ArtsPage() {
  const [loading, setLoading] = useState(true);
  const [artForms, setArtForms] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArtisan, setSelectedArtisan] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/strapi/arts')
      .then(r => r.json())
      .then(({ artForms: artData, artisans: artisanData }) => {
        if (artData?.data?.length) setArtForms(artData.data.map((i: any) => i.attributes || i));
        if (artisanData?.data?.length) setArtisans(artisanData.data.map((i: any) => ({ ...(i.attributes || i), id: i.id })));
      }).catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const filteredArtisans = artisans.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.craft_type?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || a.craft_type?.toLowerCase().includes(activeCategory.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Craft & Creativity</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Arts & Creatives</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>From tsinelas craftsmanship to contemporary Filipino art — Liliw&apos;s creative soul</p>
          </motion.div>
        </div>
      </div>

      {/* Art Forms */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <p className="section-label mb-2" style={{ color: '#1565C0' }}>Traditions</p>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Art Forms & Traditions</h2>
          <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
          <p className="text-gray-500 text-sm max-w-2xl" style={{ fontFamily: BL }}>Living traditions passed down through generations of Liliw&apos;s creative community.</p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl bg-white h-48 animate-pulse border border-gray-100" />)}
          </div>
        )}
        {!loading && artForms.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="font-semibold text-lg" style={{ fontFamily: HL }}>No art forms listed yet</p>
            <p className="text-sm mt-1" style={{ fontFamily: BL }}>Check back soon as we add local arts and traditions.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artForms.map((art, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-6 bg-white border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: '#0B3D91' }} />
              {art.icon_emoji && <div className="text-5xl mb-4">{art.icon_emoji}</div>}
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{art.name || art.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4" style={{ fontFamily: BL }}>{art.description}</p>
              <div className="space-y-1.5">
                {(Array.isArray(art.features) ? art.features : []).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500" style={{ fontFamily: BL }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#F5C518' }} />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="h-px mx-auto max-w-6xl" style={{ background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />

      {/* Artisans */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <p className="section-label mb-2" style={{ color: '#1565C0' }}>People</p>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>Meet Our Artisans</h2>
          <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: '#F5C518' }} />
          <p className="text-gray-500 text-sm max-w-2xl" style={{ fontFamily: BL }}>The creative souls behind Liliw&apos;s thriving arts scene.</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artisans..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': '#0B3D91' } as any} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? '#0B3D91' : '#fff',
                  color: activeCategory === cat ? '#F5C518' : '#0B3D91',
                  border: `1px solid ${activeCategory === cat ? '#0B3D91' : 'rgba(11,61,145,0.2)'}`,
                  fontFamily: HL,
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl bg-white h-48 animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredArtisans.map((artisan, idx) => {
                const photo = artisan.photos?.data?.[0]?.attributes?.url || artisan.photos?.[0]?.url;
                const photoUrl = photo ? (photo.startsWith('http') ? photo : `${STRAPI}${photo}`) : null;
                return (
                  <motion.div key={artisan.id || idx} layout
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }} whileHover={{ y: -4 }}
                    onClick={() => setSelectedArtisan(artisan)}
                    className="group rounded-2xl border border-gray-100 bg-white overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-100">
                    <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)' }}>
                      {photoUrl
                        ? <img src={photoUrl} alt={artisan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="absolute inset-0 flex items-center justify-center opacity-10"><svg viewBox="0 0 24 24" className="w-14 h-14 text-white" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1 14H9V7h2v10zm4 0h-2V7h2v10z"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                          {artisan.craft_type || 'Artisan'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1" style={{ color: '#1A1A2E', fontFamily: HL }}>{artisan.name}</h3>
                      {artisan.rating && <StarRow rating={artisan.rating} />}
                      {artisan.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500" style={{ fontFamily: BL }}>
                          <MapPin className="w-3 h-3 shrink-0" />{artisan.location}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed" style={{ fontFamily: BL }}>
                        {typeof artisan.description === 'string' ? artisan.description : artisan.description?.[0]?.children?.[0]?.text || ''}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredArtisans.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <p className="font-semibold" style={{ fontFamily: HL }}>No artisans found</p>
                <p className="text-sm mt-1" style={{ fontFamily: BL }}>Try a different search or category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artisan detail modal */}
      <AnimatePresence>
        {selectedArtisan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedArtisan(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
              <div className="h-52 relative" style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)' }}>
                {(() => {
                  const photo = selectedArtisan.photos?.data?.[0]?.attributes?.url || selectedArtisan.photos?.[0]?.url;
                  const url = photo ? (photo.startsWith('http') ? photo : `${STRAPI}${photo}`) : null;
                  return url ? <img src={url} alt={selectedArtisan.name} className="w-full h-full object-cover" /> : null;
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={() => setSelectedArtisan(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition">
                  ✕
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                    {selectedArtisan.craft_type}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#1A1A2E', fontFamily: HL }}>{selectedArtisan.name}</h3>
                    {selectedArtisan.rating && <StarRow rating={selectedArtisan.rating} />}
                  </div>
                </div>
                {selectedArtisan.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3" style={{ fontFamily: BL }}>
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: '#0B3D91' }} />{selectedArtisan.location}
                  </div>
                )}
                <p className="text-gray-600 text-sm leading-relaxed mb-4" style={{ fontFamily: BL }}>
                  {typeof selectedArtisan.description === 'string' ? selectedArtisan.description : selectedArtisan.description?.[0]?.children?.[0]?.text || 'Skilled artisan from Liliw.'}
                </p>
                <div className="flex gap-3">
                  {selectedArtisan.contact_number && (
                    <a href={`tel:${selectedArtisan.contact_number}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#0B3D91', fontFamily: BL }}>
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {selectedArtisan.social_media && (
                    <a href={selectedArtisan.social_media} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-gray-200 hover:border-blue-200 text-gray-700"
                      style={{ fontFamily: BL }}>
                      <ExternalLink className="w-4 h-4" /> Social
                    </a>
                  )}
                  <button onClick={() => setSelectedArtisan(null)}
                    className="ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    style={{ fontFamily: BL }}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #F5C518, transparent 60%), radial-gradient(circle at 70% 30%, #ffffff, transparent 50%)' }} />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: HL }}>Support Local Creatives</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto text-sm" style={{ fontFamily: BL }}>
              Visit artisan workshops, attend live demonstrations, and bring home unique handcrafted pieces from Liliw&apos;s talented creators.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/attractions"
                className="px-7 py-3 rounded-xl font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                Visit Artisan Shops
              </Link>
              <Link href="/community"
                className="px-7 py-3 rounded-xl font-bold transition-all border border-white/30 text-white hover:bg-white/10"
                style={{ fontFamily: BL }}>
                Participate & Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
