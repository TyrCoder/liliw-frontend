'use client';

import { useState } from 'react';

interface Props {
  size?: number;
}

export default function DogMascot({ size = 160 }: Props) {
  const [jumping, setJumping] = useState(false);

  return (
    <div
      className={jumping ? 'dog-jump' : 'dog-idle'}
      onClick={() => setJumping(true)}
      onAnimationEnd={() => setJumping(false)}
      style={{
        position: 'relative', width: size,
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
      }}
    >
      {/* Tail overlay — the source art has no tail, so we draw one and wag it
          independently. It sits BEHIND the body (lower z-index) so only the part
          past the rump shows, reading as a real tail rather than a pasted-on shape. */}
      <svg
        viewBox="0 0 880 1062" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 1 }}
      >
        <g style={{ transformOrigin: '565px 415px', animation: 'tailWag 1.2s ease-in-out infinite' }}>
          <path
            d="M565,415 C620,400 668,362 694,308 C704,285 696,264 673,270
               C650,276 632,318 612,356 C594,390 578,406 565,418 Z"
            fill="#E8A85E" stroke="#241609" strokeWidth="13" strokeLinejoin="round" strokeLinecap="round"
          />
        </g>
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/liliw-dog.png"
        alt="Liliw mascot"
        style={{ position: 'relative', zIndex: 2, width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
