'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Headphones, Camera,
  Maximize2, Minimize2, ScanLine, MapPin, X,
  Info, Navigation, Save, PenLine, Check, Trash2, Upload,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { Hotspot } from '@/lib/types';

const xrStore = createXRStore();

export interface Scene {
  id: string;
  title: string;
  imageUrl: string;
  thumbUrl?: string;
  description?: string;
}

// Returned when a new 360° scene is uploaded via the hotspot dialog
interface NewSceneResult {
  scene: Scene;
  photo: { url: string; name: string; public_id: string };
}

interface ImmersiveViewerProps {
  title: string;
  scenes: Scene[];
  description?: string;
  editMode?: boolean;
  initialHotspots?: Hotspot[];
  onSaveHotspots?: (hotspots: Hotspot[]) => Promise<void>;
  // Upload a new 360° directly from the hotspot dialog
  onUploadScene?: (file: File) => Promise<NewSceneResult>;
  // Called when a hotspot creates a new scene — parent adds it to its photo list
  onNewScene?: (photo: { url: string; name: string; public_id: string }, sceneIndex: number) => void;
}

// ─── Pitch/Yaw helpers ────────────────────────────────────────────────────

function pointToAngles(point: THREE.Vector3): { pitch: number; yaw: number } {
  const r = point.length();
  const pitch = Math.asin(point.y / r) * (180 / Math.PI);
  const yaw = Math.atan2(point.x, -point.z) * (180 / Math.PI);
  return { pitch, yaw };
}

function anglesToPosition(pitch: number, yaw: number, r = 490): [number, number, number] {
  const p = pitch * (Math.PI / 180);
  const y = yaw * (Math.PI / 180);
  return [
    r * Math.cos(p) * Math.sin(y),
    r * Math.sin(p),
    -r * Math.cos(p) * Math.cos(y),
  ];
}

// ─── Three.js sub-components ──────────────────────────────────────────────

