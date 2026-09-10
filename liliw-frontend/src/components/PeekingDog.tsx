'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DogMascot from '@/components/DogMascot';

/**
 * The dog, peeking in from the edge of the stories page.
 *
 * He used to sit in a fixed column beside the stories, which on a page rebuilt
 * around a slideshow left him stranded in a margin doing nothing. Here he is
 * mostly off-screen and only his head comes round the edge, the way a dog
 * looks round a door — and a tap sends him back out of sight.
 *
 * He does not stay gone. Hiding him is meant to be the joke rather than a
 * dismissal, so he waits a while and looks in again; anyone who genuinely
 * wants him gone can keep tapping, which is cheaper than a preference nobody
 * will find.
 */

/**
 * How wide he is drawn, and how much of that stays past the edge.
 *
 * Sized against the viewport, not fixed. At 160 he was 44 per cent of a 360px
 * phone, and a mascot that wide stops being a glance round a door and starts
 * being something in the way of the page.
 */
const SIZE_SHARE = 0.28;
const SIZE_MIN = 92;
const SIZE_MAX = 160;
/** How much of that stays past the edge — the rest of him is the head. */
const HIDDEN_FRACTION = 0.56;

const FIRST_PEEK_MS = 4500;
const RETURN_MS = 26000;

export default function PeekingDog() {
  const [peeking, setPeeking] = useState(false);
  const [size, setSize] = useState(SIZE_MAX);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const measure = () => setSize(
      Math.min(Math.max(window.innerWidth * SIZE_SHARE, SIZE_MIN), SIZE_MAX),
    );
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const schedule = useCallback((delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPeeking(true), delay);
  }, []);

  useEffect(() => {
    /* Someone who has asked for less movement gets him once, sitting still,
       rather than a mascot that slides in and out of view all afternoon. */
    const still = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    schedule(still ? 0 : FIRST_PEEK_MS);
    return () => clearTimeout(timer.current);
  }, [schedule]);

  const shoo = () => {
    setPeeking(false);
    schedule(RETURN_MS);
  };

  return (
    <motion.button
      type="button"
      onClick={shoo}
      aria-label={peeking ? 'Hide the dog' : 'The dog is hiding'}
      title="Shoo!"
      initial={false}
      animate={{ x: peeking ? size * HIDDEN_FRACTION : size + 12 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className="fixed right-0 z-40 cursor-pointer bg-transparent border-0 p-0"
      /* Above the chat button rather than beside it: the assistant lives in
         the bottom-right corner, and two things competing for one corner is
         how a mascot becomes an obstruction. */
      style={{ top: '38%', width: size, lineHeight: 0 }}
    >
      <DogMascot size={size} interactive={false} />
    </motion.button>
  );
}
