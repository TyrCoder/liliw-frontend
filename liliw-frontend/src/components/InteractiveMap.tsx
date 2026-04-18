'use client';

import { useState } from 'react';
import { MapPin, Navigation, X, Eye, Camera, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Attraction {
  name: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
  id?: string;
}

interface InteractiveMapProps {
  attractions?: Attraction[];
  defaultLat?: number;
  defaultLng?: number;
  zoom?: number;
}

export default function InteractiveMap({
  attractions = [
    {
      name: 'Tsinelas Craft Heritage',
      lat: 14.3086,
      lng: 121.2286,
      category: 'Heritage',
      id: 'heritage-1',
    },
    {
      name: 'St. John the Baptist Church',
      lat: 14.3089,
      lng: 121.2289,
      category: 'Heritage',
      id: 'heritage-2',
    },
  ],
  defaultLat = 14.3086,
  defaultLng = 121.2286,
  zoom = 15,
}: InteractiveMapProps) {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3873.8046506834527!2d${defaultLng}!3d${defaultLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1618000000000`;

  const getDirections = (lat: number, lng: number, name: string) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  const handleAttractionClick = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setShowModal(true);
  };

  return (
    <div className="w-full space-y-6">
      {/* Map Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden shadow-2xl border-2 group"
        style={{ borderColor: '#00BFB3' }}
      >
        <div className="relative aspect-video w-full bg-gray-900">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title="Liliw Attractions Map"
          ></iframe>
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Attractions Grid with Enhanced Cards */}
      <div className="space-y-4">
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: '#0F1F3C' }}
        >
          <MapPin className="w-6 h-6" style={{ color: '#00BFB3' }} />
          Explore Attractions
        </motion.h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attractions.map((attraction, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onHoverStart={() => setHoveredId(idx)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => handleAttractionClick(attraction)}
              className="relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300 group/card"
              style={{ 
                borderColor: hoveredId === idx ? '#00BFB3' : '#E0F7F5',
                boxShadow: hoveredId === idx ? '0 12px 24px rgba(0, 191, 179, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Background Gradient */}
              <div 
                className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(0, 191, 179, 0.1) 0%, rgba(224, 247, 245, 0.05) 100%)' }}
              />

              {/* Content */}
              <div className="relative p-5 bg-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0 transition-transform duration-300 group-hover/card:scale-110"
                      style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}
                    >
                      <MapPin size={20} style={{ color: '#00BFB3' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-gray-900 truncate">{attraction.name}</h4>
                      {attraction.category && (
                        <p className="text-xs font-semibold text-teal-600 mt-1">{attraction.category}</p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg transition"
                    style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}
                  >
                    <Eye size={18} style={{ color: '#00BFB3' }} />
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      getDirections(attraction.lat, attraction.lng, attraction.name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm text-white transition-all"
                    style={{ backgroundColor: '#00BFB3' }}
                  >
                    <Navigation size={16} />
                    <span className="hidden sm:inline">Directions</span>
                    <span className="sm:hidden">Map</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttractionClick(attraction);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm border-2 transition-all"
                    style={{ borderColor: '#00BFB3', color: '#00BFB3' }}
                  >
                    <Camera size={16} />
                    <span className="hidden sm:inline">Details</span>
                    <span className="sm:hidden">Info</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal - Attraction Details */}
      <AnimatePresence>
        {showModal && selectedAttraction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full transition"
                style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}
              >
                <X size={24} style={{ color: '#00BFB3' }} />
              </motion.button>

              {/* Header */}
              <div 
                className="p-6 text-white"
                style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <MapPin size={24} />
                  <h2 className="text-2xl font-bold leading-tight">{selectedAttraction.name}</h2>
                </div>
                {selectedAttraction.category && (
                  <p className="text-sm text-white/80 mt-2">📍 {selectedAttraction.category}</p>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Coordinates */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">COORDINATES</p>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedAttraction.lat.toFixed(4)}° N, {selectedAttraction.lng.toFixed(4)}° E
                  </p>
                </div>

                {selectedAttraction.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">ABOUT</p>
                    <p className="text-gray-700 leading-relaxed">{selectedAttraction.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      getDirections(selectedAttraction.lat, selectedAttraction.lng, selectedAttraction.name);
                      setShowModal(false);
                    }}
                    className="py-3 px-4 rounded-lg font-bold text-white transition flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#00BFB3' }}
                  >
                    <Navigation size={18} />
                    Directions
                  </motion.button>
                  {selectedAttraction.id && (
                    <Link
                      href={`/immersive`}
                      onClick={() => setShowModal(false)}
                      className="py-3 px-4 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 hover:opacity-90 transform hover:scale-102 active:scale-95"
                      style={{ backgroundColor: '#0F1F3C' }}
                    >
                      <Eye size={18} />
                      3D View
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
