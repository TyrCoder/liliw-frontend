'use client';

import { useEffect, useState, useCallback, useRef, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Layers, PenLine, Lock, X, Eye, EyeOff, Camera, Trash2, Upload } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import { logger } from '@/lib/logger';
import { COLORS } from '@/lib/constants';
import ImmersiveViewer from '@/components/ImmersiveViewer';
import type { Hotspot } from '@/lib/types';

const EDITOR_PASSWORD = 'LiliwOffice2026';
const CLOUDINARY_FOLDER = 'liliw-virtual-tours';

interface VirtualTourPhoto {
  url: string;
  name: string;
  public_id: string;
}

interface Attraction {
  id: string;
  strapiId?: number | string;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    has_virtual_tour?: boolean;
    hotspots?: Hotspot[];
    photos?: Array<{ id: number; url: string; name: string }>;
    virtual_tour_photos?: VirtualTourPhoto[];
  };
  type: 'heritage' | 'spot' | 'dining';
}

export default function ImmersivePage() {
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [virtualTourPhotos, setVirtualTourPhotos] = useState<VirtualTourPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const virtualTourPhotosRef = useRef<VirtualTourPhoto[]>([]);
  useEffect(() => { virtualTourPhotosRef.current = virtualTourPhotos; }, [virtualTourPhotos]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllAttractions();
        const virtualTourAttractions = data.filter((attraction) => attraction.attributes.has_virtual_tour === true);
        setAttractions(virtualTourAttractions);
        if (virtualTourAttractions.length > 0) {
          setSelectedAttractionId(virtualTourAttractions[0].id);
        }
      } catch (error) {
        logger.error('Error fetching attractions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedAttraction = attractions.find((a) => a.id === selectedAttractionId);

  // Sync virtualTourPhotos from Strapi data whenever attraction changes
  useEffect(() => {
    setVirtualTourPhotos(selectedAttraction?.attributes.virtual_tour_photos ?? []);
  }, [selectedAttractionId, selectedAttraction]);

  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } else {
      setPassword('');
      setPasswordError('');
      setShowPassword(false);
    }
  }, [showPasswordModal]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === EDITOR_PASSWORD) {
      setEditMode(true);
      setShowPasswordModal(false);
    } else {
      setPasswordError('Incorrect password.');
      setPassword('');
    }
  };

  // Upload one file directly to Cloudinary (browser → Cloudinary, zero Strapi memory)
  const uploadOneFile = async (file: File): Promise<VirtualTourPhoto> => {
    const timestamp = Math.round(Date.now() / 1000);

    const signRes = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, folder: CLOUDINARY_FOLDER }),
    });
    if (!signRes.ok) throw new Error('Failed to get upload signature');
    const { signature, api_key, cloud_name } = await signRes.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', CLOUDINARY_FOLDER);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err?.error?.message || 'Cloudinary upload failed');
    }
    const result = await uploadRes.json();

    return {
      url: result.secure_url,
      name: file.name.replace(/\.[^.]+$/, ''),
      public_id: result.public_id,
    };
  };

  const savePhotosToStrapi = async (photos: VirtualTourPhoto[]) => {
    if (!selectedAttraction?.strapiId) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/save-virtual-tour-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionType: selectedAttraction.type,
          strapiId: selectedAttraction.strapiId,
          photos,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    const newPhotos: VirtualTourPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      setUploadStatus(`${i + 1} / ${files.length}`);
      try {
        const photo = await uploadOneFile(files[i]);
        newPhotos.push(photo);
      } catch (err) {
        logger.error(`Upload failed for ${files[i].name}`, err);
      }
    }

    setUploading(false);
    setUploadStatus('');

    if (newPhotos.length > 0) {
      const updated = [...virtualTourPhotos, ...newPhotos];
      setVirtualTourPhotos(updated);
      await savePhotosToStrapi(updated);
    }
  };

  const deletePhoto = async (index: number) => {
    const updated = virtualTourPhotos.filter((_, i) => i !== index);
    setVirtualTourPhotos(updated);
    await savePhotosToStrapi(updated);
  };

  const cloudinaryTransform = (url: string, transforms: string) => {
    if (!url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/${transforms}/`);
  };

  // Called from HotspotDialog when admin uploads a new 360° scene inline
  const handleUploadScene = async (file: File) => {
    const photo = await uploadOneFile(file);
    const idx = virtualTourPhotosRef.current.length;
    const scene = {
      id: photo.public_id,
      title: photo.name || `Scene ${idx + 1}`,
      imageUrl: cloudinaryTransform(photo.url, 'w_4096,q_auto,f_auto'),
      thumbUrl: cloudinaryTransform(photo.url, 'w_256,q_20,e_blur:400,f_auto'),
    };
    return { scene, photo };
  };

  // Called when a hotspot confirms with a new scene — stage the photo; saved on next Save click
  const handleNewScene = (photo: VirtualTourPhoto, _idx: number) => {
    setVirtualTourPhotos((prev) => [...prev, photo]);
  };

  // Scenes for the viewer — thumb loads instantly (<100ms), full-res swaps in silently
  const scenes = virtualTourPhotos.map((photo, idx) => ({
    id: photo.public_id || String(idx),
    title: photo.name || `Scene ${idx + 1}`,
    imageUrl: cloudinaryTransform(photo.url, 'w_4096,q_auto,f_auto'),
    thumbUrl: cloudinaryTransform(photo.url, 'w_256,q_20,e_blur:400,f_auto'),
  }));

  const saveHotspots = useCallback(async (hotspots: Hotspot[]) => {
    if (!selectedAttraction?.strapiId) {
      throw new Error(`No strapiId for attraction "${selectedAttraction?.attributes?.name}"`);
    }
    logger.info(`Saving ${hotspots.length} hotspots + ${virtualTourPhotosRef.current.length} photos for ${selectedAttraction.type}/${selectedAttraction.strapiId}`);

    const [hRes, pRes] = await Promise.all([
      fetch('/api/save-hotspots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionType: selectedAttraction.type,
          strapiId: selectedAttraction.strapiId,
          hotspots,
        }),
      }),
      fetch('/api/save-virtual-tour-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionType: selectedAttraction.type,
          strapiId: selectedAttraction.strapiId,
          photos: virtualTourPhotosRef.current,
        }),
      }),
    ]);

    if (!hRes.ok) {
      const text = await hRes.text();
      throw new Error(`Hotspots save failed (${hRes.status}): ${text}`);
    }
    if (!pRes.ok) {
      const text = await pRes.text();
      throw new Error(`Photos save failed (${pRes.status}): ${text}`);
    }
  }, [selectedAttraction]);

  return (
    <div style={{ backgroundColor: '#0F1F3C', minHeight: 'calc(100vh - 65px)' }}>
      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm mx-4 border-2"
              style={{ borderColor: '#FFB400' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" style={{ color: '#FFB400' }} />
                  <h2 className="text-white font-bold text-lg">Editor Access</h2>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Enter password"
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 border border-gray-700 focus:outline-none focus:border-yellow-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold transition"
                  style={{ backgroundColor: '#FFB400', color: '#0F1F3C' }}
                >
                  Enter Editor
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b-2 backdrop-blur-sm"
        style={{
          borderBottomColor: COLORS.primary,
          backgroundColor: 'rgba(15, 31, 60, 0.95)',
          boxShadow: `0 4px 12px ${COLORS.primary}1a`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div whileHover={{ x: -2 }} whileTap={{ x: -4 }}>
            <Link href="/attractions" className="inline-flex items-center gap-2 text-white hover:opacity-100 opacity-80 font-semibold transition px-3 py-2 rounded-lg hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </motion.div>

          <motion.h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2" whileHover={{ scale: 1.02 }}>
            <Layers className="w-6 h-6" style={{ color: COLORS.primary }} />
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent hidden sm:inline">3D Tours</span>
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent sm:hidden">3D</span>
            {editMode && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: '#FFB400', color: '#0F1F3C' }}>
                <PenLine className="w-3 h-3" /> Editor
              </span>
            )}
          </motion.h1>

          {/* Hidden admin lock */}
          <div className="w-12 sm:w-16 flex justify-end">
            {editMode ? (
              <button
                onClick={() => setEditMode(false)}
                title="Exit editor"
                className="text-yellow-400 hover:text-yellow-300 transition p-2 rounded-lg hover:bg-white/10"
              >
                <Lock className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowPasswordModal(true)}
                title=""
                className="transition p-2 rounded-lg hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.12)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.12)')}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="px-3 sm:px-5 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderColor: '#00BFB3' }} />
            <p className="text-white mt-4">Loading immersive experiences...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Viewer */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              {selectedAttraction && scenes.length > 0 ? (
                <ImmersiveViewer
                  key={selectedAttractionId}
                  title={selectedAttraction.attributes.name}
                  scenes={scenes}
                  description={selectedAttraction.attributes.description}
                  editMode={editMode}
                  initialHotspots={selectedAttraction.attributes.hotspots ?? []}
                  onSaveHotspots={saveHotspots}
                  onUploadScene={handleUploadScene}
                  onNewScene={handleNewScene}
                />
              ) : selectedAttraction && scenes.length === 0 && editMode ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-24 text-center"
                  style={{ borderColor: '#FFB400', backgroundColor: 'rgba(255,180,0,0.05)' }}>
                  <Camera className="w-16 h-16 mb-4" style={{ color: '#FFB400' }} />
                  <p className="text-white font-bold text-lg mb-2">No 360° photos yet</p>
                  <p className="text-gray-400 text-sm">Upload photos using the panel on the right</p>
                </div>
              ) : null}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 space-y-4"
            >
              {/* Attraction List */}
              <div className="sticky top-24 space-y-4">
                <div className="bg-gray-900 rounded-xl p-4 border-2" style={{ borderColor: '#E0F7F5' }}>
                  <h2 className="text-white font-bold mb-4">Available Tours</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attractions.map((attraction, index) => (
                      <motion.button
                        key={attraction.id}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedAttractionId(attraction.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedAttractionId === attraction.id ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: selectedAttractionId === attraction.id ? 'rgba(0, 191, 179, 0.3)' : 'transparent',
                          borderLeft: selectedAttractionId === attraction.id ? '3px solid #00BFB3' : 'none',
                          paddingLeft: '12px',
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

                {/* 360° Photo Manager — edit mode only */}
                <AnimatePresence>
                  {editMode && selectedAttraction && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-gray-900 rounded-xl p-4 border-2"
                      style={{ borderColor: '#FFB400' }}
                    >
                      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4" style={{ color: '#FFB400' }} />
                        360° Photos
                        {saveStatus === 'saving' && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
                        {saveStatus === 'saved' && <span className="text-xs text-green-400 ml-auto">Saved ✓</span>}
                        {saveStatus === 'error' && <span className="text-xs text-red-400 ml-auto">Save failed</span>}
                      </h2>

                      {/* Current photos */}
                      {virtualTourPhotos.length > 0 ? (
                        <div className="space-y-2 mb-3 max-h-44 overflow-y-auto">
                          {virtualTourPhotos.map((photo, idx) => (
                            <div key={photo.public_id || idx} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                              <img
                                src={photo.url}
                                alt={photo.name}
                                className="w-12 h-7 object-cover rounded flex-shrink-0"
                              />
                              <span className="text-gray-300 text-xs flex-1 truncate">{photo.name}</span>
                              <button
                                onClick={() => deletePhoto(idx)}
                                className="text-red-400 hover:text-red-300 flex-shrink-0 transition"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs mb-3">No photos yet. Upload 360° panoramic images below.</p>
                      )}

                      {/* Upload button */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                        style={{ backgroundColor: '#FFB400', color: '#0F1F3C' }}
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? `Uploading ${uploadStatus}` : 'Upload Photos'}
                      </button>

                      {/* Progress bar */}
                      {uploading && (
                        <div className="mt-2 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full animate-pulse" style={{ width: '100%', backgroundColor: '#00BFB3' }} />
                        </div>
                      )}

                      <p className="text-gray-600 text-xs mt-2">
                        JPG recommended. Files upload directly to Cloudinary — no server memory used.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* How It Works card — hidden in edit mode to save space */}
                {!editMode && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="rounded-xl p-4 border-2"
                    style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)', borderColor: '#00BFB3' }}
                  >
                    <h3 className="text-white font-semibold mb-2">💡 How It Works</h3>
                    <ul className="text-gray-300 text-sm space-y-2">
                      <li>✓ Drag to look around</li>
                      <li>✓ Mobile: Touch & move</li>
                      <li>✓ VR Mode: With headset</li>
                      <li>✓ Screenshot: Save views</li>
                    </ul>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
