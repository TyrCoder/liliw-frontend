'use client';

import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Navigation, X, Layers, ChevronLeft, Eye } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';

const LILIW_CENTER = { longitude: 121.2286, latitude: 14.3086 };
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const TYPE_CONFIG = {
  heritage: { color: '#FFB400', label: '🏛️ Heritage' },
  spot:     { color: '#00BFB3', label: '🏞️ Spots'   },
  dining:   { color: '#FF6B6B', label: '🍽️ Dining'  },
};

interface MapAttraction {
  id: string;
  name: string;
  type: 'heritage' | 'spot' | 'dining';
  description?: string;
  lat: number;
  lng: number;
  has_virtual_tour?: boolean;
}

type FilterType = 'all' | 'heritage' | 'spot' | 'dining';

export default function MapPage() {
  const [attractions, setAttractions] = useState<MapAttraction[]>([]);
  const [selected, setSelected] = useState<MapAttraction | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    if (!TOKEN || TOKEN === 'pk.your_mapbox_token_here') {
      setNoToken(true);
      setLoading(false);
      return;
    }
    getAllAttractions().then((data) => {
      const mapped: MapAttraction[] = data
        .filter((a) => {
          const c = a.attributes.coordinates;
          return c && c.latitude && c.longitude;
        })
        .map((a) => ({
          id: String(a.id),
          name: a.attributes.name,
          type: a.type as 'heritage' | 'spot' | 'dining',
          description: a.attributes.description,
          lat: a.attributes.coordinates!.latitude,
          lng: a.attributes.coordinates!.longitude,
          has_virtual_tour: a.attributes.has_virtual_tour,
        }));
      setAttractions(mapped);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? attractions : attractions.filter((a) => a.type === filter);

  const handleMarkerClick = useCallback((attraction: MapAttraction) => {
    setSelected((prev) => prev?.id === attraction.id ? null : attraction);
  }, []);

  if (noToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F1F3C' }}>
        <div className="text-center text-white p-8">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-40" style={{ color: '#00BFB3' }} />
          <h2 className="text-2xl font-bold mb-2">Mapbox Token Required</h2>
          <p className="text-white/60 mb-4">Add your Mapbox access token to get started:</p>
          <code className="bg-white/10 px-4 py-2 rounded-lg text-sm block mb-4">
            NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
          </code>
          <a href="https://account.mapbox.com/auth/signup/" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition"
            style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}>
            Get a free token at mapbox.com
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 65px)', backgroundColor: '#0F1F3C' }}>

      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0 flex-wrap gap-y-2"
        style={{ borderColor: '#00BFB3', backgroundColor: 'rgba(15,31,60,0.98)' }}
      >
        <Link href="/attractions"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: '#00BFB3' }} />
          <span className="text-white font-bold text-base">Liliw Map</span>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(0,191,179,0.2)', color: '#00BFB3' }}>
              {filtered.length} places
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 ml-auto flex-wrap">
          {(['all', 'heritage', 'spot', 'dining'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition"
              style={{
                backgroundColor: filter === f ? '#00BFB3' : 'rgba(255,255,255,0.08)',
                color: filter === f ? '#0F1F3C' : 'rgba(255,255,255,0.7)',
              }}
            >
              {f === 'all' ? 'All' : TYPE_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-3"
                style={{ borderColor: '#00BFB3' }} />
              <p className="text-white/60 text-sm">Loading attractions...</p>
            </div>
          </div>
        ) : (
          <Map
            mapboxAccessToken={TOKEN}
            initialViewState={{ ...LILIW_CENTER, zoom: 14 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={() => setSelected(null)}
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" />

            {/* Markers */}
            {filtered.map((a) => (
              <Marker
                key={a.id}
                longitude={a.lng}
                latitude={a.lat}
                anchor="bottom"
                onClick={(e) => { e.originalEvent.stopPropagation(); handleMarkerClick(a); }}
              >
                <motion.div
                  className="flex flex-col items-center cursor-pointer"
                  animate={{ scale: selected?.id === a.id ? 1.25 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: TYPE_CONFIG[a.type].color }}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-0.5 h-2" style={{ backgroundColor: TYPE_CONFIG[a.type].color }} />
                </motion.div>
              </Marker>
            ))}

            {/* Popup */}
            {selected && (
              <Popup
                longitude={selected.lng}
                latitude={selected.lat}
                anchor="bottom"
                offset={46}
                onClose={() => setSelected(null)}
                closeButton={false}
                maxWidth="280px"
              >
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl border"
                  style={{ backgroundColor: '#0F1F3C', borderColor: 'rgba(0,191,179,0.3)', minWidth: 220 }}
                >
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                        style={{
                          backgroundColor: TYPE_CONFIG[selected.type].color + '22',
                          color: TYPE_CONFIG[selected.type].color,
                        }}
                      >
                        {TYPE_CONFIG[selected.type].label}
                      </span>
                      <h3 className="text-white font-bold text-sm leading-tight">{selected.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-white/40 hover:text-white transition flex-shrink-0 mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  {selected.description && (
                    <p className="px-4 pt-3 pb-0 text-white/50 text-xs leading-relaxed line-clamp-2">
                      {selected.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/attractions/${selected.id}`}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-center transition hover:opacity-90 flex items-center justify-center gap-1"
                        style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button
                        onClick={() => window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=driving`,
                          '_blank'
                        )}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border transition hover:bg-white/5 flex items-center justify-center gap-1"
                        style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </button>
                    </div>
                    {selected.has_virtual_tour && (
                      <Link
                        href="/immersive"
                        className="w-full py-2 rounded-xl text-xs font-bold text-center transition hover:opacity-90 flex items-center justify-center gap-1"
                        style={{ backgroundColor: '#FFB400', color: '#0F1F3C' }}
                      >
                        🥽 Virtual Tour
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}

        {/* Legend */}
        <div
          className="absolute bottom-4 left-4 rounded-xl p-3 text-xs space-y-1.5 border"
          style={{ backgroundColor: 'rgba(15,31,60,0.92)', borderColor: 'rgba(0,191,179,0.2)', backdropFilter: 'blur(8px)' }}
        >
          {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: cfg.color }} />
              <span className="text-white/70">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
