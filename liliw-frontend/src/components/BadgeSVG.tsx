'use client';

import {
  Footprints, CalendarCheck, PartyPopper, Star, MessageSquare,
  Award, Compass, Trophy, Sparkles,
} from 'lucide-react';

// Named vector icons render crisp on every device (unlike emoji, which vary by OS/font).
// Any icon value not in this map falls back to rendering as raw emoji text.
export const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  footprints: Footprints,
  'calendar-check': CalendarCheck,
  'party-popper': PartyPopper,
  star: Star,
  'message-square': MessageSquare,
  award: Award,
  compass: Compass,
  trophy: Trophy,
  sparkles: Sparkles,
};

interface Props {
  icon: string;
  color: string;
  earned: boolean;
  size?: number;
}

export default function BadgeSVG({ icon, color, earned, size = 80 }: Props) {
  const c   = earned ? color   : '#C4C9D4';
  const bg1 = earned ? `${color}30` : '#EAECF0';
  const bg2 = earned ? `${color}10` : '#F3F4F8';
  const VectorIcon = BADGE_ICONS[icon?.toLowerCase().trim()];

  // Lighter tint for inner glow
  const uid = color.replace('#', '');

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`bg-${uid}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </radialGradient>
        <radialGradient id={`shine-${uid}`} cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity={earned ? 0.55 : 0.2} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer decorative ring — tick marks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle  = (i / 24) * 2 * Math.PI - Math.PI / 2;
        const r1 = 38, r2 = 36;
        const x1 = 40 + r1 * Math.cos(angle);
        const y1 = 40 + r1 * Math.sin(angle);
        const x2 = 40 + r2 * Math.cos(angle);
        const y2 = 40 + r2 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={i % 3 === 0 ? 2 : 1} strokeOpacity={i % 3 === 0 ? 1 : 0.5} />;
      })}

      {/* Outer ring border */}
      <circle cx="40" cy="40" r="35" stroke={c} strokeWidth="2.5" fill="none" />

      {/* Main circle fill */}
      <circle cx="40" cy="40" r="31" fill={`url(#bg-${uid})`} />

      {/* Inner ring */}
      <circle cx="40" cy="40" r="28" stroke={c} strokeWidth="1" strokeOpacity="0.5" fill="none" strokeDasharray="2 3" />

      {/* Shine overlay */}
      <circle cx="40" cy="40" r="31" fill={`url(#shine-${uid})`} />

      {/* Star crown at top — only when earned */}
      {earned && (
        <g filter={`url(#glow-${uid})`}>
          <polygon
            points="40,3 42,8.5 48,8.5 43,12 45,17.5 40,14 35,17.5 37,12 32,8.5 38,8.5"
            fill={color}
          />
        </g>
      )}
      {!earned && (
        <circle cx="40" cy="8" r="4" fill="#C4C9D4" />
      )}

      {/* Icon — vector icon when it matches a known name, else raw emoji text */}
      {VectorIcon ? (
        <g transform="translate(28, 28)" opacity={earned ? 1 : 0.4} style={{ color: c }}>
          <VectorIcon size={24} strokeWidth={2.2} />
        </g>
      ) : (
        <text
          x="40" y="47"
          textAnchor="middle"
          fontSize="22"
          opacity={earned ? 1 : 0.35}
          style={{ userSelect: 'none' }}
        >
          {icon}
        </text>
      )}

      {/* Ribbon at bottom */}
      <path
        d="M28 68 L40 63 L52 68 L52 76 L40 72 L28 76 Z"
        fill={c}
        opacity={earned ? 1 : 0.4}
      />
      <line x1="40" y1="63" x2="40" y2="76" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}
