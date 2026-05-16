'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Users, Phone, Mail, Plus, Trash2, Share2, CheckCircle, AlertCircle, Navigation, Sparkles, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface ItineraryItem {
  id: string;
  name: string;
  date: string;
  duration: string;
  notes: string;
  category?: string;
}

interface Suggestion {
  id: string | number;
  name: string;
  category: string;
  location?: string;
}

interface ItineraryBuilderProps {
  attractionName: string;
  attractionId: string;
  price?: number;
  maxParticipants?: number;
  attractionCategory?: string;
}

async function geocodePlace(name: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${name}, Liliw, Laguna, Philippines`);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=ph`
    );
    const data = await res.json();
    const f = data?.features?.[0];
    return f ? (f.center as [number, number]) : null;
  } catch { return null; }
}

export default function ItineraryBuilder({
  attractionName, attractionId, price = 0, maxParticipants = 50, attractionCategory,
}: ItineraryBuilderProps) {
  const [items, setItems] = useState<ItineraryItem[]>([{
    id: attractionId, name: attractionName, date: '', duration: '2-3 hours', notes: '', category: attractionCategory,
  }]);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', participants: 1 });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Delete + suggestions
  const [deleteTarget, setDeleteTarget] = useState<ItineraryItem | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Map
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    setLocationStatus('pending');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation([pos.coords.longitude, pos.coords.latitude]); setLocationStatus('granted'); },
      () => setLocationStatus('denied'),
    );
  }, []);

  // Build map once showMap is true
  useEffect(() => {
    if (!showMap || !mapContainer.current || mapInstance.current) return;

    let cancelled = false;

    import('mapbox-gl').then(async ({ default: mapboxgl }) => {
      if (cancelled || !mapContainer.current) return;

      // @ts-ignore
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [121.4359, 14.1297],
        zoom: 13,
      });

      mapInstance.current = map;

      map.on('load', async () => {
        if (cancelled) return;

        const coords: [number, number][] = [];

        if (userLocation) {
          coords.push(userLocation);
          new mapboxgl.Marker({ color: '#1565C0' })
            .setLngLat(userLocation)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your Location'))
            .addTo(map);
        }

        for (const item of items.filter(i => i.name)) {
          const coord = await geocodePlace(item.name);
          if (coord) {
            coords.push(coord);
            new mapboxgl.Marker({ color: '#EF4444' })
              .setLngLat(coord)
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(item.name))
              .addTo(map);
          }
        }

        if (coords.length >= 2) {
          const coordStr = coords.map(c => c.join(',')).join(';');
          try {
            const r = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const d = await r.json();
            const geometry = d?.routes?.[0]?.geometry;
            if (geometry) {
              map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry } });
              map.addLayer({ id: 'route', type: 'line', source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#1565C0', 'line-width': 4, 'line-opacity': 0.85 },
              });
            }
          } catch {}

          const bounds = coords.reduce(
            (b, c) => b.extend(c as any),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, { padding: 60 });
        }
      });
    });

    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, [showMap, userLocation, items]);

  // Open delete dialog and load suggestions
  const openDelete = async (item: ItineraryItem) => {
    setDeleteTarget(item);
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/strapi/attractions');
      const json = await res.json();
      const all: any[] = json.data ?? [];
      const inList = new Set(items.map(i => String(i.id)));
      const filtered = all
        .filter(a => !inList.has(String(a.id)))
        .filter(a => !item.category || (a.attributes?.category === item.category || a.type === item.category))
        .slice(0, 4)
        .map(a => ({
          id: a.id,
          name: a.attributes?.name || '',
          category: a.attributes?.category || a.type || '',
          location: a.attributes?.location || '',
        }));
      setSuggestions(filtered);
    } catch { setSuggestions([]); }
    finally { setLoadingSuggestions(false); }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSuggestions([]);
  };

  const swapWithSuggestion = (s: Suggestion) => {
    if (!deleteTarget) return;
    setItems(prev => prev.map(i => i.id === deleteTarget.id ? {
      ...i, id: `sug-${s.id}`, name: s.name, category: s.category,
    } : i));
    setDeleteTarget(null);
    setSuggestions([]);
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: name === 'participants' ? parseInt(value) : value }));
  };

  const handleItemChange = (id: string, field: string, value: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const addActivity = () => setItems(prev => [...prev, {
    id: `act-${Date.now()}`, name: '', date: '', duration: '1-2 hours', notes: '',
  }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      setStatus('error'); setMessage('Please fill all contact information fields'); return;
    }
    if (items.some(i => !i.name || !i.date)) {
      setStatus('error'); setMessage('Please fill all destination names and dates'); return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guestInfo, itinerary: items,
          totalActivities: items.length,
          estimatedCost: price * guestInfo.participants * items.length,
        }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Itinerary saved! Check your email for details.');
        setShowMap(true);
        if (locationStatus === 'idle') requestLocation();
        setTimeout(() => setStatus('idle'), 6000);
      } else {
        setStatus('error'); setMessage('Failed to save itinerary. Try again.');
      }
    } catch (err) {
      setStatus('error'); setMessage('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const minDate = new Date().toISOString().split('T')[0];
  const estimatedCost = price * guestInfo.participants * items.length;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 md:p-8 border-l-4"
        style={{ borderColor: '#00BFB3' }}>

        <h3 className="text-2xl font-bold mb-6" style={{ color: '#0F1F3C', fontFamily: HL }}>
          Build Your Itinerary
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Information */}
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-bold mb-4" style={{ color: '#0F1F3C', fontFamily: HL }}>Your Information</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#0F1F3C', fontFamily: BL }}>Full Name *</label>
              <input type="text" name="name" value={guestInfo.name} onChange={handleGuestChange}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C', fontFamily: BL }}>
                  <Mail size={14} style={{ color: '#00BFB3' }} /> Email *
                </label>
                <input type="email" name="email" value={guestInfo.email} onChange={handleGuestChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C', fontFamily: BL }}>
                  <Phone size={14} style={{ color: '#00BFB3' }} /> Phone *
                </label>
                <input type="tel" name="phone" value={guestInfo.phone} onChange={handleGuestChange}
                  placeholder="+63 (555) 000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#0F1F3C', fontFamily: BL }}>
                <Users size={14} style={{ color: '#00BFB3' }} /> Number of Participants
              </label>
              <select name="participants" value={guestInfo.participants} onChange={handleGuestChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm">
                {[...Array(maxParticipants)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold" style={{ color: '#0F1F3C', fontFamily: HL }}>Destinations</h4>
              <button type="button" onClick={addActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-semibold transition hover:opacity-80"
                style={{ backgroundColor: '#00BFB3', color: 'white', fontFamily: BL }}>
                <Plus size={15} /> Add Stop
              </button>
            </div>

            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-4 rounded-lg mb-3 border-l-4" style={{ borderColor: '#00BFB3' }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: '#0F1F3C', fontFamily: HL }}>
                      <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#00BFB3' }}>{idx + 1}</span>
                      Stop {idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => openDelete(item)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C', fontFamily: BL }}>Destination *</label>
                      <input type="text" value={item.name}
                        onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="e.g., Liliw Church"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#0F1F3C', fontFamily: BL }}>
                        <Calendar size={12} /> Date *
                      </label>
                      <input type="date" value={item.date} min={minDate}
                        onChange={e => handleItemChange(item.id, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C', fontFamily: BL }}>Duration</label>
                      <input type="text" value={item.duration}
                        onChange={e => handleItemChange(item.id, 'duration', e.target.value)}
                        placeholder="e.g., 2-3 hours"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#0F1F3C', fontFamily: BL }}>Notes</label>
                      <input type="text" value={item.notes}
                        onChange={e => handleItemChange(item.id, 'notes', e.target.value)}
                        placeholder="Special requests..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="bg-white p-4 rounded-lg space-y-2 text-sm" style={{ fontFamily: BL }}>
            <div className="flex justify-between"><span className="text-gray-600">Stops:</span><span className="font-semibold">{items.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Participants:</span><span className="font-semibold">× {guestInfo.participants}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-base" style={{ color: '#0F1F3C' }}>
              <span>Estimated Total:</span>
              <span style={{ color: '#00BFB3' }}>₱{estimatedCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Status */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
              style={{ fontFamily: BL }}>
              {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button type="submit" disabled={status === 'loading'}
              className="flex-1 px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#00BFB3', color: 'white', fontFamily: HL }}>
              {status === 'loading' ? <><Loader size={16} className="animate-spin" /> Saving…</> : <><CheckCircle size={16} /> Save Itinerary</>}
            </button>
            <button type="button"
              className="px-4 py-3 rounded-lg border-2 transition flex items-center justify-center"
              style={{ borderColor: '#00BFB3', color: '#00BFB3' }} title="Share">
              <Share2 size={18} />
            </button>
          </div>
        </form>

        {/* Location permission banner */}
        {locationStatus === 'idle' && showMap && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center justify-between gap-3 border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-800" style={{ fontFamily: BL }}>
              <Navigation size={16} className="shrink-0" />
              Allow location access to show your starting point on the map
            </div>
            <button onClick={requestLocation}
              className="shrink-0 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
              Allow
            </button>
          </motion.div>
        )}

        {/* Route Map */}
        <AnimatePresence>
          {showMap && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} style={{ color: '#00BFB3' }} />
                <h4 className="font-bold text-sm" style={{ color: '#0F1F3C', fontFamily: HL }}>Your Route</h4>
                {locationStatus === 'granted' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold" style={{ fontFamily: BL }}>
                    Starting from your location
                  </span>
                )}
              </div>
              <div ref={mapContainer} className="rounded-xl overflow-hidden shadow-md" style={{ height: 360 }} />
              <p className="text-xs text-gray-400 mt-2 text-center" style={{ fontFamily: BL }}>
                Red pins = destinations · Blue line = driving route
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => { setDeleteTarget(null); setSuggestions([]); }}>
            <motion.div initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Dialog header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 text-base" style={{ fontFamily: HL }}>
                      Remove this stop?
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: BL }}>
                      "{deleteTarget.name}"
                    </p>
                  </div>
                  <button onClick={() => { setDeleteTarget(null); setSuggestions([]); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={15} style={{ color: '#00BFB3' }} />
                  <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: HL }}>
                    Or swap with a similar destination
                  </p>
                </div>

                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-3" style={{ fontFamily: BL }}>
                    <Loader size={14} className="animate-spin" /> Finding suggestions…
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => swapWithSuggestion(s)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition group">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-gray-800 group-hover:text-teal-700" style={{ fontFamily: HL }}>
                              {s.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {s.location && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5" style={{ fontFamily: BL }}>
                                  <MapPin size={10} /> {s.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                            style={{ backgroundColor: '#e0faf8', color: '#00BFB3', fontFamily: BL }}>
                            {s.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-2" style={{ fontFamily: BL }}>
                    No similar destinations found.
                  </p>
                )}
              </div>

              {/* Dialog actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={() => { setDeleteTarget(null); setSuggestions([]); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                  style={{ fontFamily: BL }}>
                  Keep it
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition flex items-center justify-center gap-1.5"
                  style={{ fontFamily: HL }}>
                  <Trash2 size={14} /> Yes, Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
