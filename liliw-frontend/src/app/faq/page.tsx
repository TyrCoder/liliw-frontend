'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, HelpCircle } from 'lucide-react';
import { fuzzyMatch } from '@/lib/fuzzySearch';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface DisplayFaq {
  id: string | number;
  question: string;
  answer: string;
  category?: string;
  keywords?: string;
}

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText))
    return richText.map((block: any) => block.children?.map((c: any) => c.text).join(' ') || '').join(' ');
  return String(richText);
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<DisplayFaq[]>([]);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strapi/faqs')
      .then(r => r.json())
      .then(json => {
        setFaqs((json.data ?? []).map((faq: any) => {
          const a = faq.attributes ?? faq;
          return { id: faq.id, question: a.question, answer: extractText(a.answer), category: a.category };
        }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(faqs.map(f => f.category).filter((c): c is string => Boolean(c))))];

  const filtered = faqs.filter(faq => {
    const matchSearch = !searchTerm.trim() || fuzzyMatch(faq.question, searchTerm) || fuzzyMatch(faq.answer, searchTerm) || fuzzyMatch(faq.keywords ?? '', searchTerm);
    const matchCat = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Help</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Frequently Asked Questions</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>Find answers to common questions about visiting Liliw</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Search */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="mb-8">
          <div className="relative mb-4">
            <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0B3D91', opacity: 0.5 }} />
            <input
              type="text" placeholder="Search FAQs..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 text-sm shadow-sm"
              style={{ '--tw-ring-color': '#0B3D91', fontFamily: BL } as any}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: selectedCategory === cat ? '#0B3D91' : '#fff',
                  color: selectedCategory === cat ? '#F5C518' : '#0B3D91',
                  border: `1px solid ${selectedCategory === cat ? '#0B3D91' : 'rgba(11,61,145,0.2)'}`,
                  fontFamily: HL,
                }}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: BL }}>Showing {filtered.length} of {faqs.length} FAQs</p>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'rgba(11,61,145,0.2)', borderTopColor: '#0B3D91' }} />
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(faq => (
              <motion.div key={faq.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border overflow-hidden shadow-sm"
                style={{ borderColor: expandedId === faq.id ? '#0B3D91' : 'rgba(11,61,145,0.1)' }}>
                <button onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900" style={{ fontFamily: HL }}>{faq.question}</p>
                    {faq.category && (
                      <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: 'rgba(11,61,145,0.08)', color: '#0B3D91', fontFamily: BL }}>
                        {faq.category}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 mt-0.5 transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`} style={{ color: '#0B3D91' }} />
                </button>
                <AnimatePresence>
                  {expandedId === faq.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
                      <p className="px-6 py-5 text-gray-700 text-sm leading-relaxed" style={{ fontFamily: BL }}>{extractText(faq.answer)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#0B3D91' }} />
            <p className="font-semibold text-gray-600" style={{ fontFamily: HL }}>No FAQs found</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Try different keywords or clear the filter.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 p-8 rounded-2xl text-white text-center" style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: HL }}>Still need help?</h2>
          <p className="text-white/70 mb-6 text-sm" style={{ fontFamily: BL }}>Can&apos;t find the answer? Reach out to our community team!</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="mailto:tourism@liliw.gov.ph"
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
              Email Us
            </a>
            <Link href="/community"
              className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-white/30 text-white transition hover:bg-white/10"
              style={{ fontFamily: BL }}>
              Contact Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
