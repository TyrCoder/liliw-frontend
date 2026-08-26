'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Headphones, Camera,
  Maximize2, Minimize2, ScanLine, MapPin, X,
  Info, Navigation, Save, PenLine, Check, Trash2, Upload, Move, Compass, Images, Crosshair,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { Hotspot } from '@/lib/types';

export interface Scene {
  id: string;
  title: string;
  imageUrl: string;
  thumbUrl?: string;
  description?: string;
}

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
  onUploadScene?: (file: File) => Promise<NewSceneResult>;
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

function PanoramaSphere({
  url, thumbUrl, editMode, onPlace, onReady,
}: {
  url: string;
  thumbUrl?: string;
  editMode: boolean;
  onPlace?: (pitch: number, yaw: number) => void;
  onReady?: () => void;
}) {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const disposed = useRef(false);
  const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

  useEffect(() => {
    disposed.current = false;
    const loader = new THREE.TextureLoader();

    const apply = (tex: THREE.Texture) => {
      if (disposed.current) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      // The sphere is rendered with BackSide, so the camera sits inside it and
      // sees the texture from behind — which mirrors it. Any writing in the
      // panorama came out backwards. Flipping the texture on u corrects it.
      //
      // Done on the texture rather than by inverting the geometry (the usual
      // recipe) because a negative mesh scale changes how the raycaster reads
      // faces, and clicking the sphere is how hotspots get placed.
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
      tex.needsUpdate = true;
      setTexture((prev) => { prev?.dispose(); return tex; });
    };

    // The full-resolution texture had no error handler, so if it failed —
    // a dropped connection, or a panorama big enough to stall on mobile —
    // the sphere silently kept the low-res placeholder and the tour just
    // looked permanently blurry. Retry once before giving up.
    const loadFull = (attempt = 0) => {
      loader.load(
        url,
        apply,
        undefined,
        () => {
          if (disposed.current) return;
          if (attempt < 1) setTimeout(() => loadFull(attempt + 1), 1200);
        },
      );
    };

    if (thumbUrl) {
      loader.load(
        thumbUrl,
        (tex) => { apply(tex); onReady?.(); loadFull(); },
        undefined,
        () => { onReady?.(); loadFull(); },
      );
    } else {
      loader.load(url, (tex) => { apply(tex); onReady?.(); });
    }

    return () => { disposed.current = true; };
  }, [url, thumbUrl, onReady, maxAnisotropy]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!editMode || !onPlace) return;
    e.stopPropagation();
    const { pitch, yaw } = pointToAngles(e.point);
    onPlace(pitch, yaw);
  };

  if (!texture) return null;

  return (
    <mesh onClick={handleClick}>
      <sphereGeometry args={[500, 64, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Mactan-style hotspot marker ──────────────────────────────────────────

function HotspotMarker({
  hotspot, scenes, editMode, onDelete, onClick, onMove, onResize, isRepositioning, draggingRef,
}: {
  hotspot: Hotspot;
  scenes: Scene[];
  editMode: boolean;
  onDelete?: (id: string) => void;
  onClick?: (h: Hotspot) => void;
  onMove?: (id: string) => void;
  onResize?: (id: string, delta: number) => void;
  isRepositioning?: boolean;
  draggingRef?: React.MutableRefObject<boolean>;
}) {
  const [hovered, setHovered] = useState(false);
  const pos = anglesToPosition(hotspot.pitch, hotspot.yaw);
  const isNav = hotspot.type === 'navigate';
  const targetTitle = isNav && hotspot.targetSceneIndex !== undefined
    ? scenes[hotspot.targetSceneIndex]?.title
    : undefined;
  const displayLabel = targetTitle || hotspot.label;

  const size = hotspot.size ?? 1.0;
  const btnSize = Math.round(92 * size);
  const iconSize = Math.round(34 * size);

  const accentColor = isRepositioning ? '#a78bfa' : (isNav ? '#1565C0' : '#FFB400');
  const borderColor = isRepositioning ? 'rgba(167,139,250,0.9)' : (isNav ? 'rgba(0,191,179,0.85)' : 'rgba(255,180,0,0.85)');

  return (
    <group position={pos}>
      <Html center distanceFactor={220} zIndexRange={[1, 50]}>
        <motion.div
          className="flex flex-col items-center gap-1.5 select-none"
          style={{ pointerEvents: 'all' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { if (!draggingRef?.current) setHovered(false); }}
          onTouchStart={() => setHovered(true)}
          onTouchEnd={() => setTimeout(() => setHovered(false), 600)}
        >
          <motion.button
            onClick={(e) => { e.stopPropagation(); onClick?.(hotspot); }}
            animate={{ scale: hovered ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: btnSize, height: btnSize,
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Outer pulse ring */}
            <span style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: `2px solid ${accentColor}`,
              opacity: isRepositioning ? 0.9 : 0.5,
              animation: isRepositioning ? 'ping 1s cubic-bezier(0,0,0.2,1) infinite' : 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            {/* Second slower pulse */}
            <span style={{
              position: 'absolute',
              inset: -5,
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}`,
              opacity: 0.3,
              animation: 'ping 2.8s cubic-bezier(0,0,0.2,1) infinite 0.4s',
            }} />
            {/* The disc, matching the cardboard marker.
             *
             * It was a translucent tinted circle with a coloured rim, which
             * over a photograph is a faint ring you can see straight through —
             * on a phone in daylight it read as an empty outline and gave no
             * clue that it led anywhere. Solid white, a coloured core, and a
             * dark halo: legible over sky, foliage or shadow, which is all a
             * panorama offers. */}
            {/* Clear in the middle, legible at the rim.
             *
             * A filled disc covers the very thing it points at, and on a
             * panorama the view is the content. The ring does the work: white,
             * with a dark ring behind and a dark shadow outside it, so it
             * holds against sky, foliage or shadow while the middle stays
             * open. */}
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: isRepositioning
                ? `3px dashed ${borderColor}`
                : `3px solid ${hovered ? '#F5C518' : '#FFFFFF'}`,
              boxShadow: hovered
                ? '0 0 0 2px rgba(4,16,43,0.55), 0 0 18px rgba(245,197,24,0.55)'
                : '0 0 0 2px rgba(4,16,43,0.5), 0 2px 10px rgba(0,0,0,0.35)',
              transition: 'all 0.2s ease',
            }} />
            {/* Icon */}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isRepositioning ? (
                <Move style={{ width: iconSize, height: iconSize, color: '#a78bfa', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }} />
              ) : isNav ? (
                <Navigation style={{
                  width: iconSize * 0.85, height: iconSize * 0.85,
                  color: hovered ? '#F5C518' : '#FFFFFF',
                  fill: hovered ? '#F5C518' : '#FFFFFF',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
                }} />
              ) : (
                <Info style={{
                  width: iconSize * 0.85, height: iconSize * 0.85,
                  color: hovered ? '#F5C518' : '#FFD54F',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
                }} />
              )}
            </span>
          </motion.button>

          {/* Label — always, not on hover.
              A phone has no hover, so on the device where a bare circle is
              hardest to interpret the name never appeared at all. */}
          <AnimatePresence>
            {(
              <motion.span
                initial={{ opacity: 0, y: -6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '5px 13px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(0,0,0,0.82)',
                  color: isRepositioning ? '#a78bfa' : 'white',
                  border: `1px solid ${accentColor}70`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 8px ${accentColor}30`,
                  letterSpacing: '0.03em',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isRepositioning ? '+ Click to place' : displayLabel}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Edit controls — move, resize, delete */}
          {editMode && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {/* Move button */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onMove?.(hotspot.id); }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                title="Move hotspot"
                style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  backgroundColor: isRepositioning ? '#a78bfa' : '#6366f1',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
                }}
              >
                <Move style={{ width: 12, height: 12 }} />
              </motion.button>

              {/* Size − */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onResize?.(hotspot.id, -0.15); }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                title="Shrink"
                style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 900, lineHeight: 1,
                }}
              >
                −
              </motion.button>

              {/* Size + */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onResize?.(hotspot.id, 0.15); }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                title="Grow"
                style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 900, lineHeight: 1,
                }}
              >
                +
              </motion.button>

              {/* Delete button */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onDelete?.(hotspot.id); }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                title="Delete"
                style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                }}
              >
                <X style={{ width: 13, height: 13 }} />
              </motion.button>
            </div>
          )}
        </motion.div>
      </Html>
    </group>
  );
}

