'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Navigation, X, Layers, ChevronLeft, Eye, Star, ChevronDown } from 'lucide-react';

const LILIW_CENTER = { longitude: 121.43605859033404, latitude: 14.130301377593792 };
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || '';

const LILIW_BOUNDARY_URL =
  'https://nominatim.openstreetmap.org/search?q=Liliw%2CLaguna%2CPhilippines&format=geojson&limit=1&polygon_geojson=1';

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
  photos: string[];
  rating?: number;
  has_virtual_tour?: boolean;
}

interface RouteInfo {
  distance: string;
  duration: number;
  destination: string;
  origin: string;
  steps: Array<{ instruction: string; distance: string }>;
}

type FilterType = 'all' | 'heritage' | 'spot' | 'dining';
type TravelMode = 'driving' | 'walking';

/* ─── Photo Slideshow ─────────────────────────────────────────────────── */
function PhotoSlideshow({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % photos.length);
        setFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(id);
  }, [photos.length]);

  if (!photos.length) return null;

  return (
    <div className="relative w-full h-32 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt={name}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F3C] via-transparent to-transparent" />
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {photos.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 14 : 5,
                height: 5,
                backgroundColor: i === index ? '#00BFB3' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Star Rating ─────────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-3 h-3"
          fill={i <= rating ? '#FFB400' : 'none'}
          stroke={i <= rating ? '#FFB400' : 'rgba(255,255,255,0.3)'}
        />
      ))}
      {rating > 0 && (
        <span className="text-xs ml-1 font-semibold" style={{ color: '#FFB400' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/* ─── Route Overlay ───────────────────────────────────────────────────── */
function RouteOverlay({
  routeInfo,
  routeLoading,
  travelMode,
  destinationAttraction,
  onClear,
  onModeChange,
}: {
  routeInfo: RouteInfo | null;
  routeLoading: boolean;
  travelMode: TravelMode;
  destinationAttraction: MapAttraction | null;
  onClear: () => void;
  onModeChange: (mode: TravelMode) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <AnimatePresence>
      {(routeInfo || routeLoading) && (
        <motion.div
          key="route-overlay"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[calc(100vw-2rem)]"
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: 'rgba(15,31,60,0.97)',
              border: '1px solid rgba(0,191,179,0.35)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {/* Loading state */}
            {routeLoading && (
              <div className="p-4 flex items-center gap-3">
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: 'rgba(0,191,179,0.3)', borderTopColor: '#00BFB3' }}
                />
                <span className="text-white/60 text-sm">Calculating shortest route…</span>
              </div>
            )}

            {/* Route info */}
            {!routeLoading && routeInfo && (
              <>
                {/* Origin → Destination visual */}
                <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-3">
                    {/* Dot-line-dot */}
                    <div className="flex flex-col items-center pt-1 gap-0.5 flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: '#00BFB3', borderColor: '#00BFB3' }} />
                      <div className="w-px h-7 bg-white/20" />
                      <div
                        className="w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          backgroundColor: destinationAttraction ? TYPE_CONFIG[destinationAttraction.type].color : '#00BFB3',
                          borderColor: destinationAttraction ? TYPE_CONFIG[destinationAttraction.type].color : '#00BFB3',
                        }}
                      />
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">From</p>
                      <p className="text-white text-sm font-semibold">{routeInfo.origin}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mt-3 mb-0.5">To</p>
                      <p className="text-white text-sm font-semibold truncate">{routeInfo.destination}</p>
                    </div>

                    {/* Close */}
                    <button
                      onClick={onClear}
                      className="text-white/30 hover:text-white transition flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Distance + duration + mode toggle */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Navigation className="w-4 h-4 flex-shrink-0" style={{ color: '#00BFB3' }} />
                  <div className="flex-1">
                    <span className="text-white font-bold">{routeInfo.distance} km</span>
                    <span className="text-white/30 mx-2">·</span>
                    <span className="text-white/70 text-sm">{routeInfo.duration} min</span>
                  </div>
                  {/* Driving / walking toggle */}
                  <div
                    className="flex rounded-lg overflow-hidden"
                    style={{ border: '1px solid rgba(0,191,179,0.3)' }}
                  >
                    {(['driving', 'walking'] as TravelMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => onModeChange(m)}
                        className="px-2.5 py-1.5 text-xs font-bold transition"
                        title={m === 'driving' ? 'Driving' : 'Walking'}
                        style={{
                          backgroundColor: travelMode === m ? '#00BFB3' : 'transparent',
                          color: travelMode === m ? '#0F1F3C' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {m === 'driving' ? '🚗' : '🚶'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Turn-by-turn toggle */}
                {routeInfo.steps.length > 1 && (
                  <>
                    <button
                      onClick={() => setStepsOpen((v) => !v)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold transition hover:bg-white/5"
                      style={{
                        color: '#00BFB3',
                        borderBottom: stepsOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      }}
                    >
                      <span>Turn-by-turn · {routeInfo.steps.length - 1} steps</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${stepsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {stepsOpen && (
                        <motion.div
                          key="steps"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="max-h-48 overflow-y-auto px-4 py-3 space-y-2.5">
                            {routeInfo.steps.slice(0, -1).map((step, i) => (
                              <div key={i} className="flex gap-2.5 items-start">
                                <span
                                  className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
                                  style={{ backgroundColor: 'rgba(0,191,179,0.15)', color: '#00BFB3' }}
                                >
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/80 text-xs leading-snug">{step.instruction}</p>
                                  <p className="text-white/30 text-[10px] mt-0.5">{step.distance}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Map Page ────────────────────────────────────────────────────────── */
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
  const [routeDestination, setRouteDestination] = useState<MapAttraction | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const [lilliwBoundary, setLilliwBoundary] = useState<GeoJSON.FeatureCollection | null>(null);

  // Liliw boundary from OSM
  useEffect(() => {
    fetch(LILIW_BOUNDARY_URL, { headers: { 'Accept-Language': 'en' } })
      .then((r) => r.json())
      .then((geojson) => {
        if (geojson?.features?.length) setLilliwBoundary(geojson);
      })
      .catch(() => {});
  }, []);

  // Attractions
  useEffect(() => {
    if (!TOKEN || TOKEN === 'pk.your_mapbox_token_here') {
      setNoToken(true);
      setLoading(false);
      return;
    }
    fetch('/api/strapi/attractions')
      .then((r) => r.json())
      .then((json) => {
        const data: any[] = json.data ?? [];
        const mapped: MapAttraction[] = data
          .filter((a) => {
            const c = a.attributes.coordinates;
            if (!c || !c.latitude || !c.longitude) return false;
            return c.latitude >= -90 && c.latitude <= 90 && c.longitude >= -180 && c.longitude <= 180;
          })
          .map((a) => {
            const rawPhotos: any[] = Array.isArray(a.attributes.photos) ? a.attributes.photos : [];
            const photos = rawPhotos
              .map((p: any) => {
                const url = p?.url ?? p?.formats?.medium?.url ?? p?.formats?.small?.url;
                if (!url) return null;
                return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
              })
              .filter(Boolean) as string[];
            return {
              id: String(a.id),
              name: a.attributes.name,
              type: a.type as 'heritage' | 'spot' | 'dining',
              description: a.attributes.description,
              lat: a.attributes.coordinates!.latitude,
              lng: a.attributes.coordinates!.longitude,
              photos,
              rating: a.attributes.rating || 0,
              has_virtual_tour: a.attributes.has_virtual_tour,
            };
          });
        setAttractions(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMapLoad = useCallback(() => {
    mapRef.current?.flyTo({
      center: [LILIW_CENTER.longitude, LILIW_CENTER.latitude],
      zoom: 14,
      duration: 2200,
      essential: true,
    });
    setTimeout(() => setMarkersReady(true), 800);
  }, []);

  const fetchDirections = useCallback(
    async (destination: MapAttraction, mode?: TravelMode) => {
      const activeMode = mode ?? travelMode;
      setRouteLoading(true);
      setRouteGeoJSON(null);
      setRouteInfo(null);
      setRouteDestination(destination);

      const origin = userLocation
        ? [userLocation.lng, userLocation.lat]
        : [LILIW_CENTER.longitude, LILIW_CENTER.latitude];
      const originName = userLocation ? 'Your Location' : 'Liliw Town Center';

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${activeMode}/${origin[0]},${origin[1]};${destination.lng},${destination.lat}?geometries=geojson&overview=full&steps=true&alternatives=true&access_token=${TOKEN}`
        );
        const data = await res.json();

        if (data.routes?.length) {
          // Pick the shortest route by distance
          const route = (data.routes as any[]).reduce(
            (best: any, r: any) => (r.distance < best.distance ? r : best),
            data.routes[0],
          );

          const steps: RouteInfo['steps'] = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
            instruction: s.maneuver?.instruction ?? '',
            distance:
              s.distance >= 1000
                ? `${(s.distance / 1000).toFixed(1)} km`
                : `${Math.round(s.distance)} m`,
          }));

          setRouteGeoJSON(route.geometry);
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.round(route.duration / 60),
            destination: destination.name,
            origin: originName,
            steps,
          });

          const coords = route.geometry.coordinates as [number, number][];
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          mapRef.current?.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 80, duration: 1500 },
          );
        }
      } catch {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=${activeMode}`,
          '_blank',
        );
      } finally {
        setRouteLoading(false);
      }
    },
    [userLocation, travelMode],
  );

  const handleModeChange = useCallback(
    (mode: TravelMode) => {
      setTravelMode(mode);
      if (routeDestination) fetchDirections(routeDestination, mode);
    },
    [routeDestination, fetchDirections],
  );

  const clearRoute = useCallback(() => {
    setRouteGeoJSON(null);
    setRouteInfo(null);
    setRouteDestination(null);
  }, []);

  const filtered = filter === 'all' ? attractions : attractions.filter((a) => a.type === filter);

  const handleMarkerClick = useCallback((attraction: MapAttraction) => {
    setSelected((prev) => (prev?.id === attraction.id ? null : attraction));
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
          <a
            href="https://account.mapbox.com/auth/signup/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition"
            style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
          >
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
        <Link
          href="/attractions"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: '#00BFB3' }} />
          <span className="text-white font-bold text-base">Liliw Map</span>
          {!loading && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(0,191,179,0.2)', color: '#00BFB3' }}
            >
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
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-3"
                style={{ borderColor: '#00BFB3' }}
              />
              <p className="text-white/60 text-sm">Loading attractions…</p>
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
              onGeolocate={(e) =>
                setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude })
              }
            />

            {/* Liliw boundary */}
            {lilliwBoundary && (
              <Source id="liliw-boundary" type="geojson" data={lilliwBoundary}>
                <Layer
                  id="liliw-fill"
                  type="fill"
                  paint={{ 'fill-color': '#00BFB3', 'fill-opacity': 0.06 }}
                />
                <Layer
                  id="liliw-border"
                  type="line"
                  paint={{
                    'line-color': '#00BFB3',
                    'line-width': 2.5,
                    'line-opacity': 0.75,
                    'line-dasharray': [4, 2],
                  }}
                />
              </Source>
            )}

            {/* Route line */}
            {routeGeoJSON && (
              <Source
                id="route"
                type="geojson"
                data={{ type: 'Feature', properties: {}, geometry: routeGeoJSON }}
              >
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
            {filtered.map((a, i) => {
              const isSelected = selected?.id === a.id;
              return (
                <Marker
                  key={a.id}
                  longitude={a.lng}
                  latitude={a.lat}
                  anchor="bottom"
                  style={{ zIndex: isSelected ? 3 : selected ? 1 : 2 }}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(a);
                  }}
                >
                  <motion.div
                    className="flex flex-col items-center cursor-pointer"
                    initial={markersReady ? { scale: 0, opacity: 0, y: -10 } : false}
                    animate={{ scale: isSelected ? 1.3 : 1, opacity: 1, y: 0 }}
                    transition={
                      isSelected
                        ? { type: 'spring', stiffness: 400, damping: 18 }
                        : { type: 'spring', stiffness: 260, damping: 18, delay: i * 0.04 }
                    }
                    whileHover={{ scale: isSelected ? 1.3 : 1.18 }}
                    whileTap={{ scale: 0.88 }}
                  >
                    <div className="relative flex items-center justify-center">
                      {isSelected && (
                        <>
                          <motion.div
                            className="absolute rounded-full"
                            initial={{ scale: 0.6, opacity: 0.7 }}
                            animate={{ scale: 2.6, opacity: 0 }}
                            transition={{ duration: 0.55, ease: 'easeOut' }}
                            style={{ width: 36, height: 36, backgroundColor: TYPE_CONFIG[a.type].color }}
                          />
                          <motion.div
                            className="absolute rounded-full"
                            initial={{ scale: 0.6, opacity: 0.4 }}
                            animate={{ scale: 3.2, opacity: 0 }}
                            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.08 }}
                            style={{ width: 36, height: 36, backgroundColor: TYPE_CONFIG[a.type].color }}
                          />
                        </>
                      )}
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center shadow-lg relative z-10"
                        style={{
                          backgroundColor: TYPE_CONFIG[a.type].color,
                          boxShadow: isSelected
                            ? `0 0 0 4px ${TYPE_CONFIG[a.type].color}44, 0 4px 16px rgba(0,0,0,0.4)`
                            : '0 2px 8px rgba(0,0,0,0.35)',
                        }}
                      >
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="w-0.5 h-2" style={{ backgroundColor: TYPE_CONFIG[a.type].color }} />
                  </motion.div>
                </Marker>
              );
            })}

            {/* Popup */}
            {selected && (
              <Popup
                longitude={selected.lng}
                latitude={selected.lat}
                anchor="bottom"
                offset={46}
                onClose={() => setSelected(null)}
                closeButton={false}
                maxWidth="300px"
              >
                <motion.div
                  initial={{ opacity: 0, y: 22, scale: 0.82 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{ backgroundColor: '#0F1F3C', border: '1px solid rgba(0,191,179,0.3)', minWidth: 240 }}
                >
                  {selected.photos.length > 0 && (
                    <div className="relative">
                      <PhotoSlideshow photos={selected.photos} name={selected.name} />
                      <button
                        onClick={() => setSelected(null)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition z-10"
                        style={{ backgroundColor: 'rgba(15,31,60,0.75)', backdropFilter: 'blur(4px)' }}
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}

                  <div
                    className={`px-4 ${selected.photos.length > 0 ? 'pt-2' : 'pt-4'} pb-3 flex items-start justify-between gap-2`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                        style={{
                          backgroundColor: TYPE_CONFIG[selected.type].color + '28',
                          color: TYPE_CONFIG[selected.type].color,
                        }}
                      >
                        {TYPE_CONFIG[selected.type].label}
                      </span>
                      <h3 className="text-white font-bold text-sm leading-tight mb-1.5">{selected.name}</h3>
                      {selected.rating && selected.rating > 0 ? <StarRating rating={selected.rating} /> : null}
                    </div>
                    {selected.photos.length === 0 && (
                      <button
                        onClick={() => setSelected(null)}
                        className="text-white/40 hover:text-white transition flex-shrink-0 mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {selected.description && (
                    <p className="px-4 pt-3 pb-0 text-white/50 text-xs leading-relaxed line-clamp-2">
                      {selected.description}
                    </p>
                  )}

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
                        {routeLoading ? (
                          <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Navigation className="w-3.5 h-3.5" /> Directions</>
                        )}
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
                </motion.div>
              </Popup>
            )}
          </Map>
        )}

        {/* Route overlay — floats bottom-center on the map */}
        <RouteOverlay
          routeInfo={routeInfo}
          routeLoading={routeLoading}
          travelMode={travelMode}
          destinationAttraction={routeDestination}
          onClear={clearRoute}
          onModeChange={handleModeChange}
        />

        {/* Legend — hidden when route is active to avoid overlap */}
        {!routeInfo && !routeLoading && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute bottom-4 left-4 rounded-xl p-3 text-xs space-y-1.5 border"
            style={{
              backgroundColor: 'rgba(15,31,60,0.92)',
              borderColor: 'rgba(0,191,179,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {(
              Object.entries(TYPE_CONFIG) as [
                keyof typeof TYPE_CONFIG,
                (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG],
              ][]
            ).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white/30"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-white/70">{cfg.label}</span>
              </div>
            ))}
            {!userLocation && (
              <p className="text-white/30 pt-1 border-t border-white/10 mt-1">
                Enable location for live directions
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
