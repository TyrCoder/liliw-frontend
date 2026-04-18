'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Layers } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import ImmersiveViewer from '@/components/ImmersiveViewer';

interface Attraction {
  id: string;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    photos?: Array<{
      id: number;
      url: string;
      name: string;
    }>;
  };
  type: 'heritage' | 'spot';
}

export default function ImmersivePage() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllAttractions();
        setAttractions(data);
        if (data.length > 0) {
          setSelectedAttractionId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching attractions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedAttraction = attractions.find((a) => a.id === selectedAttractionId);
  const displayImage =
    selectedAttraction?.attributes.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1469022563428-aa0e26e5c742?w=1200&h=800&fit=crop';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1F3C' }}>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b-2 backdrop-blur-sm"
        style={{ 
          borderBottomColor: '#00BFB3', 
          backgroundColor: 'rgba(15, 31, 60, 0.95)',
          boxShadow: '0 4px 12px rgba(0, 191, 179, 0.1)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div whileHover={{ x: -2 }} whileTap={{ x: -4 }}>
            <Link href="/attractions" className="inline-flex items-center gap-2 text-white hover:opacity-100 opacity-80 font-semibold transition px-3 py-2 rounded-lg hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </motion.div>
          <motion.h1 
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <Layers className="w-6 h-6" style={{ color: '#00BFB3' }} />
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent hidden sm:inline">3D Tours</span>
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent sm:hidden">3D</span>
          </motion.h1>
          <div className="w-12 sm:w-16" />
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderColor: '#00BFB3' }} />
            <p className="text-white mt-4">Loading immersive experiences...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Viewer */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3"
            >
              {selectedAttraction && (
                <ImmersiveViewer
                  title={selectedAttraction.attributes.name}
                  imageUrl={`${process.env.NEXT_PUBLIC_STRAPI_URL}${displayImage}`}
                  description={selectedAttraction.attributes.description}
                />
              )}
            </motion.div>

            {/* Sidebar - Attraction List */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 bg-gray-900 rounded-xl p-4 border-2" style={{ borderColor: '#E0F7F5' }}>
                <h2 className="text-white font-bold mb-4">Available Tours</h2>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attractions.map((attraction, index) => (
                    <motion.button
                      key={attraction.id}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => setSelectedAttractionId(attraction.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedAttractionId === attraction.id
                          ? 'text-white font-semibold'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      style={{
                        backgroundColor:
                          selectedAttractionId === attraction.id ? 'rgba(0, 191, 179, 0.3)' : 'transparent',
                        borderLeft: selectedAttractionId === attraction.id ? '3px solid #00BFB3' : 'none',
                        paddingLeft: selectedAttractionId === attraction.id ? '12px' : '12px',
                      }}
                    >
                      <div className="font-semibold text-sm">{attraction.attributes.name}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {attraction.type === 'heritage' ? '🏛️ Heritage' : '🏞️ Tourist Spot'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Info Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 bg-gradient-to-br rounded-xl p-4 border-2"
                style={{
                  backgroundColor: 'rgba(0, 191, 179, 0.1)',
                  borderColor: '#00BFB3',
                }}
              >
                <h3 className="text-white font-semibold mb-2">💡 How It Works</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>✓ Drag to look around</li>
                  <li>✓ Mobile: Touch & move</li>
                  <li>✓ VR Mode: With headset</li>
                  <li>✓ Screenshot: Save views</li>
                </ul>
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
