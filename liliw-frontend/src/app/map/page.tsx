'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Navigation, X, Layers, ChevronLeft, Eye } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';

const LILIW_CENTER = { longitude: 121.43605859033404, latitude: 14.130301377593792 };
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

interface RouteInfo {
  distance: string;
  duration: number;
}

type FilterType = 'all' | 'heritage' | 'spot' | 'dining';

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [attractions, setAttractions] = useState<MapAttraction[]>([]);
  const [selected, setSelected] = useState<MapAttraction | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [noToken, setNoToken] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Geometry | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Fly in to Liliw on load
  const handleMapLoad = useCallback(() => {
    mapRef.current?.flyTo({
      center: [LILIW_CENTER.longitude, LILIW_CENTER.latitude],
      zoom: 14,
      duration: 2000,
      essential: true,
    });
  }, []);

  // Draw route on map using Mapbox Directions API
  const fetchDirections = useCallback(async (destination: MapAttraction) => {
    setRouteLoading(true);
    setRouteGeoJSON(null);
    setRouteInfo(null);

    const origin = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [LILIW_CENTER.longitude, LILIW_CENTER.latitude];

    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination.lng},${destination.lat}?geometries=geojson&overview=full&access_token=${TOKEN}`
      );
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteGeoJSON(route.geometry);
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60),
        });

        // Fit map to the full route
        const coords = route.geometry.coordinates as [number, number][];
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        mapRef.current?.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 80, duration: 1500 }
        );
      }
    } catch {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`,
        '_blank'
      );
    } finally {
      setRouteLoading(false);
    }
  }, [userLocation]);

  const clearRoute = useCallback(() => {
    setRouteGeoJSON(null);
    setRouteInfo(null);
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

        {/* Active route info */}
        {routeInfo && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
              style={{ backgroundColor: 'rgba(0,191,179,0.15)', color: '#00BFB3', border: '1px solid rgba(0,191,179,0.3)' }}>
              <Navigation className="w-3 h-3" />
              {routeInfo.distance} km · {routeInfo.duration} min
            </span>
            <button onClick={clearRoute} className="text-white/40 hover:text-white transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
            ref={mapRef}
            mapboxAccessToken={TOKEN}
            initialViewState={{ ...LILIW_CENTER, zoom: 10 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={() => setSelected(null)}
            onLoad={handleMapLoad}
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl
              position="bottom-right"
              onGeolocate={(e) => setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude })}
            />

            {/* Route line */}
            {routeGeoJSON && (
              <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeGeoJSON }}>
                <Layer
                  id="route-casing"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{ 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.25 }}
                />
                <Layer
                  id="route-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{ 'line-color': '#00BFB3', 'line-width': 4, 'line-opacity': 0.9 }}
                />
              </Source>
            )}

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
                        onClick={() => fetchDirections(selected)}
                        disabled={routeLoading}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border transition hover:bg-white/5 flex items-center justify-center gap-1 disabled:opacity-50"
                        style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        {routeLoading
                          ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                          : <><Navigation className="w-3.5 h-3.5" /> Directions</>
                        }
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
          {!userLocation && (
            <p className="text-white/30 pt-1 border-t border-white/10 mt-1">
              Enable location for live directions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