// ─── Drag Controls (touch-action: none fixes mobile scroll) ───────────────

function DragControls({ editMode, autoRotate, draggingRef, resetSignal, enabled }: {
  editMode: boolean;
  autoRotate: boolean;
  draggingRef: React.MutableRefObject<boolean>;
  /** Bumped by the recentre button. The view eases back rather than snapping. */
  resetSignal: number;
  /** Off while the phone's own motion is steering the camera. */
  enabled: boolean;
}) {
  const { camera, gl } = useThree();
  const prev = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const lastInteract = useRef(Date.now());
  const fov = useRef(80);

  // Recentre. The lerp in useFrame carries the camera home over about a
  // second, which reads as the view swinging back rather than cutting.
  useEffect(() => {
    if (!resetSignal) return;
    target.current = { x: 0, y: 0 };
    fov.current = 80;
    lastInteract.current = Date.now();
  }, [resetSignal]);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const el = gl.domElement;

    const onDown = (e: MouseEvent) => {
      draggingRef.current = true;
      lastInteract.current = Date.now();
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { draggingRef.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      lastInteract.current = Date.now();
      target.current.x -= (e.clientX - prev.current.x) * 0.005;
      target.current.y -= (e.clientY - prev.current.y) * 0.005;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      lastInteract.current = Date.now();
      if (e.touches[0]) prev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!draggingRef.current || !e.touches[0]) return;
      lastInteract.current = Date.now();
      target.current.x -= (e.touches[0].clientX - prev.current.x) * 0.005;
      target.current.y -= (e.touches[0].clientY - prev.current.y) * 0.005;
      prev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    // Scroll zooms by narrowing the field of view, the way a panorama viewer
    // is expected to behave. Only over the canvas, and only once the pointer
    // is on it, so the page still scrolls normally everywhere else.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteract.current = Date.now();
      fov.current = Math.max(35, Math.min(90, fov.current + e.deltaY * 0.05));
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchend', onUp);
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onUp);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('wheel', onWheel);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    // In cardboard mode the head is the input. Writing rotation here as well
    // would fight the sensor and the horizon would judder.
    if (!enabled) return;

    smooth.current.x += (target.current.x - smooth.current.x) * 0.05;
    smooth.current.y += (target.current.y - smooth.current.y) * 0.05;
    camera.rotation.y = smooth.current.x;
    camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, smooth.current.y));

    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov += (fov.current - cam.fov) * 0.12;
      cam.updateProjectionMatrix();
    }

    if (autoRotate && !editMode && !draggingRef.current && Date.now() - lastInteract.current > 3000) {
      target.current.x -= delta * 0.08;
    }
  });

  return null;
}

/* ── Cardboard ───────────────────────────────────────────────────────────────
 *
 * WebXR reaches almost nobody here. Chrome on an ordinary Android phone
 * reports immersive-vr as unsupported, and Safari has no WebXR at all, so the
 * VR button was hidden on every device a visitor to Liliw is likely to own.
 *
 * Cardboard mode is the same experience without WebXR: the phone's own motion
 * sensors turn the camera, the panorama is drawn twice side by side for a
 * £5 plastic viewer, and the gaze reticle below does the selecting. It is not
 * a headset — there is no positional tracking, only orientation — but it is
 * the version of VR that the people holding these phones can actually use.
 */

/** Ask iOS for the motion sensors. Everywhere else they are simply available. */
async function requestOrientationAccess(): Promise<boolean> {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
  const doe = window.DeviceOrientationEvent as any;
  // iOS 13+ gates the sensors behind a user gesture and an explicit grant.
  if (typeof doe.requestPermission === 'function') {
    try {
      return (await doe.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Turns the camera with the phone.
 *
 * The quaternion maths is the long-standing DeviceOrientationControls recipe:
 * the device euler in YXZ, rotated -90° about x to bring the phone from
 * screen-up to looking forward, then corrected for how the screen itself is
 * rotated. three dropped the control from core, not the technique.
 */
function CardboardControls({ enabled, onSensor }: {
  enabled: boolean;
  /** Called once we know whether readings are actually arriving. */
  onSensor: (working: boolean) => void;
}) {
  const { camera } = useThree();
  const angles = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const screenAngle = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      angles.current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
      onSensor(true);
    };

    /* Granting permission is not the same as getting readings.
     *
     * On iOS the prompt can be answered yes while Motion & Orientation Access
     * is switched off in Settings, or the grant can be remembered as denied
     * from a previous visit — in both cases the event simply never fires and
     * the view sits frozen with no indication why. Two seconds of silence is
     * taken as "this phone is not going to tell us", and the viewer falls back
     * to dragging. */
    const deadline = setTimeout(() => { if (!angles.current) onSensor(false); }, 2000);
    const onScreen = () => {
      screenAngle.current = (screen.orientation?.angle ?? (window as any).orientation ?? 0) as number;
    };

    onScreen();
    window.addEventListener('deviceorientation', onOrient, true);
    window.addEventListener('orientationchange', onScreen);
    screen.orientation?.addEventListener?.('change', onScreen);
    return () => {
      clearTimeout(deadline);
      window.removeEventListener('deviceorientation', onOrient, true);
      window.removeEventListener('orientationchange', onScreen);
      screen.orientation?.removeEventListener?.('change', onScreen);
    };
  }, [enabled, onSensor]);

  const euler = useRef(new THREE.Euler());
  const q1 = useRef(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));
  const spin = useRef(new THREE.Quaternion());
  const zee = useRef(new THREE.Vector3(0, 0, 1));

  useFrame(() => {
    if (!enabled || !angles.current) return;
    const d = Math.PI / 180;
    const { alpha, beta, gamma } = angles.current;

    euler.current.set(beta * d, alpha * d, -gamma * d, 'YXZ');
    camera.quaternion.setFromEuler(euler.current);
    camera.quaternion.multiply(q1.current);
    camera.quaternion.multiply(spin.current.setFromAxisAngle(zee.current, -screenAngle.current * d));
  });

  return null;
}