// Loads a blurry thumb instantly, then swaps to full-res silently.
// Calls onReady() as soon as the thumb is visible so the loading spinner disappears fast.
function PanoramaSphere({
  url, thumbUrl, editMode, onPlace, onReady,
}: {
  url: string;
  thumbUrl?: string;
  editMode: boolean;
  onPlace?: (pitch: number, yaw: number) => void;
  onReady?: () => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    const loader = new THREE.TextureLoader();

    const apply = (tex: THREE.Texture) => {
      if (disposed.current) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture((prev) => { prev?.dispose(); return tex; });
    };

    const loadFull = () => loader.load(url, apply);

    if (thumbUrl) {
      loader.load(
        thumbUrl,
        (tex) => { apply(tex); onReady?.(); loadFull(); },
        undefined,
        () => { onReady?.(); loadFull(); }, // thumb failed — skip straight to full
      );
    } else {
      loader.load(url, (tex) => { apply(tex); onReady?.(); });
    }

    return () => { disposed.current = true; };
  }, [url, thumbUrl, onReady]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!editMode || !onPlace) return;
    e.stopPropagation();
    const { pitch, yaw } = pointToAngles(e.point);
    onPlace(pitch, yaw);
  };

  if (!texture) return null;

  return (
    <mesh onClick={handleClick}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function HotspotMarker({
  hotspot, scenes, editMode, onDelete, onClick,
}: {
  hotspot: Hotspot;
  scenes: Scene[];
  editMode: boolean;
  onDelete?: (id: string) => void;
  onClick?: (h: Hotspot) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pos = anglesToPosition(hotspot.pitch, hotspot.yaw);
  const isNav = hotspot.type === 'navigate';
  const targetTitle = isNav && hotspot.targetSceneIndex !== undefined
    ? scenes[hotspot.targetSceneIndex]?.title
    : undefined;
  const displayLabel = targetTitle || hotspot.label;

  return (
    <group position={pos}>
      <Html center distanceFactor={250} zIndexRange={[1, 50]}>
        <div
          className="flex flex-col items-center gap-2 select-none"
          style={{ pointerEvents: 'all' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(hotspot); }}
            className="relative flex items-center justify-center"
            style={{ width: 48, height: 48, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {/* Pulsing ring */}
            <span
              className="absolute inset-0 rounded-full border-2 border-white animate-ping"
              style={{ opacity: 0.4 }}
            />
            {/* Main circle */}
            <span
              className="absolute inset-0 rounded-full border-2 border-white transition-all duration-200"
              style={{
                backgroundColor: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                boxShadow: hovered ? '0 0 0 5px rgba(255,255,255,0.15)' : 'none',
                transform: hovered ? 'scale(1.14)' : 'scale(1)',
              }}
            />
            {/* Center dot */}
            <span className="relative w-2 h-2 rounded-full bg-white" style={{ opacity: 0.75 }} />
          </button>

          {/* Label — appears on hover or always in edit mode */}
          {(hovered || editMode) && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
              style={{
                backgroundColor: 'white',
                color: '#0F1F3C',
                boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
              }}
            >
              {displayLabel}
            </span>
          )}

          {/* Delete button (edit mode only) */}
          {editMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(hotspot.id); }}
              className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </Html>
    </group>
  );
}

function DragControls({ editMode, autoRotate }: { editMode: boolean; autoRotate: boolean }) {
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const lastInteract = useRef(Date.now());

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const el = gl.domElement;

    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      lastInteract.current = Date.now();
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { dragging.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      lastInteract.current = Date.now();
      target.current.x -= (e.clientX - prev.current.x) * 0.005;
      target.current.y -= (e.clientY - prev.current.y) * 0.005;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchStart = (e: TouchEvent) => {
      dragging.current = true;
      if (e.touches[0]) prev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !e.touches[0]) return;
      lastInteract.current = Date.now();
      target.current.x -= (e.touches[0].clientX - prev.current.x) * 0.005;
      target.current.y -= (e.touches[0].clientY - prev.current.y) * 0.005;
      prev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onUp);
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onUp);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    smooth.current.x += (target.current.x - smooth.current.x) * 0.05;
    smooth.current.y += (target.current.y - smooth.current.y) * 0.05;
    camera.rotation.y = smooth.current.x;
    camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, smooth.current.y));
    if (autoRotate && !editMode && !dragging.current && Date.now() - lastInteract.current > 3000) {
      target.current.x -= delta * 0.08;
    }
  });

  return null;
}

function ScreenshotHelper({ glRef }: { glRef: React.MutableRefObject<THREE.WebGLRenderer | null> }) {
  const { gl } = useThree();
  useEffect(() => { glRef.current = gl; }, [gl, glRef]);
  return null;
}

// ─── Hotspot Dialog ───────────────────────────────────────────────────────

interface PendingHotspot { pitch: number; yaw: number }

