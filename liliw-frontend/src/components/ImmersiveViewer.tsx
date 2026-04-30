'use client';

import { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Headphones, Camera,
  Maximize2, Minimize2, ScanLine, MapPin,
} from 'lucide-react';
import { logger } from '@/lib/logger';

const xrStore = createXRStore();

export interface Scene {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
}

interface ImmersiveViewerProps {
  title: string;
  scenes: Scene[];
  description?: string;
}

// ─── Three.js sub-components ───────────────────────────────────────────────

function PanoramaSphere({ url }: { url: string }) {
  const texture = useTexture(url);
  useEffect(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function SceneHotspot({
  position, label, icon, onClick,
}: {
  position: [number, number, number];
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <group position={position}>
      <Html center distanceFactor={250} zIndexRange={[1, 10]}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex flex-col items-center gap-1 group cursor-pointer select-none"
          style={{ pointerEvents: 'all' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white/40 transition-transform group-hover:scale-110"
            style={{ backgroundColor: 'rgba(0,191,179,0.85)', backdropFilter: 'blur(4px)' }}
          >
            {icon}
          </div>
          <span
            className="text-white text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            {label}
          </span>
        </button>
      </Html>
    </group>
  );
}

function DragControls({ autoRotate }: { autoRotate: boolean }) {
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const lastInteract = useRef(Date.now());

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const el = gl.domElement;

    const touch = (active: boolean) => { dragging.current = active; if (active) lastInteract.current = Date.now(); };
    const onDown = (e: MouseEvent) => { touch(true); prev.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => touch(false);
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      lastInteract.current = Date.now();
      target.current.x -= (e.clientX - prev.current.x) * 0.005;
      target.current.y -= (e.clientY - prev.current.y) * 0.005;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchStart = (e: TouchEvent) => {
      touch(true);
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
    if (autoRotate && !dragging.current && Date.now() - lastInteract.current > 3000) {
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

// ─── Main Component ────────────────────────────────────────────────────────

export default function ImmersiveViewer({ title, scenes, description }: ImmersiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const current = scenes[sceneIndex];
  const hasMultiple = scenes.length > 1;

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

  const goToScene = useCallback((idx: number) => {
    if (idx === sceneIndex || fading) return;
    setFading(true);
    setTimeout(() => {
      setSceneIndex(idx);
      setIsLoading(true);
      setFading(false);
    }, 400);
  }, [sceneIndex, fading]);

  const prevScene = () => goToScene((sceneIndex - 1 + scenes.length) % scenes.length);
  const nextScene = () => goToScene((sceneIndex + 1) % scenes.length);

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

  const onLoaded = useCallback(() => setIsLoading(false), []);

  if (!scenes.length) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-black border-2 select-none"
      style={{ borderColor: '#00BFB3' }}
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-3" style={{ borderColor: '#00BFB3' }} />
                <p className="text-white text-sm">Loading scene...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fade transition overlay */}
        <AnimatePresence>
          {fading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-black z-15 pointer-events-none"
              style={{ zIndex: 15 }}
            />
          )}
        </AnimatePresence>

        {/* R3F Canvas */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ fov: 75, position: [0, 0, 0.01] }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            style={{ cursor: 'grab' }}
          >
            <XR store={xrStore}>
              <Suspense fallback={null}>
                <PanoramaSphere key={current.imageUrl} url={current.imageUrl} />
                {/* 3D Hotspot arrows */}
                {hasMultiple && (
                  <>
                    <SceneHotspot
                      position={[-300, -40, -380]}
                      label={scenes[(sceneIndex - 1 + scenes.length) % scenes.length].title}
                      icon={<ChevronLeft className="w-6 h-6 text-white" />}
                      onClick={prevScene}
                    />
                    <SceneHotspot
                      position={[300, -40, -380]}
                      label={scenes[(sceneIndex + 1) % scenes.length].title}
                      icon={<ChevronRight className="w-6 h-6 text-white" />}
                      onClick={nextScene}
                    />
                  </>
                )}
              </Suspense>
              <DragControls autoRotate={autoRotate} />
              <ScreenshotHelper glRef={glRef} />
            </XR>
          </Canvas>
        </div>

        {/* ── UI Overlay ── */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20">

          {/* Top bar: scene title + controls */}
          <div className="flex items-start justify-between p-3 gap-2">
            <div
              className="pointer-events-auto px-3 py-2 rounded-lg max-w-xs"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#00BFB3' }} />
                <span className="text-white font-bold text-sm leading-tight">{current.title}</span>
              </div>
              {current.description && (
                <p className="text-gray-300 text-xs mt-1 leading-tight line-clamp-2">{current.description}</p>
              )}
            </div>

            {/* Top-right controls */}
            <div className="pointer-events-auto flex gap-2">
              <button
                onClick={() => setAutoRotate((v) => !v)}
                title={autoRotate ? 'Stop auto-rotate' : 'Auto-rotate'}
                className="p-2 rounded-lg text-white transition text-xs font-semibold"
                style={{ background: autoRotate ? 'rgba(0,191,179,0.7)' : 'rgba(0,0,0,0.6)' }}
              >
                ↻
              </button>
              <button onClick={takeScreenshot} title="Screenshot"
                className="p-2 rounded-lg bg-black/60 text-white transition hover:bg-black/80">
                <Camera className="w-4 h-4" />
              </button>
              <button onClick={toggleFullscreen} title="Fullscreen"
                className="p-2 rounded-lg bg-black/60 text-white transition hover:bg-black/80">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {vrSupported && (
                <button
                  onClick={() => xrStore.enterVR()}
                  className="p-2 rounded-lg flex items-center gap-1 text-xs font-semibold transition"
                  style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
                >
                  <Headphones className="w-4 h-4" />
                  <span className="hidden sm:inline">VR</span>
                </button>
              )}
              {arSupported && (
                <button
                  onClick={() => xrStore.enterAR()}
                  className="p-2 rounded-lg bg-black/60 text-white flex items-center gap-1 text-xs font-semibold transition hover:bg-black/80"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="hidden sm:inline">AR</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom: left/right nav + thumbnail strip */}
          {hasMultiple && (
            <div className="flex flex-col gap-2 pb-3 px-3">
              {/* Scene counter */}
              <div className="self-center text-white text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                {sceneIndex + 1} / {scenes.length}
              </div>

              {/* Thumbnail strip */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button onClick={prevScene}
                  className="flex-shrink-0 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2 overflow-x-auto flex-1 py-1 scrollbar-none">
                  {scenes.map((scene, idx) => (
                    <button
                      key={scene.id}
                      onClick={() => goToScene(idx)}
                      className="flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all"
                      style={{
                        width: 72, height: 48,
                        borderColor: idx === sceneIndex ? '#00BFB3' : 'rgba(255,255,255,0.2)',
                        opacity: idx === sceneIndex ? 1 : 0.6,
                        transform: idx === sceneIndex ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="w-full h-full object-cover"
                      />
                      {idx === sceneIndex && (
                        <div className="absolute inset-0 border-2 rounded-lg"
                          style={{ borderColor: '#00BFB3' }} />
                      )}
                    </button>
                  ))}
                </div>

                <button onClick={nextScene}
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
