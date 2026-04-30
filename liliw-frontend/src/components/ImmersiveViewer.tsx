'use client';

import { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Headphones, Camera, Maximize2, Minimize2, ScanLine } from 'lucide-react';
import { logger } from '@/lib/logger';

const xrStore = createXRStore();

interface ImmersiveViewerProps {
  title: string;
  imageUrl: string;
  description?: string;
}

function PanoramaSphere({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const texture = useTexture(url);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      onLoaded();
    }
  }, [texture, onLoaded]);

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function DragControls() {
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const el = gl.domElement;

    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { dragging.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
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

  useFrame(() => {
    smooth.current.x += (target.current.x - smooth.current.x) * 0.05;
    smooth.current.y += (target.current.y - smooth.current.y) * 0.05;
    camera.rotation.y = smooth.current.x;
    camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, smooth.current.y));
  });

  return null;
}

function ScreenshotHelper({ glRef }: { glRef: React.MutableRefObject<THREE.WebGLRenderer | null> }) {
  const { gl } = useThree();
  useEffect(() => { glRef.current = gl; }, [gl, glRef]);
  return null;
}

export default function ImmersiveViewer({ title, imageUrl, description }: ImmersiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    if (!navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-vr').then(setVrSupported).catch(() => {});
    navigator.xr.isSessionSupported('immersive-ar').then(setArSupported).catch(() => {});
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      logger.error('Fullscreen error:', e);
    }
  };

  const takeScreenshot = () => {
    if (!glRef.current) return;
    glRef.current.render(glRef.current.getRenderTarget() as unknown as THREE.Scene, new THREE.Camera());
    const link = document.createElement('a');
    link.href = glRef.current.domElement.toDataURL('image/png');
    link.download = `${title}-360.png`;
    link.click();
  };

  const onLoaded = useCallback(() => setIsLoading(false), []);

  if (!imageUrl) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-black border-2"
      style={{ borderColor: '#00BFB3' }}
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
                style={{ borderColor: '#00BFB3' }}
              />
              <p className="text-white text-sm">Loading immersive view...</p>
            </div>
          </div>
        )}

        {/* React Three Fiber Canvas + React XR */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ fov: 75, position: [0, 0, 0.01] }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            style={{ cursor: 'grab' }}
          >
            <XR store={xrStore}>
              <Suspense fallback={null}>
                <PanoramaSphere url={imageUrl} onLoaded={onLoaded} />
              </Suspense>
              <DragControls />
              <ScreenshotHelper glRef={glRef} />
            </XR>
          </Canvas>
        </div>

        {/* UI overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none z-20">
          {/* Header */}
          <div className="pointer-events-auto bg-gradient-to-b from-black/60 to-transparent p-4 rounded-lg w-fit">
            <h3 className="text-white font-bold text-lg">{title}</h3>
            {description && <p className="text-gray-300 text-sm mt-1">{description}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pointer-events-auto">
            {/* Screenshot */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={takeScreenshot}
              title="Screenshot"
              className="p-3 rounded-lg bg-black/70 hover:bg-black/90 text-white transition"
            >
              <Camera className="w-5 h-5" />
            </motion.button>

            {/* Fullscreen */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-3 rounded-lg bg-black/70 hover:bg-black/90 text-white transition"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </motion.button>

            {/* Enter VR */}
            {vrSupported && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => xrStore.enterVR()}
                className="p-3 rounded-lg flex items-center gap-2 px-4 font-semibold text-sm transition"
                style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
              >
                <Headphones className="w-5 h-5" />
                <span className="hidden sm:inline">Enter VR</span>
              </motion.button>
            )}

            {/* Enter AR */}
            {arSupported && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => xrStore.enterAR()}
                className="p-3 rounded-lg bg-black/70 hover:bg-black/90 text-white flex items-center gap-2 px-4 text-sm font-semibold transition"
              >
                <ScanLine className="w-5 h-5" />
                <span className="hidden sm:inline">Enter AR</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Hint */}
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-black/60 text-white text-xs px-4 py-2 rounded-lg whitespace-nowrap">
          Drag to look around &nbsp;·&nbsp; Pinch to zoom on mobile
        </p>
      </div>
    </motion.div>
  );
}