/**
 * Draws the scene twice, one eye either side.
 *
 * Mounted only in cardboard mode. A useFrame priority above zero takes over
 * from r3f's own render loop, which is what makes the two passes possible —
 * and is also why this must not be mounted otherwise, or nothing renders at
 * all in the ordinary view.
 */
function StereoRenderer() {
  const { gl, scene, camera, size } = useThree();
  const stereo = useRef(new THREE.StereoCamera());

  useEffect(() => {
    stereo.current.eyeSep = 0.064; // average human interpupillary distance, in metres
    const cam = camera as THREE.PerspectiveCamera;
    const previousAspect = cam.aspect;
    // Each eye owns half the width, so the projection has to be built for a
    // half-width viewport or everything comes out stretched.
    cam.aspect = size.width / 2 / size.height;
    cam.updateProjectionMatrix();

    return () => {
      cam.aspect = previousAspect;
      cam.updateProjectionMatrix();
      gl.setScissorTest(false);
      gl.setViewport(0, 0, size.width, size.height);
      gl.setScissor(0, 0, size.width, size.height);
    };
  }, [camera, gl, size.width, size.height]);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateWorldMatrix(true, false);
    stereo.current.update(cam);

    const w = size.width / 2;
    const h = size.height;
    const dpr = gl.getPixelRatio();

    gl.setScissorTest(true);
    gl.setScissor(0, 0, w * dpr, h * dpr);
    gl.setViewport(0, 0, w * dpr, h * dpr);
    gl.render(scene, stereo.current.cameraL);

    gl.setScissor(w * dpr, 0, w * dpr, h * dpr);
    gl.setViewport(w * dpr, 0, w * dpr, h * dpr);
    gl.render(scene, stereo.current.cameraR);
    gl.setScissorTest(false);
  }, 1);

  return null;
}

/* ── Gaze ────────────────────────────────────────────────────────────────────
 *
 * The ordinary hotspots are DOM: drei's <Html>, an overlay positioned over the
 * canvas by the one main camera. In a split view they would land in a single
 * eye and in the wrong place, so cardboard draws them again as geometry and
 * aims at them with a reticle: look at one, hold for a moment, it fires.
 *
 * Gaze rather than a pointer because both hands are holding the viewer.
 */
/**
 * How long the dot has to rest inside a hotspot before it fires.
 *
 * Long enough to be a decision rather than an accident — you look around a
 * panorama constantly, and anything under a second or so triggers on a passing
 * glance. Short enough that holding still does not become a chore.
 */
const GAZE_SECONDS = 2.5;

/** How far off centre a hotspot can be and still count as aimed at. */
const AIM_DEGREES = 11;
const NAV_COLOR = '#1565C0';
const INFO_COLOR = '#FFB400';

/**
 * A hotspot, drawn to be found.
 *
 * The problem with the earlier version was not its size but its contrast: a
 * navy-blue ring on a photograph of a farm at dusk is invisible from across
 * the scene, so there was nowhere obvious to aim. This is a white disc with a
 * coloured core and a dark halo behind it — legible against sky, foliage or
 * shadow, which is all a panorama ever offers — with the label always on.
 */
function CardboardHotspot({
  hotspot, label, aimed,
}: {
  hotspot: Hotspot;
  label: string;
  /** True while the reticle is resting on this one. */
  aimed: boolean;
}) {
  const pos = anglesToPosition(hotspot.pitch, hotspot.yaw);
  const color = hotspot.type === 'navigate' ? NAV_COLOR : INFO_COLOR;
  const s = 24 * (hotspot.size ?? 1);
  const grow = aimed ? 1.3 : 1;

  return (
    <Billboard position={pos}>
      {/* Open in the middle, unmistakable at the edge.
       *
       * A solid disc reads clearly but puts a coin over the thing it is
       * pointing at — on a panorama, the view is the content. So the middle
       * stays clear and the legibility comes from the rim: a dark ring behind
       * a white one, which holds against sky, foliage and shadow alike without
       * hiding any of them. */}
      <mesh scale={grow} renderOrder={2}>
        <ringGeometry args={[s * 0.66, s * 1.24, 40]} />
        <meshBasicMaterial color="#04102B" transparent opacity={0.55} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh scale={grow} renderOrder={3}>
        <ringGeometry args={[s * 0.78, s * 1.12, 40]} />
        <meshBasicMaterial color={aimed ? '#F5C518' : '#FFFFFF'} transparent opacity={0.98} depthTest={false} depthWrite={false} />
      </mesh>

      {/* Which kind it is, at a glance: an arrow leads somewhere, a dot tells
          you something. Drawn rather than lettered — a glyph at this size is
          a smudge, and troika would lay out one text mesh per hotspot. */}
      {hotspot.type === 'navigate' ? (
        <mesh scale={grow} renderOrder={5} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[s * 0.34, s * 0.5, 3]} />
          <meshBasicMaterial color={aimed ? '#F5C518' : '#FFFFFF'} depthTest={false} depthWrite={false} />
        </mesh>
      ) : (
        <mesh scale={grow} renderOrder={5}>
          <circleGeometry args={[s * 0.2, 16]} />
          <meshBasicMaterial color={aimed ? '#F5C518' : color} depthTest={false} depthWrite={false} />
        </mesh>
      )}

      <Text
        position={[0, s * 2.2, 0]}
        fontSize={s * 0.7}
        color={aimed ? '#F5C518' : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={s * 0.09}
        outlineColor="#04102B"
        maxWidth={s * 14}
        renderOrder={6}
      >
        {label}
      </Text>
    </Billboard>
  );
}

/**
 * The reticle, and the gaze that drives it.
 *
 * Only while cardboard is on. On the flat page it would be a dot stuck in the
 * middle of the screen doing a worse job than the pointer already does.
 */
