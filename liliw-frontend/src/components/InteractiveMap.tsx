'use client';

import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface Attraction {
  name: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
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
    },
    {
      name: 'St. John the Baptist Church',
      lat: 14.3089,
      lng: 121.2289,
      category: 'Heritage',
    },
  ],
  defaultLat = 14.3086,
  defaultLng = 121.2286,
  zoom = 15,
}: InteractiveMapProps) {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);

  // Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3873.8046506834527!2d${defaultLng}!3d${defaultLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1618000000000`;

  const getDirections = (lat: number, lng: number, name: string) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="w-full space-y-4">
      {/* Map Embed */}
      <div className="rounded-2xl overflow-hidden shadow-lg border-2" style={{ borderColor: '#E0F7F5' }}>
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title="Liliw Attractions Map"
          ></iframe>
        </div>
      </div>

      {/* Attractions List */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold" style={{ color: '#0F1F3C' }}>
          📍 Nearby Attractions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attractions.map((attraction, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedAttraction(attraction)}
              className="p-4 bg-white border-2 rounded-xl cursor-pointer hover:shadow-lg transition"
              style={{ borderColor: '#E0F7F5' }}
            >
              <div className="flex items-start gap-3">
                <MapPin size={20} style={{ color: '#00BFB3' }} className="flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{attraction.name}</h4>
                  {attraction.category && (
                    <p className="text-xs text-gray-600">{attraction.category}</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      getDirections(attraction.lat, attraction.lng, attraction.name);
                    }}
                    className="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition hover:shadow-md"
                    style={{ backgroundColor: '#00BFB3' }}
                  >
                    <Navigation size={14} />
                    Directions
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Attraction Details */}
      {selectedAttraction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-l-4 shadow-md"
          style={{ borderLeftColor: '#00BFB3' }}
        >
          <h4 className="font-bold text-lg mb-2" style={{ color: '#0F1F3C' }}>
            {selectedAttraction.name}
          </h4>
          {selectedAttraction.description && (
            <p className="text-gray-700 text-sm mb-3">{selectedAttraction.description}</p>
          )}
          <div className="text-xs text-gray-600 mb-3">
            📍 {selectedAttraction.lat.toFixed(4)}, {selectedAttraction.lng.toFixed(4)}
          </div>
          <button
            onClick={() =>
              getDirections(selectedAttraction.lat, selectedAttraction.lng, selectedAttraction.name)
            }
            className="w-full py-2.5 text-white font-semibold rounded-lg transition hover:opacity-90 shadow-md"
            style={{ backgroundColor: '#00BFB3' }}
          >
            Get Directions
          </button>
        </motion.div>
      )}
    </div>
  );
}
