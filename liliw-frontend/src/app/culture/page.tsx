'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Play, AlertCircle } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign:'middle' }}>
      <line x1="0" y1={cy} x2={W} y2={cy} stroke="#9CA3AF" strokeWidth="1.2" />
      {PENNANT.map((color, idx) => {
        const cx = r + idx * spacing;
        return (
          <g key={idx}>
            {Array.from({ length: panels }).map((_, i) => {
              const a1 = -Math.PI / 2 + i * arc;
              const a2 = -Math.PI / 2 + (i + 1) * arc;
              const x1 = (cx + r * Math.cos(a1)).toFixed(2);
              const y1 = (cy + r * Math.sin(a1)).toFixed(2);
              const x2 = (cx + r * Math.cos(a2)).toFixed(2);
              const y2 = (cy + r * Math.sin(a2)).toFixed(2);
              return <path key={i} d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={i % 2 === 0 ? color : color + 'bb'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ lineHeight: 0, backgroundColor: from }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:'100%', height:60, display:'block' }}>
        <path d="M0,0 C480,60 960,0 1440,60 L1440,60 L0,60 Z" fill={to} />
      </svg>
    </div>
  );
}

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText))
    return richText.map((block: any) => (block?.children ?? []).map((c: any) => c?.text ?? '').join(' ')).join(' ');
  return '';
}

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

export default function CulturePage() {
  const [cultureItems, setCultureItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/strapi/culture-heritages')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { const raw = json?.data ?? json ?? []; setCultureItems(Array.isArray(raw) ? raw : []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#1565C0 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>
                Culture &amp; Heritage
              </h1>
              <Bunting flip />
            </div>
            <p className="text-center text-white/70 text-base mt-2" style={{ fontFamily: BL }}>Living traditions and stories that define Liliw</p>
          </motion.div>
        </div>
      </div>
      <WaveDown from="#1565C0" to="#ffffff" />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse bg-white">
                <div className="h-56 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20 rounded-2xl border border-dashed border-red-200 bg-red-50">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="font-semibold text-lg text-red-600" style={{ fontFamily: HL }}>Could not load content</p>
            <p className="text-sm mt-1 text-red-400" style={{ fontFamily: BL }}>Make sure Strapi is running and the API token is valid.</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cultureItems.length === 0 && (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
            <Heart className="w-10 h-10 mx-auto mb-3 text-blue-300" />
            <p className="font-semibold text-lg" style={{ color: '#1A1A2E', fontFamily: HL }}>No culture & heritage content yet</p>
            <p className="text-sm mt-1 text-gray-500" style={{ fontFamily: BL }}>Add and publish items in Strapi under Culture &amp; Heritage.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && cultureItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cultureItems.map((item: any, idx: number) => {
              const a = item?.attributes ?? item;
              const title = a?.title ?? '';
              const description = extractText(a?.description);
              const rawImages = a?.images;
              const images: any[] = Array.isArray(rawImages) ? rawImages : Array.isArray(rawImages?.data) ? rawImages.data.map((d: any) => d?.attributes ?? d) : [];
              const rawVideo = a?.video;
              const video = rawVideo?.data?.attributes ?? rawVideo;
              const coverUrl = images[0] ? mediaUrl(images[0]?.url ?? images[0]?.attributes?.url) : null;
              const videoUrl = video?.url ? mediaUrl(video.url) : null;

              return (
                <motion.div key={item.id ?? idx}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white editorial-card">
                  {/* Media */}
                  {videoUrl ? (
                    <div className="relative h-56 bg-gray-900 flex items-center justify-center">
                      <video src={videoUrl} className="w-full h-full object-cover opacity-80" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : coverUrl ? (
                    <div className="h-56 overflow-hidden">
                      <img src={coverUrl} alt={title} className="w-full h-full object-cover card-img" />
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center" style={{ backgroundColor: 'rgba(11,61,145,0.06)' }}>
                      <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: '#0B3D91' }}>
                        <Heart className="w-6 h-6" style={{ color: '#0B3D91' }} />
                      </div>
                    </div>
                  )}

                  {/* Text */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{title}</h3>
                    {description && <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed" style={{ fontFamily: BL }}>{description}</p>}
                    {images.length > 1 && (
                      <div className="flex gap-1.5 mt-3">
                        {images.slice(1, 4).map((img: any, i: number) => {
                          const imgUrl = mediaUrl(img?.url ?? img?.attributes?.url);
                          return imgUrl ? <img key={i} src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" /> : null;
                        })}
                        {images.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                            +{images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Support CTA */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mt-16 rounded-2xl p-8 text-white text-center"
            style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#1565C0 100%)' }}>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: HL }}>Support Local Culture</h3>
            <p className="mb-6 text-white/70 text-sm" style={{ fontFamily: BL }}>
              Help preserve and celebrate Liliw&apos;s heritage through direct support of artisans and cultural initiatives
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { title: 'Buy Directly',   body: 'Purchase tsinelas and crafts from local makers' },
                { title: 'Attend Events',  body: 'Experience festivals and cultural celebrations' },
                { title: 'Learn Skills',   body: 'Join workshops and cultural tours' },
              ].map(card => (
                <div key={card.title} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <h4 className="font-bold mb-1" style={{ fontFamily: HL }}>{card.title}</h4>
                  <p className="text-sm text-white/80" style={{ fontFamily: BL }}>{card.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
