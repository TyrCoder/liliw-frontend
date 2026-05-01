'use client';

import { useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, MapPin } from 'lucide-react';

interface Attraction {
  name: string;
  lat?: number;
  lng?: number;
  google_place_id?: string;
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

const LILIW_LAT = 14.3086;
const LILIW_LNG = 121.2286;
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function InteractiveMap({
  attractions = [],
  defaultLat = LILIW_LAT,
  defaultLng = LILIW_LNG,
  zoom = 15,
}: InteractiveMapProps) {
  const attraction = attractions[0];
  const lat = attraction?.lat ?? defaultLat;
  const lng = attraction?.lng ?? defaultLng;

  const getDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_blank'
    );
  };

  if (!TOKEN || TOKEN === 'pk.your_mapbox_token_here') {
    return (
      <div className="rounded-2xl overflow-hidden border-2 aspect-video flex items-center justify-center bg-gray-100"
        style={{ borderColor: '#00BFB3' }}>
        <div className="text-center text-gray-500 p-6">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-semibold">Map not configured</p>
          <p className="text-sm mt-1">Add your Mapbox token to .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="rounded-2xl overflow-hidden border-2 shadow-xl" style={{ borderColor: '#00BFB3', height: 360 }}>
        <Map
          mapboxAccessToken={TOKEN}
          initialViewState={{ longitude: lng, latitude: lat, zoom }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />
          {attraction && (
            <Marker longitude={lng} latitude={lat} anchor="bottom">
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#00BFB3' }}
                >
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="w-0.5 h-2 bg-white/60" />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {attraction && (
        <div className="flex gap-3">
          <button
            onClick={getDirections}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
            style={{ backgroundColor: '#00BFB3' }}
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Coordinates</p>
            <p className="text-sm font-mono text-gray-800">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
