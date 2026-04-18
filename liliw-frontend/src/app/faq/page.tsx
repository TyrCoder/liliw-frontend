'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronDown, Clock, HelpCircle } from 'lucide-react'
import { getFaqs } from '@/lib/strapi'
import SearchBar from '@/components/SearchBar'

interface FaqItem {
  id: number
  question: string
  answer: any
  category: string
  keywords?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFaqs = async () => {
      setIsLoading(true)
      const data = await getFaqs()
      setFaqs(data)
      setIsLoading(false)
    }
    fetchFaqs()
  }, [])

  // Extract text from rich text blocks
  const extractText = (richText: any) => {
    if (!richText) return ''
    if (Array.isArray(richText)) {
      return richText
        .map((block: any) =>
          block.children?.map((child: any) => child.text).join(' ') || ''
        )
        .join(' ')
    }
    return richText
  }

  // Get unique categories (filter out null/undefined)
  const categories = [
    'all',
    ...Array.from(new Set(faqs.map((faq) => faq.category).filter(Boolean))),
  ]

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      extractText(faq.answer).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || (faq.category && faq.category === selectedCategory)

    return matchesSearch && matchesCategory
  })

  return (
    <div suppressHydrationWarning className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 text-white shadow-lg" style={{ backgroundColor: '#0F1F3C' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Liliw
          </Link>
          <div className="flex gap-8 flex-wrap">
            <Link
              href="/"
              className="hover:opacity-80 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="hover:opacity-80 transition-colors"
            >
              About
            </Link>
            <Link
              href="/attractions"
              className="hover:opacity-80 transition-colors"
            >
              Attractions
            </Link>
            <Link
              href="/culture"
              className="hover:opacity-80 transition-colors"
            >
              Culture
            </Link>
            <Link
              href="/itineraries"
              className="hover:opacity-80 transition-colors"
            >
              Tours
            </Link>
            <Link
              href="/news"
              className="hover:opacity-80 transition-colors"
            >
              News
            </Link>
            <Link
              href="/community"
              className="hover:opacity-80 transition-colors"
            >
              Community
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="text-white py-12\" style={{ background: 'linear-gradient(to right, #00BFB3, #0F1F3C)' }}>
        <div className="max-w-6xl mx-auto px-4\">
          <Link href="/" className=\"flex items-center gap-2 mb-4 hover:opacity-80\">
            <ChevronLeft size={20} />
            Back to Home
          </Link>
          <h1 className=\"text-4xl font-bold mb-4\">Frequently Asked Questions</h1>
          <p className=\"text-lg\">
            Find answers to common questions about visiting Liliw
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search and Filter Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          {/* Search Box */}
          <motion.div variants={itemVariants} className="mb-8">
            <SearchBar
              placeholder="Search FAQs by question or answer..."
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              resultCount={filteredFaqs.length}
            />
          </motion.div>

          {/* Category Filter */}
          <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat
                    ? 'text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: selectedCategory === cat ? '#00BFB3' : undefined }}
              >
                {cat === 'all' ? 'All' : cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* FAQ Count */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 text-gray-600"
        >
          <p className="text-lg">
            Showing {filteredFaqs.length} of {faqs.length} FAQs
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'rgba(0, 191, 179, 0.3)', borderTopColor: '#00BFB3' }}></div>
            </div>
            <p className="mt-4 text-gray-600">Loading FAQs...</p>
          </motion.div>
        )}

        {/* FAQ Items */}
        {!isLoading && filteredFaqs.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredFaqs.map((faq) => (
              <motion.div key={faq.id} variants={itemVariants}>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === faq.id ? null : faq.id)
                  }
                  className="w-full border-2 rounded-lg p-6 text-left transition-all" style={{ backgroundColor: 'rgba(0, 191, 179, 0.05)', borderColor: '#00BFB3' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <HelpCircle size={20} className="flex-shrink-0" style={{ color: '#00BFB3' }} />
                        <h3 className="text-lg font-bold text-gray-800">
                          {faq.question}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        Category: {faq.category}
                      </p>
                    </div>
                    <ChevronDown
                      size={24}
                      className={`flex-shrink-0 transition-transform ${
                        expandedId === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Answer */}
                {expandedId === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white border-2 border-t-0 rounded-b-lg p-6 text-gray-700 leading-relaxed" style={{ borderColor: '#00BFB3' }}
                  >
                    <p className="mb-4">{extractText(faq.answer)}</p>
                    {faq.keywords && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Keywords:</span>{' '}
                          {faq.keywords}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && filteredFaqs.length === 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              No FAQs found matching your search.
            </p>
            <p className="text-gray-500 mt-2">Try different keywords or categories.</p>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-16 rounded-lg p-8 border-2" style={{ backgroundColor: 'rgba(0, 191, 179, 0.05)', borderColor: '#00BFB3' }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Still need help?
          </h2>
          <p className="text-gray-700 mb-6">
            Can't find the answer you're looking for? Reach out to our community team!
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="mailto:tourism@liliw.gov.ph"
              className="px-6 py-2 text-white rounded-lg transition-colors font-medium" style={{ backgroundColor: '#00BFB3' }}
            >
              Email Us
            </a>
            <Link
              href="/community"
              className="px-6 py-2 bg-white rounded-lg transition-colors font-medium border-2" style={{ color: '#00BFB3', borderColor: '#00BFB3' }}
            >
              Contact Community
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 mt-16 py-8 text-center text-gray-600">
        <p>&copy; 2026 Liliw Tourism. All rights reserved.</p>
      </footer>
    </div>
  )
}
