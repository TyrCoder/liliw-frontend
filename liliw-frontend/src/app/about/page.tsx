'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Users, Heart } from 'lucide-react';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const fade = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
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

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>About Liliw</h1>
              <Bunting flip />
            </div>
            <p className="text-white/70 text-sm sm:text-base text-center" style={{ fontFamily: BL }}>Discover the beauty, history, and heritage of Liliw, Laguna</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-16">

          <motion.div variants={fade} className="space-y-4">
            <h2 className="text-3xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>About Liliw</h2>
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-gray-700 leading-relaxed" style={{ fontFamily: BL }}>
              Liliw is a scenic municipality in the province of Laguna, Philippines, located at the foot of Mt. Banahaw.
              The name &quot;Liliw&quot; has evolved from &quot;Lilio,&quot; reflecting the town&apos;s historical journey and cultural significance.
            </p>
            <p className="text-gray-700 leading-relaxed" style={{ fontFamily: BL }}>
              Known for its handcrafted tsinelas (Filipino slippers) and rich cultural heritage, Liliw stands out as a
              destination where tradition meets natural beauty, offering visitors both tangible and intangible cultural experiences.
            </p>
          </motion.div>

          <motion.div variants={fade} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <MapPin className="w-8 h-8" />, title: 'Location', text: 'At the foot of Mt. Banahaw, Laguna Province, Calabarzon Region' },
              { icon: <Users className="w-8 h-8" />, title: 'Culture', text: 'Home to master craftspeople and vibrant cultural traditions spanning generations' },
              { icon: <Heart className="w-8 h-8" />, title: 'Heritage', text: 'Rich in tangible and intangible heritage, from churches to festivals' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="p-6 rounded-2xl bg-white shadow-sm border" style={{ borderColor: 'rgba(11,61,145,0.12)' }}>
                <div className="mb-3 p-2.5 rounded-xl inline-block" style={{ backgroundColor: 'rgba(11,61,145,0.08)', color: '#0B3D91' }}>{icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{title}</h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: BL }}>{text}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fade} className="space-y-4">
            <h2 className="text-3xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>Why Visit Liliw?</h2>
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <ul className="space-y-3">
              {[
                { label: 'Authentic Craftsmanship', text: 'Experience the world-renowned tsinelas-making tradition and support local artisans' },
                { label: 'Cultural Immersion', text: 'Participate in festivals, learn about traditions, and connect with communities' },
                { label: 'Natural Beauty', text: 'Enjoy cold springs, scenic viewpoints, and mountain landscapes' },
                { label: 'Heritage Exploration', text: 'Visit historic churches, heritage districts, and cultural landmarks' },
                { label: 'Farm Tourism', text: 'Connect with rural communities through agritourism experiences' },
              ].map(({ label, text }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: '#F5C518' }} />
                  <span className="text-gray-700" style={{ fontFamily: BL }}><strong style={{ color: '#0B3D91' }}>{label}:</strong> {text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fade} className="rounded-2xl p-8 text-center text-white overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#F5C518' }} />
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: HL }}>Ready to Explore?</h3>
            <p className="mb-6 text-white/80" style={{ fontFamily: BL }}>Discover the attractions, culture, and heritage that make Liliw unique</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/attractions"
                className="px-8 py-3 font-semibold rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                Explore Attractions
              </Link>
              <Link href="/culture"
                className="px-8 py-3 border-2 border-white/40 text-white font-semibold rounded-xl transition hover:bg-white/10"
                style={{ fontFamily: BL }}>
                Learn Our Culture
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
