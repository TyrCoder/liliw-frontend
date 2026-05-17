'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2, Upload, X, CheckCircle, AlertCircle, Loader2, FileText, MapPin, Navigation } from 'lucide-react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import AuthModal from '@/components/AuthModal';

const MAPBOX_TOKEN  = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const LILIW_LNG     = 121.43605859033404;
const LILIW_LAT     = 14.130301377593792;

// Bounding box for Liliw, Laguna — [west, south, east, north]
const LILIW_BOUNDS: [[number, number], [number, number]] = [
  [121.38, 14.08],  // SW
  [121.50, 14.18],  // NE
];

function withinLiliw(lat: number, lng: number): boolean {
  return (
    lat >= LILIW_BOUNDS[0][1] && lat <= LILIW_BOUNDS[1][1] &&
    lng >= LILIW_BOUNDS[0][0] && lng <= LILIW_BOUNDS[1][0]
  );
}

const CATEGORY_OPTIONS = [
  { value: 'heritage', label: 'Heritage Site' },
  { value: 'spot',     label: 'Tourist Spot' },
  { value: 'dining',   label: 'Dining & Food' },
  { value: 'other',    label: 'Other' },
];

export default function LBOApplyPage() {
  const [form, setForm]         = useState<Record<string, string>>({});
  const [files, setFiles]       = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus]     = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [markerPos,   setMarkerPos]   = useState<{ lat: number; lng: number } | null>(null);
  const [viewState,   setViewState]   = useState({ longitude: LILIW_LNG, latitude: LILIW_LAT, zoom: 14 });
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [boundsError, setBoundsError] = useState('');

  const set = (id: string, val: string) => setForm(f => ({ ...f, [id]: val }));

  const applyMarker = (lat: number, lng: number) => {
    if (!withinLiliw(lat, lng)) {
      setBoundsError('That location is outside Liliw, Laguna. Please pin a location within the municipality.');
      return;
    }
    setBoundsError('');
    setMarkerPos({ lat, lng });
    setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.lngLat;
    applyMarker(lat, lng);
  };

  const handleCoordChange = (field: 'latitude' | 'longitude', val: string) => {
    set(field, val);
    const lat = field === 'latitude'  ? parseFloat(val) : parseFloat(form.latitude  || '');
    const lng = field === 'longitude' ? parseFloat(val) : parseFloat(form.longitude || '');
    if (!isNaN(lat) && !isNaN(lng)) {
      if (!withinLiliw(lat, lng)) {
        setBoundsError('Those coordinates are outside Liliw, Laguna.');
        setMarkerPos(null);
        return;
      }
      setBoundsError('');
      setMarkerPos({ lat, lng });
      setViewState(v => ({ ...v, latitude: lat, longitude: lng }));
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoLoading(false);
        if (!withinLiliw(lat, lng)) {
          setBoundsError('Your current location is outside Liliw, Laguna. Please pin your attraction manually.');
          return;
        }
        setBoundsError('');
        applyMarker(lat, lng);
        setViewState({ latitude: lat, longitude: lng, zoom: 17 });
      },
      () => setGeoLoading(false),
    );
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter(f => !files.find(e => e.name === f.name));
    setFiles(prev => [...prev, ...next]);
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMsg("Please upload at least one supporting document (Mayor's Permit, DTI registration, or valid ID).");
      setStatus('error');
      return;
    }
    setSubmitting(true);
    setStatus('idle');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('documents', f));

    try {
      const res = await fetch('/api/lbo/apply', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Submission failed. Please try again.');
        setStatus('error');
        console.error('[Apply]', data);
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setStatus('error');
    }
    setSubmitting(false);
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#2E7D32' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2">Thank you for applying as a Local Business Owner on the Liliw Tourism website.</p>
          <p className="text-sm text-gray-400 mb-8">Our team will review your application and contact you at the email you provided. This usually takes 3–5 business days.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0' }}>
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--warm-white)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }} className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-sm font-semibold mb-6 opacity-80 hover:opacity-100 transition" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Liliw Tourism
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Local Business Owner Application</h1>
              <p className="text-blue-200 text-sm mt-1">Apply to manage your attraction listing on the Liliw Tourism website</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-0.5">What happens after you apply?</p>
            <p className="text-blue-600">Our CHATO team will review your application and verify your documents. Once approved, you'll receive an account to access your LBO dashboard where you can submit change requests and monthly visitor records.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Business Information ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-base">Business Information</h2>

          {/* Business Name */}
          <div>
            <label className={labelCls}>Business Name <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="e.g. Arabela Resort" value={form.business_name || ''}
              onChange={e => set('business_name', e.target.value)} className={inputCls} />
          </div>

          {/* Owner */}
          <div>
            <label className={labelCls}>Owner / Representative <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="Full name" value={form.owner_name || ''}
              onChange={e => set('owner_name', e.target.value)} className={inputCls} />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" required placeholder="your@email.com" value={form.email || ''}
              onChange={e => set('email', e.target.value)} className={inputCls} />
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Contact Number <span className="text-red-500">*</span></label>
            <input type="tel" required placeholder="+63 9XX XXX XXXX" value={form.phone || ''}
              onChange={e => set('phone', e.target.value)} className={inputCls} />
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>Business Address <span className="text-red-500">*</span></label>
            <textarea required placeholder="Complete address in Liliw, Laguna" value={form.address || ''}
              onChange={e => set('address', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>

          {/* Attraction Name */}
          <div>
            <label className={labelCls}>Attraction / Listing Name <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="Name as it appears on the site" value={form.attraction_name || ''}
              onChange={e => set('attraction_name', e.target.value)} className={inputCls} />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select required value={form.category || ''} onChange={e => set('category', e.target.value)}
              className={inputCls + ' bg-white'}>
              <option value="" disabled>Select a category…</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Business Type */}
          <div>
            <label className={labelCls}>Business Type <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="e.g. Restaurant, Resort, Craft Shop" value={form.business_type || ''}
              onChange={e => set('business_type', e.target.value)} className={inputCls} />
          </div>

          {/* Permit */}
          <div>
            <label className={labelCls}>Mayor's Permit / DTI No. <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="Business permit number" value={form.permit_number || ''}
              onChange={e => set('permit_number', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* ── Attraction Location ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Attraction Location</h2>
                <p className="text-xs text-gray-400 mt-0.5">Click on the map to pin your exact location</p>
              </div>
            </div>
            <button type="button" onClick={handleUseLocation} disabled={geoLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50 transition disabled:opacity-50">
              {geoLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Navigation className="w-3.5 h-3.5" />}
              Use my location
            </button>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
            <Map
              {...viewState}
              onMove={e => setViewState(e.viewState)}
              onClick={handleMapClick}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: '100%', height: '100%' }}
              cursor="crosshair"
              maxBounds={LILIW_BOUNDS}
              minZoom={12}>
              <NavigationControl position="top-right" />
              {markerPos && (
                <Marker
                  longitude={markerPos.lng}
                  latitude={markerPos.lat}
                  draggable
                  onDragEnd={e => applyMarker(e.lngLat.lat, e.lngLat.lng)}>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: '#1565C0' }}>
                      <MapPin className="w-4 h-4 text-white" fill="white" />
                    </div>
                    <div className="w-1 h-2 rounded-b-full" style={{ backgroundColor: '#1565C0' }} />
                  </div>
                </Marker>
              )}
            </Map>
          </div>

          {boundsError ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {boundsError}
            </div>
          ) : !markerPos && (
            <p className="text-xs text-center text-gray-400">👆 Click anywhere on the map above to place your pin</p>
          )}

          {/* Coordinate inputs — sync with map */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Latitude</label>
              <input type="number" step="any" placeholder="e.g. 14.1285" value={form.latitude || ''}
                onChange={e => handleCoordChange('latitude', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input type="number" step="any" placeholder="e.g. 121.4361" value={form.longitude || ''}
                onChange={e => handleCoordChange('longitude', e.target.value)} className={inputCls} />
            </div>
          </div>

          {markerPos && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100 text-xs text-teal-700">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Pinned at <strong>{markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}</strong> — drag the pin to adjust</span>
            </div>
          )}
        </div>

        {/* ── Supporting Documents ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-base mb-1">Supporting Documents <span className="text-red-500">*</span></h2>
          <p className="text-xs text-gray-400 mb-4">Upload your Mayor's Permit, DTI/SEC registration, or valid ID (PDF, JPG, PNG). At least one document is required.</p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 10MB each</p>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
              onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-500 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)', boxShadow: '0 4px 16px rgba(21,101,192,0.3)' }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Application'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">
          Already have an account?{' '}
          <button onClick={() => setShowAuth(true)} className="font-semibold underline" style={{ color: '#1565C0' }}>
            Log in here
          </button>
        </p>
      </form>
      {showAuth && <AuthModal defaultTab="login" onClose={() => setShowAuth(false)} />}
    </div>
  );
}
