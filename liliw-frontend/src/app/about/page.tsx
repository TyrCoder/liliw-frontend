'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Users, Heart, Play } from 'lucide-react';
import { getCultureHeritages } from '@/lib/strapi';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((block: any) =>
        (block?.children ?? []).map((c: any) => c?.text ?? '').join(' ')
      )
      .join(' ');
  }
  return '';
}

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

export default function AboutPage() {
  const [cultureItems, setCultureItems] = useState<any[]>([]);
  const [loadingCulture, setLoadingCulture] = useState(true);

  useEffect(() => {
    getCultureHeritages()
      .then((data) => setCultureItems(data))
      .catch(() => {})
      .finally(() => setLoadingCulture(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>About Liliw</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Discover the beauty, history, and heritage of Liliw, Laguna</p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-16">

          {/* About Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">About Liliw</h2>
            <p className="text-gray-700 leading-relaxed">
              Liliw is a scenic municipality in the province of Laguna, Philippines, located at the foot of Mt. Banahaw.
              The name "Liliw" has evolved from "Lilio," reflecting the town's historical journey and cultural significance.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Known for its handcrafted tsinelas (Filipino slippers) and rich cultural heritage, Liliw stands out as a
              destination where tradition meets natural beauty, offering visitors both tangible and intangible cultural experiences.
            </p>
          </motion.div>

          {/* Key Facts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <MapPin className="w-8 h-8" />, title: 'Location', text: 'At the foot of Mt. Banahaw, Laguna Province, Calabarzon Region' },
              { icon: <Users className="w-8 h-8" />, title: 'Culture', text: 'Home to master craftspeople and vibrant cultural traditions spanning generations' },
              { icon: <Heart className="w-8 h-8" />, title: 'Heritage', text: 'Rich in tangible and intangible heritage, from churches to festivals' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0,191,179,0.08)', borderColor: '#00BFB3' }}>
                <div className="mb-3" style={{ color: '#00BFB3' }}>{icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-700 text-sm">{text}</p>
              </div>
            ))}
          </motion.div>

          {/* Culture & Heritage from Strapi */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Culture & Heritage</h2>
              <p className="text-gray-500">Living traditions and stories that define Liliw</p>
            </div>

            {loadingCulture ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-100" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-gray-100 rounded w-2/3" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cultureItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cultureItems.map((item: any, idx: number) => {
                  const a = item?.attributes ?? item;
                  const title = a?.title ?? '';
                  const description = extractText(a?.description);
                  const images: any[] = Array.isArray(a?.images) ? a.images : [];
                  const video = a?.video;
                  const coverUrl = images[0] ? mediaUrl(images[0]?.url ?? images[0]?.attributes?.url) : null;
                  const videoUrl = video ? mediaUrl(video?.url ?? video?.attributes?.url) : null;

                  return (
                    <motion.div
                      key={item.id ?? idx}
                      variants={itemVariants}
                      className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Media */}
                      {videoUrl ? (
                        <div className="relative h-48 bg-gray-900 flex items-center justify-center">
                          <video src={videoUrl} className="w-full h-full object-cover opacity-80" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      ) : coverUrl ? (
                        <div className="h-48 overflow-hidden">
                          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,0.08)' }}>
                          <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: '#00BFB3' }}>
                            <Heart className="w-6 h-6" style={{ color: '#00BFB3' }} />
                          </div>
                        </div>
                      )}

                      {/* Text */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                        {description && (
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{description}</p>
                        )}
                        {images.length > 1 && (
                          <div className="flex gap-1.5 mt-3">
                            {images.slice(1, 4).map((img: any, i: number) => {
                              const imgUrl = mediaUrl(img?.url ?? img?.attributes?.url);
                              return imgUrl ? (
                                <img key={i} src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                              ) : null;
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
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                No culture & heritage content yet — add items in Strapi under Culture & Heritage.
              </div>
            )}
          </motion.div>

          {/* Why Visit */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Why Visit Liliw?</h2>
            <ul className="space-y-3">
              {[
                { label: 'Authentic Craftsmanship', text: 'Experience the world-renowned tsinelas-making tradition and support local artisans' },
                { label: 'Cultural Immersion', text: 'Participate in festivals, learn about traditions, and connect with communities' },
                { label: 'Natural Beauty', text: 'Enjoy cold springs, scenic viewpoints, and mountain landscapes' },
                { label: 'Heritage Exploration', text: 'Visit historic churches, heritage districts, and cultural landmarks' },
                { label: 'Farm Tourism', text: 'Connect with rural communities through agritourism experiences' },
              ].map(({ label, text }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                  <span className="text-gray-700"><strong>{label}:</strong> {text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="rounded-2xl p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
            <h3 className="text-2xl font-bold mb-4">Ready to Explore?</h3>
            <p className="mb-6 opacity-90">Discover the attractions, culture, and heritage that make Liliw unique</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/attractions" className="px-8 py-3 bg-white font-semibold rounded-lg transition" style={{ color: '#00BFB3' }}>
                Explore Attractions
              </Link>
              <Link href="/culture" className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg transition">
                Learn Our Culture
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