function HotspotDialog({
  pending, scenes, onConfirm, onCancel, onUploadScene,
}: {
  pending: PendingHotspot;
  scenes: Scene[];
  onConfirm: (h: Omit<Hotspot, 'id'>, newScene?: NewSceneResult) => void;
  onCancel: () => void;
  onUploadScene?: (file: File) => Promise<NewSceneResult>;
}) {
  const [type, setType] = useState<'navigate' | 'info'>('navigate');
  const [label, setLabel] = useState('');
  const [targetScene, setTargetScene] = useState(0);
  const [info, setInfo] = useState('');
  const [newScene, setNewScene] = useState<NewSceneResult | null>(null);
  const [uploadingScene, setUploadingScene] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSceneFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadScene) return;
    setUploadingScene(true);
    try {
      const result = await onUploadScene(file);
      setNewScene(result);
    } catch {
      // upload failed silently
    } finally {
      setUploadingScene(false);
    }
  };

  const confirm = () => {
    if (!label.trim()) return;
    // If a new scene was uploaded, it will be appended at scenes.length
    const targetIndex = type === 'navigate'
      ? (newScene ? scenes.length : targetScene)
      : undefined;
    onConfirm({
      pitch: pending.pitch,
      yaw: pending.yaw,
      type,
      label: label.trim(),
      targetSceneIndex: targetIndex,
      info: type === 'info' ? info.trim() : undefined,
    }, newScene ?? undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div className="bg-gray-900 rounded-xl p-5 w-80 border border-teal-500 shadow-2xl max-h-screen overflow-y-auto">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <PenLine className="w-4 h-4" style={{ color: '#00BFB3' }} />
          Place Hotspot
        </h3>

        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('navigate')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
            style={{
              backgroundColor: type === 'navigate' ? '#00BFB3' : 'rgba(255,255,255,0.1)',
              color: type === 'navigate' ? '#0F1F3C' : 'white',
            }}
          >
            <Navigation className="w-4 h-4 inline mr-1" /> Navigate
          </button>
          <button
            onClick={() => setType('info')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
            style={{
              backgroundColor: type === 'info' ? '#FFB400' : 'rgba(255,255,255,0.1)',
              color: type === 'info' ? '#0F1F3C' : 'white',
            }}
          >
            <Info className="w-4 h-4 inline mr-1" /> Info
          </button>
        </div>

        {/* Label */}
        <label className="block text-gray-300 text-xs mb-1">Label *</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Go to entrance"
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-3 border border-gray-600 focus:border-teal-400 outline-none"
        />

        {/* Navigate: link to existing scene OR upload new one */}
        {type === 'navigate' && (
          <div className="space-y-3 mb-3">
            {/* Existing scenes */}
            {scenes.length > 0 && !newScene && (
              <>
                <label className="block text-gray-300 text-xs mb-1">Link to existing scene</label>
                <select
                  value={targetScene}
                  onChange={(e) => setTargetScene(Number(e.target.value))}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 outline-none"
                >
                  {scenes.map((s, i) => (
                    <option key={s.id} value={i}>{i + 1}. {s.title}</option>
                  ))}
                </select>
                <div className="text-gray-500 text-xs text-center">— or —</div>
              </>
            )}

            {/* Upload new 360° scene */}
            {onUploadScene && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSceneFile} />
                {newScene ? (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                    <img src={newScene.scene.thumbUrl || newScene.scene.imageUrl} className="w-10 h-6 object-cover rounded" alt="" />
                    <span className="text-green-400 text-xs flex-1 truncate">✓ {newScene.scene.title}</span>
                    <button onClick={() => setNewScene(null)} className="text-gray-500 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingScene}
                    className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border border-dashed border-gray-600 text-gray-400 hover:border-teal-400 hover:text-teal-400 transition disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingScene ? 'Uploading…' : 'Upload new 360° scene'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Info: text area */}
        {type === 'info' && (
          <>
            <label className="block text-gray-300 text-xs mb-1">Info text</label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="Describe this location..."
              rows={3}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-3 border border-gray-600 focus:border-yellow-400 outline-none resize-none"
            />
          </>
        )}

        <div className="text-gray-500 text-xs mb-4">
          Pitch: {pending.pitch.toFixed(1)}° · Yaw: {pending.yaw.toFixed(1)}°
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!label.trim() || uploadingScene}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40"
            style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
          >
            <Check className="w-4 h-4 inline mr-1" /> Place
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Info popup (viewer mode) ─────────────────────────────────────────────

function InfoPopup({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 w-72 bg-gray-900/95 border border-yellow-400 rounded-xl p-4 shadow-xl"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
          <Info className="w-4 h-4" /> {hotspot.label}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{hotspot.info}</p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ImmersiveViewer({
  title, scenes, description,
  editMode = false, initialHotspots = [], onSaveHotspots,
  onUploadScene, onNewScene,
}: ImmersiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [autoRotate, setAutoRotate] = useState(!editMode);
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots);
  const [pending, setPending] = useState<PendingHotspot | null>(null);
  const [activeInfo, setActiveInfo] = useState<Hotspot | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const current = scenes[sceneIndex];
  const hasMultiple = scenes.length > 1;
  // Only show hotspots that belong to the currently viewed scene
  const sceneHotspots = hotspots.filter((h) => (h.sceneIndex ?? 0) === sceneIndex);

  useEffect(() => {
    if (!navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-vr').then(setVrSupported).catch(() => {});
    navigator.xr.isSessionSupported('immersive-ar').then(setArSupported).catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    setHotspots(initialHotspots);
  }, [initialHotspots]);

  const goToScene = useCallback((idx: number) => {
    if (idx === sceneIndex || fading) return;
    setFading(true);
    setActiveInfo(null);
    setTimeout(() => {
      setSceneIndex(idx);
      setIsLoading(true);
      setFading(false);
    }, 400);
  }, [sceneIndex, fading]);

  const onPlace = useCallback((pitch: number, yaw: number) => {
    if (!editMode || pending) return;
    setPending({ pitch, yaw });
  }, [editMode, pending]);

  const confirmHotspot = (h: Omit<Hotspot, 'id'>, newScene?: NewSceneResult) => {
    if (newScene) onNewScene?.(newScene.photo, scenes.length);
    setHotspots((prev) => [...prev, { ...h, id: crypto.randomUUID(), sceneIndex }]);
    setPending(null);
    setSaved(false);
  };

  const deleteHotspot = (id: string) => {
    setHotspots((prev) => prev.filter((h) => h.id !== id));
    setSaved(false);
  };

  const handleHotspotClick = (h: Hotspot) => {
    if (editMode) return;
    if (h.type === 'navigate' && h.targetSceneIndex !== undefined) {
      goToScene(h.targetSceneIndex);
    } else if (h.type === 'info') {
      setActiveInfo((prev) => prev?.id === h.id ? null : h);
    }
  };

  const handleSave = async () => {
    if (!onSaveHotspots) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSaveHotspots(hotspots);
      setSaved(true);
    } catch (e: any) {
      const msg = e?.message || 'Save failed';
      logger.error('Save failed:', e);
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) await containerRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { logger.error('Fullscreen:', e); }
  };

  const takeScreenshot = () => {
    if (!glRef.current) return;
    const link = document.createElement('a');
    link.href = glRef.current.domElement.toDataURL('image/png');
    link.download = `${title}-${current.title}.png`;
    link.click();
  };

  const onReady = useCallback(() => setIsLoading(false), []);

  // Preload adjacent scenes so navigation feels instant
  useEffect(() => {
    const targets = [
      scenes[(sceneIndex + 1) % scenes.length],
      scenes[(sceneIndex - 1 + scenes.length) % scenes.length],
    ];
    targets.forEach((s) => {
      if (s && s.imageUrl !== current?.imageUrl) {
        const img = new window.Image();
        img.src = s.imageUrl;
      }
    });
  }, [sceneIndex, scenes, current]);

  if (!scenes.length) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-black border-2 select-none"
      style={{ borderColor: editMode ? '#FFB400' : '#00BFB3' }}
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-3"
                  style={{ borderColor: '#00BFB3' }} />
                <p className="text-white text-sm">Loading scene...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fade transition */}
        <AnimatePresence>
          {fading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ zIndex: 15 }} />
          )}
        </AnimatePresence>

        {/* Hotspot dialog */}
        <AnimatePresence>
          {pending && (
            <HotspotDialog
              pending={pending}
              scenes={scenes}
              onConfirm={confirmHotspot}
              onCancel={() => setPending(null)}
              onUploadScene={onUploadScene}
            />
          )}
        </AnimatePresence>

        {/* Info popup */}
        <AnimatePresence>
          {activeInfo && (
            <InfoPopup hotspot={activeInfo} onClose={() => setActiveInfo(null)} />
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ fov: 75, position: [0, 0, 0.01] }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            style={{ cursor: editMode ? 'crosshair' : 'grab' }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
            }}
          >
            <XR store={xrStore}>
              <PanoramaSphere
                key={current.imageUrl}
                url={current.imageUrl}
                thumbUrl={current.thumbUrl}
                editMode={editMode && !pending}
                onPlace={onPlace}
                onReady={onReady}
              />
              {sceneHotspots.map((h) => (
                <HotspotMarker
                  key={h.id}
                  hotspot={h}
                  scenes={scenes}
                  editMode={editMode}
                  onDelete={deleteHotspot}
                  onClick={handleHotspotClick}
                />
              ))}
              <DragControls editMode={editMode} autoRotate={autoRotate} />
              <ScreenshotHelper glRef={glRef} />
            </XR>
          </Canvas>
        </div>

        {/* ── UI Overlay ── */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20">

          {/* Top bar */}
          <div className="flex items-start justify-between p-3 gap-2">
            <div className="pointer-events-auto px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
              {editMode && (
                <div className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: '#FFB400' }}>
                  <PenLine className="w-3 h-3" /> EDITOR MODE — Click to place hotspot
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: editMode ? '#FFB400' : '#00BFB3' }} />
                <span className="text-white font-bold text-sm">{current.title}</span>
              </div>
            </div>

            {/* Top-right buttons */}
            <div className="pointer-events-auto flex flex-wrap gap-2 justify-end">
              {editMode && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition disabled:opacity-60"
                    style={{
                      backgroundColor: saveError ? '#ef4444' : saved ? '#22c55e' : '#FFB400',
                      color: saveError ? 'white' : '#0F1F3C',
                    }}
                  >
                    {saving ? '...' : saveError ? '✕ Error' : saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                  {saveError && (
                    <span className="text-red-400 text-xs bg-black/70 px-2 py-0.5 rounded max-w-48 text-right leading-tight">
                      {saveError}
                    </span>
                  )}
                </div>
              )}
              {!editMode && (
                <button onClick={() => setAutoRotate((v) => !v)}
                  className="p-2 rounded-lg text-white text-xs font-bold transition"
                  style={{ background: autoRotate ? 'rgba(0,191,179,0.7)' : 'rgba(0,0,0,0.6)' }}>
                  ↻
                </button>
              )}
              <button onClick={takeScreenshot}
                className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition">
                <Camera className="w-4 h-4" />
              </button>
              <button onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {!editMode && vrSupported && (
                <button onClick={() => xrStore.enterVR()}
                  className="p-2 rounded-lg flex items-center gap-1 text-xs font-semibold transition"
                  style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}>
                  <Headphones className="w-4 h-4" />
                  <span className="hidden sm:inline">VR</span>
                </button>
              )}
              {!editMode && arSupported && (
                <button onClick={() => xrStore.enterAR()}
                  className="p-2 rounded-lg bg-black/60 text-white flex items-center gap-1 text-xs font-semibold hover:bg-black/80 transition">
                  <ScanLine className="w-4 h-4" />
                  <span className="hidden sm:inline">AR</span>
                </button>
              )}
            </div>
          </div>

          {/* Editor: hotspot list */}
          {editMode && sceneHotspots.length > 0 && (
            <div className="pointer-events-auto mx-3 mb-2 p-2 rounded-lg text-xs text-white"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="font-bold mb-1 text-yellow-400">
                {sceneHotspots.length} hotspot{sceneHotspots.length !== 1 ? 's' : ''} on this scene
              </div>
              <div className="flex flex-wrap gap-1">
                {sceneHotspots.map((h) => (
                  <span key={h.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: h.type === 'navigate' ? 'rgba(0,191,179,0.5)' : 'rgba(255,180,0,0.5)' }}>
                    {h.type === 'navigate' ? <Navigation className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                    {h.label}
                    <button onClick={() => deleteHotspot(h.id)} className="ml-1 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom: thumbnail strip */}
          {hasMultiple && (
            <div className="flex flex-col gap-2 pb-3 px-3">
              <div className="self-center text-white text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                {sceneIndex + 1} / {scenes.length}
              </div>
              <div className="pointer-events-auto flex items-center gap-2">
                <button onClick={() => goToScene((sceneIndex - 1 + scenes.length) % scenes.length)}
                  className="flex-shrink-0 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2 overflow-x-auto flex-1 py-1">
                  {scenes.map((scene, idx) => (
                    <button key={scene.id} onClick={() => goToScene(idx)}
                      className="flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all"
                      style={{
                        width: 72, height: 48,
                        borderColor: idx === sceneIndex ? (editMode ? '#FFB400' : '#00BFB3') : 'rgba(255,255,255,0.2)',
                        opacity: idx === sceneIndex ? 1 : 0.6,
                        transform: idx === sceneIndex ? 'scale(1.08)' : 'scale(1)',
                      }}>
                      <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <button onClick={() => goToScene((sceneIndex + 1) % scenes.length)}
                  className="flex-shrink-0 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
