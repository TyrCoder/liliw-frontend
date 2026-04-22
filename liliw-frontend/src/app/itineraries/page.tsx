'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, MapPin, Users } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

export default function ItinerariesPage() {
  const itineraries = [
    {
      title: 'Half-Day Tsinelas & Heritage Experience',
      duration: '4 hours',
      difficulty: 'Easy',
      highlights: [
        'Visit tsinelas workshops and meet local craftspeople',
        'Tour heritage church and historical district',
        'Sample local snacks and refreshments',
        'Browse and purchase authentic tsinelas',
      ],
    },
    {
      title: '1-Day Cultural Immersion Tour',
      duration: '8 hours',
      difficulty: 'Moderate',
      highlights: [
        'Full-day workshop experience in tsinelas-making',
        'Heritage site tours (churches, old buildings)',
        'Local lunch at traditional restaurant',
        'Visit artisan galleries and creative spaces',
        'Evening cultural performance (seasonal)',
      ],
    },
    {
      title: '2-Day Nature & Heritage Adventure',
      duration: '2 days',
      difficulty: 'Moderate',
      highlights: [
        'Day 1: Heritage tours, cultural exploration',
        'Overnight stay in local accommodations',
        'Day 2: Nature activities (cold springs, scenic hikes)',
        'Farm tourism and agricultural activities',
        'Sunset viewing at scenic viewpoints',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center font-semibold mb-6 group"
              style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>Suggested Itineraries</h1>
            <p className="text-xl text-gray-600">
              Explore Liliw with our curated tour experiences
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Itineraries */}
          <div className="space-y-6">
            {itineraries.map((itinerary, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-8 rounded-2xl bg-white border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: '#00BFB3' }}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{itinerary.title}</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-5 h-5" style={{ color: '#00BFB3' }} />
                        <span className="font-semibold">{itinerary.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" style={{ color: '#00BFB3' }} />
                        <span className="font-semibold text-gray-700">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            itinerary.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            itinerary.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {itinerary.difficulty}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pl-0 md:pl-0">
                  <h4 className="font-bold text-gray-900 mb-3">✓ Highlights:</h4>
                  <ul className="space-y-2">
                    {itinerary.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="font-bold mt-1" style={{ color: '#00BFB3' }}>→</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="mt-6 px-6 py-2 text-white font-semibold rounded-lg transition" style={{ backgroundColor: '#00BFB3' }}>
                  Learn More & Book
                </button>
              </motion.div>
            ))}
          </div>

          {/* Tips Section */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">💡 Travel Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="text-lg font-bold text-blue-900 mb-3">Best Time to Visit</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• <strong>Dry Season:</strong> November to May (best for outdoor activities)</li>
                  <li>• <strong>Festival Season:</strong> Check local festival schedules for cultural events</li>
                  <li>• <strong>Early Morning:</strong> Best for tsinelas workshops to see artisans at work</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                <h4 className="text-lg font-bold text-green-900 mb-3">What to Bring</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Comfortable walking shoes</li>
                  <li>• Sun protection (hat, sunscreen, sunglasses)</li>
                  <li>• Lightweight, breathable clothing</li>
                  <li>• Camera for memorable shots</li>
                  <li>• Reusable water bottle</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Getting Here */}
          <motion.div variants={itemVariants} className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">🚗 Getting to Liliw</h2>
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
              <p className="text-gray-700 mb-4">
                From Manila: Take the Calabarzon Highway towards Laguna. Liliw is located at the foot of Mt. Banahaw. 
                Travel time is approximately 2-3 hours from Metro Manila, depending on traffic.
              </p>
              <p className="text-gray-700">
                <strong>Pro tip:</strong> Early morning departures recommended to avoid heavy traffic and maximize your travel day.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Plan Your Journey.</p>
        </div>
      </motion.footer>
    </div>
  );
}
