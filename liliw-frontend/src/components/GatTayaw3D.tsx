'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

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

/**
 * What he does while he is telling a story, in order.
 *
 * One clip on a loop was the same sixteen seconds over and over for a
 * narration that can run several minutes — the eye stops seeing it. Three in
 * turn is long enough that the repeat is not obvious.
 */
const TELLING = [CLIP.talk, CLIP.waiting, CLIP.idle] as const;

/** Height in world units to normalise every model to, whatever it was authored at. */
const TARGET_HEIGHT = 1.65;

/** Roughly how wide he is with his arms out, used so a narrow panel does not clip them. */
const BODY_WIDTH = 0.95;

/**
 * Air around him, so he is not wedged against the edges of his own panel.
 *
 * Kept tight. The cropped framing this replaced made him look large by showing
 * a fraction of him, so fitting the whole body reads as a sudden shrink unless
 * he fills most of the frame. Six per cent is enough that an arm swinging out
 * mid-animation does not touch the edge.
 */
const FRAME_MARGIN = 1.06;

/**
 * Puts the camera where the whole of him fits.
 *
 * Framing was two hand-picked numbers — a distance and a field of view — and
 * hand-picked numbers are wrong the moment anything around them changes. The
 * last pair cropped him to the knees: 1.85 units away through a 30 degree lens
 * sees about one unit of height, and he is 1.65 tall.
 *
 * The distance is derived instead, from his measured height and the lens, and
 * from the canvas shape as well — a tall narrow panel like the one on the
 * slideshow rail sees less across than it does down, so fitting only by height
 * would trim his shoulders. Whatever size the panel is, all of him is in it.
 */
function Frame({ height }: { height: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);

    const vFov = (cam.fov * Math.PI) / 180;
    const forHeight = (height / 2) / Math.tan(vFov / 2);
    // Horizontal room is the vertical room times the aspect, so a narrow panel
    // needs to pull back further to hold the same width.
    const forWidth = (BODY_WIDTH / 2) / (Math.tan(vFov / 2) * Math.max(aspect, 0.01));

    const distance = Math.max(forHeight, forWidth) * FRAME_MARGIN;
    const centre = height / 2;

    cam.position.set(0, centre, distance);
    cam.lookAt(0, centre, 0);
    /* A three.js camera is a mutable object, not React state — the rule reads
       it as the latter. near and far have no setters. */
    // eslint-disable-next-line react-hooks/immutability
    cam.near = 0.1;
    cam.far = distance * 4;
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, height]);

  return null;
}