function CardboardGaze({
  hotspots, scenes, onSelect, active, showMarkers,
}: {
  hotspots: Hotspot[];
  scenes: Scene[];
  onSelect: (h: Hotspot) => void;
  active: boolean;
  /** Off in look mode, where the ordinary DOM markers are still on screen. */
  showMarkers: boolean;
}) {
  const { camera } = useThree();

  const [aimedId, setAimedId] = useState<string | null>(null);
  const group = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const arc = useRef<THREE.Mesh>(null);
  const lastStep = useRef(-1);
  const dir = useRef(new THREE.Vector3());
  const held = useRef<{ id: string | null; t: number }>({ id: null, t: 0 });
  const forward = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!active || !group.current) return;

    /* Where the head is pointing, taken from the camera's own rotation.
     *
     * Not getWorldDirection: that reads matrixWorld, and in cardboard the only
     * thing updating matrixWorld is the stereo renderer, which runs after this
     * — so the aim always trailed the view by a frame, and during a turn it
     * pointed somewhere the reader was no longer looking. The quaternion is
     * set by CardboardControls in the same frame, so this is current. */
    forward.current.set(0, 0, -1).applyQuaternion(camera.quaternion);

    // Sit the reticle a fixed distance ahead, facing the viewer. Close enough
    // to focus on, far enough not to swim.
    group.current.position.copy(camera.position).addScaledVector(forward.current, 3);
    group.current.quaternion.copy(camera.quaternion);

    /* Which hotspot is being looked at, by angle rather than by raycast.
     *
     * A hotspot is a known direction from the origin, so this is one dot
     * product each — no meshes, no billboard matrices, no world-matrix
     * ordering to get wrong, and nothing that can silently stop working
     * because something else updated late. It also gives an aim tolerance in
     * degrees, which is the unit the problem is actually in.
     *
     * Nearest wins where two overlap, so a crowded scene still resolves. */
    let id: string | null = null;
    let best = Math.cos(AIM_DEGREES * Math.PI / 180);
    for (const h of hotspots) {
      const [x, y, z] = anglesToPosition(h.pitch, h.yaw);
      dir.current.set(x, y, z).normalize();
      const dot = dir.current.dot(forward.current);
      if (dot > best) { best = dot; id = h.id; }
    }

    if (id !== held.current.id) held.current = { id, t: 0 };
    else if (id) held.current.t += delta;

    // Drives the marker's own highlight. Only on a change, so this is a couple
    // of renders per look and not one per frame.
    if (id !== aimedId) setAimedId(id);

    const progress = id ? Math.min(1, held.current.t / GAZE_SECONDS) : 0;

    if (fill.current) {
      // The dot swells as the dwell runs, so the centre of vision shows
      // something is happening even while the eye is on the hotspot.
      fill.current.scale.setScalar(0.3 + progress * 0.7);
      (fill.current.material as THREE.MeshBasicMaterial).opacity = id ? 1 : 0.7;
    }

    /* The countdown proper: a gold arc sweeping round the dot.
     *
     * An arc means rebuilding the ring's geometry, so it is quantised to 48
     * steps and only rebuilt when the step changes — about twenty rebuilds
     * over two and a half seconds instead of one per frame. Growing the dot
     * alone was not a countdown: it showed that something was counting,
     * without showing how much was left. */
    if (arc.current) {
      const step = Math.round(progress * 48);
      if (step !== lastStep.current) {
        lastStep.current = step;
        const done = (step / 48) * Math.PI * 2;
        arc.current.visible = step > 0;
        arc.current.geometry.dispose();
        arc.current.geometry = new THREE.RingGeometry(
          0.13, 0.16, 48, 1,
          Math.PI / 2 - done, done,
        );
      }
    }

    if (progress >= 1 && id) {
      const chosen = hotspots.find((h) => h.id === id);
      held.current = { id: null, t: 0 };
      if (chosen) onSelect(chosen);
    }
  });

  if (!active) return null;

  return (
    <>
      {showMarkers && hotspots.map((h) => (
        <CardboardHotspot
          key={h.id}
          hotspot={h}
          label={
            h.type === 'navigate' && h.targetSceneIndex !== undefined
              ? scenes[h.targetSceneIndex]?.title ?? h.label
              : h.label
          }
          aimed={aimedId === h.id}
        />
      ))}

      {/* The reticle: a dot, a ring around it, and the countdown arc outside
       *  both, sitting three units in front of the eye.
       *
       *  Sized in degrees of view rather than by eye. At the old radii the dot
       *  subtended 0.84° — two pixels per eye on a 390px phone in a split
       *  view, which is not a dot anyone can see, let alone aim with. These
       *  give roughly 2.3° for the dot and 6° across the arc: about six and
       *  fifteen pixels on that same phone, and still modest on a desktop.
       *
       *  renderOrder goes on each mesh. Setting it on the group does nothing —
       *  three reads it per object, it is not inherited. */}
      <group ref={group}>
        <mesh renderOrder={10}>
          <ringGeometry args={[0.085, 0.105, 32]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh ref={fill} renderOrder={11}>
          <circleGeometry args={[0.06, 24]} />
          <meshBasicMaterial color="#F5C518" transparent opacity={0.85} depthTest={false} depthWrite={false} />
        </mesh>

        {/* Track for the arc, so the countdown reads against something. */}
        <mesh renderOrder={10}>
          <ringGeometry args={[0.13, 0.16, 48]} />
          <meshBasicMaterial color="#04102B" transparent opacity={0.35} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh ref={arc} visible={false} renderOrder={12}>
          <ringGeometry args={[0.13, 0.16, 48, 1, Math.PI / 2, 0]} />
          <meshBasicMaterial color="#F5C518" transparent opacity={0.95} depthTest={false} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

/** A hotspot's description, as geometry, for when there is no DOM to put it in. */
function CardboardInfoPanel({ hotspot, active }: { hotspot: Hotspot | null; active: boolean }) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const forward = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!group.current) return;
    camera.getWorldDirection(forward.current);
    group.current.position.copy(camera.position).addScaledVector(forward.current, 6);
    group.current.quaternion.copy(camera.quaternion);
  });

  if (!active || !hotspot) return null;

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[5.4, 2.6]} />
        <meshBasicMaterial color="#061A42" transparent opacity={0.92} depthTest={false} />
      </mesh>
      <Text position={[0, 0.82, 0]} fontSize={0.34} color="#F5C518" anchorX="center" maxWidth={4.8}>
        {hotspot.label}
      </Text>
      <Text position={[0, -0.1, 0]} fontSize={0.22} color="#FFFFFF" anchorX="center" anchorY="middle" maxWidth={4.8}>
        {hotspot.info || 'No description has been added for this point yet.'}
      </Text>
      <Text position={[0, -1.02, 0]} fontSize={0.16} color="#8FA6CC" anchorX="center">
        Look at another point to continue
      </Text>
    </group>
  );
}

/**
 * The shared look for every button floating over the panorama: navy glass with
 * a gold hairline, not black. Kept as one object so the cluster cannot drift
 * button by button, which is how it ended up with three different blacks.
 */
