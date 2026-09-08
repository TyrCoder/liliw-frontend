'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Gat Tayaw, as the rigged model rather than the stack of cut-out PNGs.
 *
 * The old figure was five flat images — arm, neck, body, staff arm, head —
 * with two mouth positions swapped on a CSS animation. It read as a paper
 * puppet, which is what it was. This is the same character with a skeleton and
 * four baked animations, so he stands, looks about while he is talking, and
 * bows when he greets you.
 *
 * The file is deliberately small. What was exported is 77MB and just under two
 * million triangles — an AI-generated mesh at a density meant for rendering
 * stills, not for a phone on mobile data. Simplified to 79k triangles with
 * meshopt compression and WebP textures it is 1.1MB, which is about the weight
 * of one photograph on the same page, and at the size he is displayed the
 * difference is not visible.
 */

const MODEL = '/models/gat-tayaw.glb';

/** The clips the export ships with, under the names Tripo baked in. */
const CLIP = {
  idle:   'preset:biped:idle',
  talk:   'preset:biped:look_around',
  greet:  'preset:biped:bow',
  waiting:'preset:biped:fold_arms',
} as const;

/** Height in world units to normalise every model to, whatever it was authored at. */
const TARGET_HEIGHT = 1.65;

function Figure({ speaking, greetKey }: { speaking: boolean; greetKey: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions, mixer } = useAnimations(animations, group);

  /*
   * One copy per mount. useGLTF caches the parsed scene, so two of these on a
   * page would otherwise animate the same skeleton and fight over it.
   */
  const model = useMemo(() => {
    const clone = scene.clone(true);

    // The export is quantized, so its raw coordinates mean nothing on their
    // own — the box has to be measured after the loader has applied the scale.
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;

    clone.scale.setScalar(scale);
    // Centred left to right and front to back, standing on y = 0, so the
    // camera below can be a fixed position rather than a guess per model.
    clone.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);

    clone.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = false;
        m.receiveShadow = false;
        m.frustumCulled = false; // a skinned mesh's bounds go stale mid-animation
      }
    });
    return clone;
  }, [scene]);

  /*
   * Bow once when he first appears and whenever the visitor moves to another
   * story, then settle. A character who greets you every few seconds is one
   * nobody reads past.
   *
   * The end of the bow is taken from the mixer rather than a timer. The clip
   * runs five seconds, and any hardcoded number is either short — cutting him
   * off halfway down — or long, leaving him held at the bottom of a bow he
   * finished a moment ago.
   */
  const [greeting, setGreeting] = useState(true);
  useEffect(() => { setGreeting(true); }, [greetKey]);

  useEffect(() => {
    const done = (e: { action: THREE.AnimationAction }) => {
      if (e.action.getClip().name === CLIP.greet) setGreeting(false);
    };
    mixer.addEventListener('finished', done as never);
    return () => { mixer.removeEventListener('finished', done as never); };
  }, [mixer]);

  // Whatever else happens, he does not stay bowing: a clip that never fires
  // its finished event, because the tab was hidden or the mixer was paused,
  // would otherwise leave him folded over for the rest of the visit.
  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => setGreeting(false), 6000);
    return () => clearTimeout(t);
  }, [greeting]);

  const wanted = greeting ? CLIP.greet : speaking ? CLIP.talk : CLIP.idle;

  useEffect(() => {
    const next = actions[wanted];
    if (!next) return;

    // Crossfade rather than cut: switching clips on a skeleton mid-pose snaps
    // the limbs, which is far more noticeable than the transition itself.
    next.reset().setEffectiveWeight(1).fadeIn(0.35).play();
    if (wanted === CLIP.greet) {
      next.setLoop(THREE.LoopOnce, 1);
      /* An AnimationAction is a mutable three.js object and has no setter for
         this flag. The rule reads it as React state, which it is not. */
      // eslint-disable-next-line react-hooks/immutability
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
    }

    return () => { next.fadeOut(0.35); };
  }, [wanted, actions, mixer]);

  return <group ref={group}><primitive object={model} /></group>;
}

export default function GatTayaw3D({
  speaking = false,
  greetKey = 'default',
  height = 267,
}: {
  /** True while the narration is playing, which decides idle versus talking. */
  speaking?: boolean;
  /** Changing this makes him bow again — pass the story being read. */
  greetKey?: string;
  height?: number;
}) {
  return (
    <div style={{ width: 178, height }} className="select-none">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.05, 2.45], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Lit by hand rather than by an environment map: drei's presets fetch
            an HDR from a CDN, which is one more thing to be blocked, to fail
            offline, and to add to the content security policy for a character
            three lights render perfectly well. */}
        <ambientLight intensity={1.6} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.9} color="#9DC4FF" />

        <Suspense fallback={null}>
          <group position={[0, -0.85, 0]}>
            <Figure speaking={speaking} greetKey={greetKey} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

// Warm the cache while the visitor is still reading the page above it.
useGLTF.preload(MODEL);