function Figure({ speaking, greetKey, turn }: { speaking: boolean; greetKey: string; turn: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions, mixer } = useAnimations(animations, group);

  /*
   * One copy per mount, cloned the way a skinned mesh has to be.
   *
   * Object3D.clone() copies the bones and copies the mesh, and then leaves the
   * copied mesh bound to the *original* skeleton. Everything looks right and
   * nothing moves: the animation drives the new bones while the body follows
   * the old ones, frozen in its bind pose. That is exactly what this was doing
   * — a rigged character standing perfectly still with four clips playing.
   *
   * SkeletonUtils.clone rebuilds the bindings against the copy. The clone
   * itself is still needed because useGLTF caches the parsed scene, so the
   * storyteller on the listing page and the one on a story would otherwise be
   * driving a single skeleton between them.
   */
  const model = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as THREE.Group;

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
   * Three states, driven by the mixer rather than by timers.
   *
   *   greet   one bow, when the story page opens
   *   telling the other three clips in turn, for as long as he is narrating
   *   resting idle, on a loop, when he has nothing to say
   *
   * Every clip in the first two runs LoopOnce and hands over on the mixer's
   * finished event. Timing them by hand would mean knowing that the bow is
   * five seconds and the other three are fifteen, sixteen and seventeen — and
   * being wrong the moment any of them is re-exported.
   */
  const [phase, setPhase] = useState<'greet' | 'telling' | 'resting'>('greet');
  const [step, setStep] = useState(0);

  // A fresh story is a fresh greeting. Tied to the story, not to which
  // narration is selected within it, so switching topics does not make him
  // bow again mid-visit.
  useEffect(() => { setPhase('greet'); setStep(0); }, [greetKey]);

  // Starting and stopping the narration moves him between telling and resting,
  // but never interrupts a bow — being cut off mid-greeting to start talking
  // looks like a glitch rather than a transition.
  useEffect(() => {
    setPhase(p => (p === 'greet' ? p : speaking ? 'telling' : 'resting'));
    if (speaking) setStep(0);
  }, [speaking]);

  const wanted =
    phase === 'greet'   ? CLIP.greet :
    phase === 'telling' ? TELLING[step % TELLING.length] :
                          CLIP.idle;

  /* Advance on the mixer's word: the bow hands over to whatever is next, and
     each telling clip hands over to the one after it, so the three cycle for
     as long as the narration lasts. */
  useEffect(() => {
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      if (name === CLIP.greet) {
        setPhase(speaking ? 'telling' : 'resting');
        setStep(0);
        return;
      }
      if (TELLING.includes(name as (typeof TELLING)[number])) setStep(n => n + 1);
    };
    mixer.addEventListener('finished', onFinished as never);
    return () => { mixer.removeEventListener('finished', onFinished as never); };
  }, [mixer, speaking]);

  /* A floor under the bow. If its finished event never arrives — a hidden tab
     pauses the mixer — he would otherwise stay folded over for the whole
     visit. Only the greeting needs this; the other phases loop harmlessly. */
  useEffect(() => {
    if (phase !== 'greet') return;
    const t = setTimeout(() => setPhase(speaking ? 'telling' : 'resting'), 8000);
    return () => clearTimeout(t);
  }, [phase, speaking]);

  /*
   * drei hands back `actions` as lazy getters that return undefined until the
   * mixer has a root object to bind to. That is normally true by the time
   * effects run, but nothing re-runs this if it is not — the actions object
   * keeps the same identity forever, so a single unlucky ordering would leave
   * him standing in his bind pose for the rest of the visit with no error
   * anywhere. One retry on the next frame costs nothing and removes the whole
   * class of it.
   */
  const [bindAttempt, setBindAttempt] = useState(0);

  useEffect(() => {
    const next = actions[wanted];
    if (!next) {
      if (bindAttempt > 30) return; // something else is wrong; stop spinning
      const f = requestAnimationFrame(() => setBindAttempt(n => n + 1));
      return () => cancelAnimationFrame(f);
    }

    // Crossfade rather than cut: switching clips on a skeleton mid-pose snaps
    // the limbs, which is far more noticeable than the transition itself.
    next.reset().setEffectiveWeight(1).fadeIn(0.35).play();

    if (phase === 'resting') {
      next.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      // Greeting and telling both hand over when the clip ends, so both run
      // once and hold their last pose until the crossfade takes them.
      next.setLoop(THREE.LoopOnce, 1);
      /* An AnimationAction is a mutable three.js object and has no setter for
         this flag. The rule reads it as React state, which it is not. */
      // eslint-disable-next-line react-hooks/immutability
      next.clampWhenFinished = true;
    }

    return () => { next.fadeOut(0.35); };
  }, [wanted, phase, actions, mixer, bindAttempt]);

  /* Turning is done here rather than by flipping the canvas in CSS: a mirrored
     transform would put his staff in the wrong hand and reverse the lighting
     with it. */
  return <group ref={group} rotation-y={turn}><primitive object={model} /></group>;
}

export default function GatTayaw3D({
  speaking = false,
  greetKey = 'default',
  facing = 'front',
  width = 220,
  height = 300,
}: {
  /** True while the narration is playing, which decides idle versus talking. */
  speaking?: boolean;
  /** Changing this makes him bow again — pass the story being read. */
  greetKey?: string;
  /** Which way he is turned, for when he is being moved across a track. */
  facing?: 'left' | 'right' | 'front';
  width?: number;
  height?: number;
}) {
  const turn = facing === 'left' ? 0.6 : facing === 'right' ? -0.6 : 0;
  return (
    <div style={{ width, height }} className="select-none">
      {/* Closer, and a narrower lens. He was framed like a wide establishing
          shot: a small figure adrift in a box mostly full of nothing, which is
          a waste of both the model and the column it sits in. */}
      {/* The position here is a starting value only — Frame replaces it once it
          knows the panel's shape. */}
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.9, 3.2], fov: 30 }}
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

        <Frame height={TARGET_HEIGHT} />

        <Suspense fallback={null}>
          {/* No offset group: he stands on y = 0 and the camera looks at his
              middle, which is what Frame works out. Nudging the model up or
              down to make a fixed camera work is how the framing drifted in
              the first place. */}
          <Figure speaking={speaking} greetKey={greetKey} turn={turn} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Warm the cache while the visitor is still reading the page above it.
useGLTF.preload(MODEL);