const CTRL = {
  background: 'rgba(9,26,66,0.72)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(245,197,24,0.28)',
  borderColor: 'rgba(245,197,24,0.28)',
  boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
  minWidth: 40,
  minHeight: 40,
} as const;

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
      // silent
    } finally {
      setUploadingScene(false);
    }
  };

  const confirm = () => {
    if (!label.trim()) return;
    const targetIndex = type === 'navigate'
      ? (newScene ? scenes.length : targetScene)
      : undefined;

    // A scene added from inside this dialog took its name from the uploaded
    // file, so the tour ended up labelled with things like "LILIW CHURCH
    // INSIDE 2". The hotspot's own label is what the editor actually wrote to
    // describe where it leads, so the new scene takes that name instead.
    const named = newScene
      ? {
          ...newScene,
          photo: { ...newScene.photo, name: label.trim() },
          scene: { ...newScene.scene, title: label.trim() },
        }
      : undefined;

    onConfirm({
      pitch: pending.pitch,
      yaw: pending.yaw,
      type,
      label: label.trim(),
      targetSceneIndex: targetIndex,
      info: type === 'info' ? info.trim() : undefined,
    }, named);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div className="bg-gray-900 rounded-xl p-5 w-80 border border-teal-500 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <PenLine className="w-4 h-4" style={{ color: '#1565C0' }} />
          Place Hotspot
        </h3>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setType('navigate')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
            style={{ backgroundColor: type === 'navigate' ? '#1565C0' : 'rgba(255,255,255,0.1)', color: type === 'navigate' ? '#0F1F3C' : 'white' }}>
            <Navigation className="w-4 h-4 inline mr-1" /> Navigate
          </button>
          <button onClick={() => setType('info')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
            style={{ backgroundColor: type === 'info' ? '#FFB400' : 'rgba(255,255,255,0.1)', color: type === 'info' ? '#0F1F3C' : 'white' }}>
            <Info className="w-4 h-4 inline mr-1" /> Info
          </button>
        </div>

        <label className="block text-gray-300 text-xs mb-1">Label *</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Go to entrance"
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 mb-3 border border-gray-600 focus:border-teal-400 outline-none"
        />

        {type === 'navigate' && (
          <div className="space-y-3 mb-3">
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
                    className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border border-dashed border-gray-600 text-gray-400 hover:border-teal-400 hover:text-teal-400 transition disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingScene ? 'Uploading…' : 'Upload new 360° scene'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

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

        <div className="text-gray-600 text-xs mb-4">
          Pitch: {pending.pitch.toFixed(1)}° · Yaw: {pending.yaw.toFixed(1)}°
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!label.trim() || uploadingScene}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
            style={{ backgroundColor: '#1565C0', color: '#0F1F3C' }}
          >
            <Check className="w-4 h-4 inline mr-1" /> Place
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Info popup ───────────────────────────────────────────────────────────

function InfoPopup({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl p-4 shadow-xl"
      style={{ backgroundColor: 'rgba(15,20,40,0.95)', border: '1px solid rgba(255,180,0,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
          <Info className="w-4 h-4" /> {hotspot.label}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-200 text-sm leading-relaxed">{hotspot.info}</p>
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
  const draggingRef = useRef(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Set when the Fullscreen API is unavailable and the viewer pins itself over
  // the viewport instead — iPhone. Treated as fullscreen everywhere below.
  const [fauxFullscreen, setFauxFullscreen] = useState(false);
  const filling = isFullscreen || fauxFullscreen;
  const [autoRotate, setAutoRotate] = useState(!editMode);
  const [resetSignal, setResetSignal] = useState(0);
  // The scene strip is a wide band across the bottom of the panorama. Worth
  // having while choosing a scene, in the way while looking at one.
  const [showThumbs, setShowThumbs] = useState(true);
  // Hotspots initialized once from props — NOT synced on re-render to avoid losing edits
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots);
  const [pending, setPending] = useState<PendingHotspot | null>(null);
  const [repositioning, setRepositioning] = useState<string | null>(null);
  // Editor mode used to place a hotspot on *every* click of the panorama, so
  // you could not look around without littering it. Placement is now an
  // explicit tool you arm from the toolbar, and it disarms after one use.
  const [armed, setArmed] = useState(false);
  const [activeInfo, setActiveInfo] = useState<Hotspot | null>(null);
  const [vrInfo, setVrInfo] = useState<Hotspot | null>(null);
  const [cardboard, setCardboard] = useState(false);
  // Look mode: one view, not two, with the crosshair doing the choosing.
  const [lookMode, setLookMode] = useState(false);
  const [canCardboard, setCanCardboard] = useState(false);
  const [vrNotice, setVrNotice] = useState('');
  const [isPortrait, setIsPortrait] = useState(false);
  // null until the phone has had its chance to report; false means it never did.
  const [sensorOk, setSensorOk] = useState<boolean | null>(null);
  const handleSensor = useCallback((working: boolean) => {
    setSensorOk(prev => (prev === working ? prev : working));
  }, []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const current = scenes[sceneIndex];
  const hasMultiple = scenes.length > 1;
  const sceneHotspots = hotspots.filter((h) => (h.sceneIndex ?? 0) === sceneIndex);

  useEffect(() => {
    // Cardboard needs orientation sensors and a phone-shaped device. A laptop
    // reports DeviceOrientationEvent as a type but never fires it, and
    // offering VR there would be a button that does nothing.
    setCanCardboard(
      'DeviceOrientationEvent' in window &&
      window.matchMedia('(pointer: coarse)').matches,
    );

  }, []);

  // Leaving fullscreen by the browser's own gesture — the back swipe, the
  // Escape key — must take cardboard mode with it, or the reader is left in a
  // split-screen page they cannot get out of.
  useEffect(() => {
    if (!cardboard) return;
    const mq = window.matchMedia('(orientation: portrait)');
    const sync = () => setIsPortrait(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [cardboard]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape leaves real fullscreen by itself; the pinned fallback has no
      // browser behaviour behind it, so it needs releasing here.
      if (e.key === 'Escape') {
        setRepositioning(null); setPending(null);
        setFauxFullscreen(false); setLookMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const autoSave = useCallback(async (updated: Hotspot[]) => {
    if (!onSaveHotspots) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSaveHotspots(updated);
      setSaved(true);
    } catch (e: any) {
      setSaveError(e?.message || 'Auto-save failed');
      setTimeout(() => setSaveError(''), 4000);
    } finally {
      setSaving(false);
    }
  }, [onSaveHotspots]);

  const onPlace = useCallback((pitch: number, yaw: number) => {
    if (!editMode) return;
    if (repositioning) {
      setHotspots((prev) => {
        const updated = prev.map((h) => h.id === repositioning ? { ...h, pitch, yaw } : h);
        autoSave(updated);
        return updated;
      });
      setRepositioning(null);
      setSaved(false);
      return;
    }
    if (pending) return;
    setPending({ pitch, yaw });
    // One click, one hotspot: placing disarms the tool so the next drag is
    // just looking around again.
    setArmed(false);
  }, [editMode, repositioning, pending, autoSave]);

  const resizeHotspot = useCallback((id: string, delta: number) => {
    setHotspots((prev) => {
      const updated = prev.map((h) => {
        if (h.id !== id) return h;
        const clamped = Math.max(0.5, Math.min(2.0, (h.size ?? 1.0) + delta));
        return { ...h, size: Math.round(clamped * 10) / 10 };
      });
      autoSave(updated);
      return updated;
    });
    setSaved(false);
  }, [autoSave]);

  const confirmHotspot = (h: Omit<Hotspot, 'id'>, newScene?: NewSceneResult) => {
    if (newScene) onNewScene?.(newScene.photo, scenes.length);
    const newHotspot = { ...h, id: crypto.randomUUID(), sceneIndex };
    setHotspots((prev) => {
      const updated = [...prev, newHotspot];
      autoSave(updated);
      return updated;
    });
    setPending(null);
    setSaved(false);
  };

  const deleteHotspot = (id: string) => {
    setHotspots((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      autoSave(updated);
      return updated;
    });
    setSaved(false);
  };

  /**
   * The same two actions as a click, for a gaze.
   *
   * The info case cannot reuse setActiveInfo: that popup is DOM, and the whole
   * reason this exists is that the DOM is not composited in a session.
   */
  const handleGazeSelect = useCallback((h: Hotspot) => {
    if (h.type === 'navigate' && h.targetSceneIndex !== undefined) {
      setVrInfo(null);
      goToScene(h.targetSceneIndex);
    } else {
      setVrInfo((prev) => (prev?.id === h.id ? null : h));
    }
  }, [goToScene]);

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

  /**
   * Fullscreen, with a fallback for iPhone.
   *
   * Safari on iOS implements the Fullscreen API for <video> only, so
   * requestFullscreen on this container rejects and the button did nothing at
   * all — on the device where filling the screen matters most. When the real
   * thing is unavailable the viewer pins itself over the viewport instead,
   * which is not the same as fullscreen but is the whole screen minus the
   * browser bars, and it looks and behaves identically to the user.
   */
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof el.requestFullscreen !== 'function') {
      setFauxFullscreen((v) => !v);
      return;
    }

    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) {
      logger.error('Fullscreen:', e);
      setFauxFullscreen((v) => !v);
    }
  };

  /**
   * Into cardboard: motion sensors, the screen filled, and landscape.
   *
   * There is no WebXR path. It was tried and removed — Chrome on an ordinary
   * Android phone reports immersive-vr as unsupported and Safari has no WebXR
   * at all, so the branch existed for hardware nobody visiting Liliw is
   * holding, while doubling what had to be kept working.
   */
  const enterCardboard = async () => {
    setVrNotice('');

    const granted = await requestOrientationAccess();
    if (!granted) {
      setVrNotice('Motion access was declined, so the view cannot follow your phone.');
      setTimeout(() => setVrNotice(''), 5000);
      return;
    }

    setAutoRotate(false);
    setCardboard(true);

    const el = containerRef.current;
    if (el && typeof el.requestFullscreen === 'function' && !document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch { setFauxFullscreen(true); }
    } else {
      setFauxFullscreen(true);
    }

    // Best effort: Android honours this, iOS ignores it and the hint below
    // asks the reader to turn the phone themselves.
    try { await (screen.orientation as any)?.lock?.('landscape'); } catch { /* not available */ }
  };

  /**
   * Look mode: full screen, one view, crosshair in the middle.
   *
   * Cardboard splits the screen for a plastic viewer. This is the same idea
   * for a phone held in the hand — turn to look, rest the dot on a hotspot,
   * and it opens. It is also the mode that still works when iOS refuses the
   * motion sensors, because dragging keeps steering the view and the dot
   * stays wherever the middle of the screen is.
   */
  const enterLook = async () => {
    setVrNotice('');
    setSensorOk(null);
    await requestOrientationAccess();
    setAutoRotate(false);
    setLookMode(true);

    const el = containerRef.current;
    if (el && typeof el.requestFullscreen === 'function' && !document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch { setFauxFullscreen(true); }
    } else {
      // iPhone: no Fullscreen API outside <video>, so the viewer pins itself
      // over the viewport instead.
      setFauxFullscreen(true);
    }
  };

  const exitLook = useCallback(() => {
    setLookMode(false);
    setVrInfo(null);
    setFauxFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const exitCardboard = useCallback(() => {
    setCardboard(false);
    setVrInfo(null);
    setFauxFullscreen(false);
    try { (screen.orientation as any)?.unlock?.(); } catch { /* not available */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  /**
   * Hold the page still while the viewer is filling the screen.
   *
   * Real fullscreen takes the page out of the document flow itself; the pinned
   * fallback does not, so the page carries on scrolling underneath. On a phone
   * that means a drag across the panorama also drags the page, the address bar
   * slides in and out, and the viewer stops covering everything — which is the
   * one thing it was asked to do.
   */
  useEffect(() => {
    if (!fauxFullscreen) return;
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => { body.style.overflow = previous; };
  }, [fauxFullscreen]);

  // Leaving fullscreen by the browser's own gesture — the back swipe, the
  // Escape key — must take cardboard mode with it, or the reader is left in a
  // split-screen page with no obvious way out.
  useEffect(() => {
    if (!cardboard) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exitCardboard(); };
    const onFs = () => { if (!document.fullscreenElement && !fauxFullscreen) exitCardboard(); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [cardboard, fauxFullscreen, exitCardboard]);

  const takeScreenshot = () => {
    if (!glRef.current) return;
    const link = document.createElement('a');
    link.href = glRef.current.domElement.toDataURL('image/png');
    link.download = `${title}-${current.title}.png`;
    link.click();
  };

  const onReady = useCallback(() => setIsLoading(false), []);

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
    // Opacity only, never a transform.
    //
    // A transformed element is the containing block for its own fixed
    // positioning and for every fixed descendant, so a `y` entrance here — or
    // on any ancestor — quietly turns "fill the viewport" into "fill this
    // column", which is why fullscreen left the navbar showing.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      ref={containerRef}
      className="rounded-2xl overflow-hidden bg-black select-none"
      style={{
        // A hairline rather than the 2px band: at this size the border was
        // reading as a frame around the panorama instead of an edge to it.
        border: `1px solid ${editMode ? '#FFB400' : 'rgba(245,197,24,0.38)'}`,
        boxShadow: editMode
          ? '0 18px 40px rgba(0,0,0,0.45)'
          : '0 18px 44px rgba(3,12,36,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        ...(filling
          ? {
              position: 'fixed' as const, inset: 0, zIndex: 60,
              height: '100dvh', width: '100vw', borderRadius: 0, border: 'none',
            }
          : {}),
      }}
    >
      <div className="relative w-full" style={{ height: filling ? '100%' : 'clamp(280px, calc(100svh - 120px), 900px)' }}>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ backgroundColor: '#0a0f1e' }}>
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
                  <div className="absolute inset-0 rounded-full border-t-2 animate-spin" style={{ borderColor: '#1565C0' }} />
                </div>
                <p className="text-white/70 text-sm">Loading panorama...</p>
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

        {/* Armed hint — says what the next click will do. */}
        <AnimatePresence>
          {editMode && armed && !pending && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold text-white pointer-events-none"
              style={{
                top: 64, zIndex: 20, backgroundColor: 'rgba(167,139,250,0.92)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)', letterSpacing: '0.02em',
              }}>
              Click on the panorama to place the hotspot
            </motion.div>
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
          {activeInfo && <InfoPopup hotspot={activeInfo} onClose={() => setActiveInfo(null)} />}
        </AnimatePresence>

        {/* Canvas — touch-action:none prevents page scroll on mobile */}
        <div className="absolute inset-0" style={{ touchAction: 'none' }}>
          <Canvas
            camera={{ fov: 80, position: [0, 0, 0.01] }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            dpr={[1, 2]}
            style={{ cursor: (repositioning || (editMode && armed)) ? 'crosshair' : 'grab' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
            }}
          >
              <PanoramaSphere
                key={current.imageUrl}
                url={current.imageUrl}
                thumbUrl={current.thumbUrl}
                editMode={(editMode && armed && !pending) || !!repositioning}
                onPlace={onPlace}
                onReady={onReady}
              />
              {/* The DOM markers are positioned by the single main camera, so
                  in a split view they would sit in one eye and in the wrong
                  place. CardboardGaze draws them as geometry instead. */}
              {!cardboard && sceneHotspots.map((h) => (
                <HotspotMarker
                  key={h.id}
                  hotspot={h}
                  scenes={scenes}
                  editMode={editMode}
                  onDelete={deleteHotspot}
                  onClick={handleHotspotClick}
                  onMove={(id) => { setRepositioning((prev) => prev === id ? null : id); }}
                  onResize={resizeHotspot}
                  isRepositioning={repositioning === h.id}
                  draggingRef={draggingRef}
                />
              ))}
              <DragControls
                editMode={editMode}
                autoRotate={autoRotate}
                draggingRef={draggingRef}
                resetSignal={resetSignal}
                enabled={(!cardboard && !lookMode) || sensorOk === false}
              />
              <ScreenshotHelper glRef={glRef} />

              <CardboardControls enabled={cardboard || lookMode} onSensor={handleSensor} />
              {cardboard && <StereoRenderer />}

              {/* Only alive in cardboard — see CardboardGaze. */}
              {!editMode && (
                <>
                  {/* The crosshair works in both modes. Cardboard also draws
                      its own markers; look mode leaves the ordinary ones on
                      screen, so the same hotspot is not drawn twice. */}
                  <CardboardGaze
                    hotspots={sceneHotspots}
                    scenes={scenes}
                    onSelect={handleGazeSelect}
                    active={cardboard || lookMode}
                    showMarkers={cardboard}
                  />
                  <CardboardInfoPanel hotspot={vrInfo} active={cardboard} />
                </>
              )}
          </Canvas>
        </div>

        {/* The way out of a full screen, always drawn, above everything.
         *
         * The control cluster sits at the foot of the viewer and can be missed
         * or scrolled past on a phone, and iOS has no Escape key and no
         * fullscreen chrome of its own — so filling the screen could leave a
         * reader with no visible exit at all. This one is never conditional on
         * anything but being full. */}
        {/* In look mode, say what the crosshair is waiting for — and if the
            phone never reported its motion, that dragging still works. */}
        {lookMode && (
          <div className="absolute inset-x-0 bottom-20 z-30 flex justify-center px-4 pointer-events-none">
            <span className="px-4 py-2 rounded-full text-xs font-semibold text-white text-center"
              style={{ background: 'rgba(9,26,66,0.85)', border: '1px solid rgba(245,197,24,0.3)' }}>
              {sensorOk === false
                ? 'Drag to look around, then hold the dot on a circle to go there'
                : 'Hold the dot on a circle to go there'}
            </span>
          </div>
        )}

        {filling && !cardboard && (
          <button
            onClick={() => { if (lookMode) exitLook(); else toggleFullscreen(); }}
            aria-label="Leave full screen"
            className="absolute top-3 right-3 z-40 rounded-full p-2.5 text-white pointer-events-auto"
            style={{
              background: 'rgba(9,26,66,0.85)',
              border: '1px solid rgba(245,197,24,0.45)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── Cardboard chrome ──
            Everything else on the glass is hidden while the screen is split:
            a control cluster drawn once, off to one side, is worse than no
            control at all through a pair of lenses. What is left is the way
            out, mirrored so it lands in the same place for each eye. */}
        {cardboard && (
          <>
            {[0, 1].map((eye) => (
              <div
                key={eye}
                className="absolute top-3 z-30 flex items-center gap-2"
                style={{ left: eye === 0 ? '3%' : '53%' }}
              >
                <button
                  onClick={exitCardboard}
                  aria-label="Leave cardboard mode"
                  className="rounded-full p-2 text-white"
                  style={{ background: 'rgba(9,26,66,0.75)', border: '1px solid rgba(245,197,24,0.35)' }}
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Fullscreen from inside cardboard too. Entry asks for it, but
                    a browser can refuse, and the back gesture drops out of it —
                    leaving a split view in a window with no way to fill the
                    screen again short of leaving and starting over. */}
                <button
                  onClick={toggleFullscreen}
                  aria-label={filling ? 'Leave fullscreen' : 'Fill the screen'}
                  className="rounded-full p-2 text-white"
                  style={{ background: 'rgba(9,26,66,0.75)', border: '1px solid rgba(245,197,24,0.35)' }}
                >
                  {filling ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            ))}

            {(isPortrait || sensorOk === false) && (
              <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 pointer-events-none">
                <span className="px-4 py-2 rounded-full text-xs font-bold text-white text-center"
                  style={{ background: 'rgba(9,26,66,0.9)', border: '1px solid rgba(245,197,24,0.35)' }}>
                  {sensorOk === false
                    // Silence from the sensors is almost always iOS: either the
                    // prompt was declined, or Motion & Orientation Access is off
                    // in Settings. Naming the setting is the difference between
                    // a fixable problem and a broken feature.
                    ? 'Motion is off, so the view will not follow your phone — drag to look around. To fix: Settings › Safari › Motion & Orientation Access.'
                    : 'Turn your phone sideways, then place it in the viewer'}
                </span>
              </div>
            )}
          </>
        )}

        {/* ── UI Overlay ── */}
        <div
          className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20"
          style={{ display: cardboard ? 'none' : undefined }}
        >

          {/* Top bar */}
          <div className="flex items-start justify-between p-2 sm:p-3 gap-2">
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="pointer-events-auto px-3 py-2 rounded-full"
              style={{
                // Navy rather than black, with a gold hairline: the scene label
                // is the one piece of chrome that sits over the artwork all the
                // time, so it should look like it belongs to the site.
                background: 'rgba(9,26,66,0.82)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(245,197,24,0.34)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              }}>
              {editMode && (
                <div className="text-xs font-bold mb-0.5 flex items-center gap-1" style={{ color: repositioning ? '#a78bfa' : '#FFB400' }}>
                  {repositioning ? <Move className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                  {repositioning
                    ? <><span className="hidden sm:inline">Click anywhere to move hotspot</span><span className="sm:hidden">Moving…</span></>
                    : <><span className="hidden sm:inline">EDITOR — Click sphere to place</span><span className="sm:hidden">EDITOR</span></>
                  }
                  {repositioning && (
                    <button
                      onClick={() => setRepositioning(null)}
                      className="ml-1 underline text-purple-300"
                      style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#c4b5fd' }}
                    >
                      cancel
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#F5C518' }} />
                <span className="text-white font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none tracking-wide">
                  {current.title}
                </span>
              </div>
            </motion.div>

            {/* Top-right: save button in edit mode only */}
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="pointer-events-auto flex flex-col items-end gap-1"
            >
              {editMode && (
                <>
                  {/* Arm placement explicitly, rather than every click on the
                      panorama creating a hotspot. */}
                  <motion.button
                    onClick={() => setArmed(v => !v)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    title={armed ? 'Cancel placing' : 'Add a hotspot to this scene'}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition"
                    style={{
                      backgroundColor: armed ? '#a78bfa' : 'rgba(0,0,0,0.72)',
                      color: armed ? '#0F1F3C' : 'white',
                      border: `1px solid ${armed ? '#a78bfa' : 'rgba(255,255,255,0.25)'}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {armed
                      ? <><X className="w-4 h-4" /> Cancel</>
                      : <><MapPin className="w-4 h-4" /> Add Hotspot</>}
                  </motion.button>

                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                    style={{
                      backgroundColor: saveError ? '#ef4444' : saved ? '#22c55e' : '#FFB400',
                      color: saveError ? 'white' : '#0F1F3C',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    {saving ? '...' : saveError ? '✕ Error' : saved
                      ? <><Check className="w-4 h-4" /> Saved</>
                      : <><Save className="w-4 h-4" /> Save</>}
                  </motion.button>
                  {saveError && (
                    <span className="text-red-400 text-xs bg-black/70 px-2 py-0.5 rounded max-w-44 text-right leading-tight">
                      {saveError}
                    </span>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Bottom section: hotspot list + thumbnails + control buttons */}
          <div className="flex flex-col gap-2 pb-2 sm:pb-3 px-2 sm:px-3">

            {/* Declining motion access is a decision, not a failure — but with
                nothing on screen the VR button simply looked broken. */}
            {vrNotice && (
              <div className="pointer-events-auto self-center px-3 py-2 rounded-full text-xs font-semibold text-white text-center"
                style={{ background: 'rgba(9,26,66,0.9)', border: '1px solid rgba(245,197,24,0.35)' }}>
                {vrNotice}
              </div>
            )}


            {/* Editor: hotspot list — sits just above thumbnails */}
            <AnimatePresence>
              {editMode && sceneHotspots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-auto p-2.5 rounded-xl text-xs text-white"
                  style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,180,0,0.25)' }}>
                  <div className="font-bold mb-1.5 text-yellow-400 flex items-center gap-1">
                    <PenLine className="w-3 h-3" />
                    {sceneHotspots.length} hotspot{sceneHotspots.length !== 1 ? 's' : ''} on this scene
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sceneHotspots.map((h) => (
                      <motion.span key={h.id}
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: h.type === 'navigate' ? 'rgba(0,191,179,0.55)' : 'rgba(255,180,0,0.55)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {h.type === 'navigate' ? <Navigation className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        {h.label}
                        <button onClick={() => deleteHotspot(h.id)} className="ml-1 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thumbnail strip + control buttons row */}
            <div className="flex items-end gap-2">

              {/* Thumbnail strip */}
              {/* min-w-0, on this and on the scroller inside it.
                  A flex item defaults to min-width:auto, which means it refuses
                  to shrink below its content. Eight thumbnails at 176px is
                  about 1400px of content, so the strip pushed the row wider
                  than the viewer and shoved the next arrow and the whole
                  control cluster out past the edge. Allowing it to shrink is
                  what lets overflow-x-auto do its job. */}
              {hasMultiple && showThumbs && (
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="self-center text-white text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(9,26,66,0.7)', backdropFilter: 'blur(4px)', border: '1px solid rgba(245,197,24,0.24)' }}>
                    {sceneIndex + 1} / {scenes.length}
                  </div>
                  <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                    <motion.button
                      onClick={() => goToScene((sceneIndex - 1 + scenes.length) % scenes.length)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="shrink-0 p-2 sm:p-3 rounded-xl text-white transition"
                      style={CTRL}>
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <div
                      className="flex gap-1.5 sm:gap-2 overflow-x-auto flex-1 min-w-0 py-1 px-0.5"
                      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
                    >
                      {scenes.map((scene, idx) => (
                        <motion.button key={scene.id} onClick={() => goToScene(idx)}
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                          title={scene.title}
                          className="shrink-0 relative rounded-xl overflow-hidden border-2 transition-all"
                          style={{
                            // 2:1, matching the equirectangular source, so the
                            // thumbnail shows the whole scene instead of a
                            // cropped sliver of it.
                            width: 'clamp(112px, 26vw, 176px)', height: 'clamp(56px, 13vw, 88px)',
                            borderColor: idx === sceneIndex ? '#F5C518' : 'rgba(255,255,255,0.28)',
                            opacity: idx === sceneIndex ? 1 : 0.7,
                            boxShadow: idx === sceneIndex ? '0 0 14px rgba(245,197,24,0.55)' : 'none',
                          }}>
                          <img src={scene.thumbUrl || scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                          {/* Which scene is which — the picture alone is not
                              enough to tell two corners of the same room apart. */}
                          <span
                            className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-white font-semibold text-left truncate"
                            style={{
                              fontSize: 'clamp(9px, 2.4vw, 11px)',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0))',
                              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                            }}>
                            {scene.title}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => goToScene((sceneIndex + 1) % scenes.length)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="shrink-0 p-2 sm:p-3 rounded-xl text-white transition"
                      style={CTRL}>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Control buttons — bottom right */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="pointer-events-auto flex gap-1.5 sm:gap-2 shrink-0"
              >
                {!editMode && (
                  <motion.button
                    onClick={() => setAutoRotate((v) => !v)}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    title={autoRotate ? 'Stop the slow turn' : 'Turn slowly on its own'}
                    className="p-2 sm:p-3 rounded-xl text-lg font-bold leading-none transition"
                    style={{
                      ...CTRL,
                      background: autoRotate ? 'rgba(245,197,24,0.92)' : CTRL.background,
                      color: autoRotate ? '#0A1A40' : 'white',
                      borderColor: autoRotate ? '#F5C518' : CTRL.borderColor,
                    }}>
                    ↻
                  </motion.button>
                )}
                {/* Look mode. Only where the screen is touched — on a desktop
                    the pointer already does this job better. */}
                {canCardboard && (
                  <motion.button
                    onClick={lookMode ? exitLook : enterLook}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    title={lookMode ? 'Leave look mode' : 'Full screen, and look to move'}
                    aria-pressed={lookMode}
                    className="p-2 sm:p-3 rounded-xl transition"
                    style={{
                      ...CTRL,
                      background: lookMode ? 'rgba(245,197,24,0.92)' : CTRL.background,
                      color: lookMode ? '#0A1A40' : 'white',
                      borderColor: lookMode ? '#F5C518' : CTRL.borderColor,
                    }}>
                    <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                )}

                {/* Show or hide the scene strip. Gold while the strip is up,
                    so the button reads as a state and not just an action. With
                    it down, the scene count moves onto the button — otherwise
                    hiding the strip also hides where you are in the tour. */}
                {hasMultiple && (
                  <motion.button
                    onClick={() => setShowThumbs(v => !v)}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    title={showThumbs ? 'Hide the scene thumbnails' : 'Show the scene thumbnails'}
                    aria-pressed={showThumbs}
                    className="px-2.5 sm:px-3 rounded-xl transition inline-flex items-center gap-1.5 text-xs font-bold"
                    style={{
                      ...CTRL,
                      background: showThumbs ? 'rgba(245,197,24,0.92)' : CTRL.background,
                      color: showThumbs ? '#0A1A40' : 'white',
                      borderColor: showThumbs ? '#F5C518' : CTRL.borderColor,
                    }}>
                    <Images className="w-4 h-4 sm:w-5 sm:h-5" />
                    {!showThumbs && <span>{sceneIndex + 1}/{scenes.length}</span>}
                  </motion.button>
                )}

                {/* Recentre. Two minutes of dragging leaves the horizon
                    anywhere; without this the only way back is reloading. */}
                <motion.button
                  onClick={() => setResetSignal(n => n + 1)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  title="Recentre the view"
                  className="p-2 sm:p-3 rounded-xl text-white transition"
                  style={CTRL}>
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button
                  onClick={takeScreenshot}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  title="Save this view as an image"
                  className="p-2 sm:p-3 rounded-xl text-white transition"
                  style={CTRL}>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button
                  onClick={toggleFullscreen}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  title={filling ? 'Leave fullscreen' : 'Fullscreen'}
                  className="p-2 sm:p-3 rounded-xl text-white transition"
                  style={CTRL}>
                  {filling ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </motion.button>
                {!editMode && canCardboard && (
                  <motion.button
                    onClick={enterCardboard}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    title="Split the screen for a cardboard viewer"
                    className="p-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition"
                    style={{ backgroundColor: '#F5C518', color: '#0A1A40', minWidth: 46, minHeight: 46, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}>
                    <Headphones className="w-5 h-5" />
                    <span className="hidden sm:inline">VR</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Ping animation keyframes injected once */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}
