'use client';

import {
  Footprints, CalendarCheck, PartyPopper, Star, MessageSquare,
  Award, Compass, Trophy, Sparkles, MapPin,
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
  'map-pin': MapPin,
};

const GOLD = '#F5C518';
const MUTED = '#C4C9D4';

interface Props {
  icon: string;
  color: string;
  earned: boolean;
  size?: number;
}

export default function BadgeSVG({ icon, color, earned, size = 80 }: Props) {
  const c    = earned ? color : MUTED;
  const gold = earned ? GOLD  : MUTED;
  const bg1  = earned ? `${color}55` : '#EAECF0';
  const bg2  = earned ? `${GOLD}22`  : '#F3F4F8';
  const VectorIcon = BADGE_ICONS[icon?.toLowerCase().trim()];

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

      {/* Outer decorative ring — alternating badge-color / gold tick marks (fiesta bunting rhythm) */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle  = (i / 24) * 2 * Math.PI - Math.PI / 2;
        const r1 = 38, r2 = 36;
        const x1 = 40 + r1 * Math.cos(angle);
        const y1 = 40 + r1 * Math.sin(angle);
        const x2 = 40 + r2 * Math.cos(angle);
        const y2 = 40 + r2 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? c : gold} strokeWidth={i % 3 === 0 ? 2 : 1} strokeOpacity={i % 3 === 0 ? 1 : 0.6} />;
      })}

      {/* Outer ring border */}
      <circle cx="40" cy="40" r="35" stroke={c} strokeWidth="2.5" fill="none" />

      {/* Main circle fill — badge color blending into gold */}
      <circle cx="40" cy="40" r="31" fill={`url(#bg-${uid})`} />

      {/* Sunburst rays — nod to Liliw's "liliwanag" (divine light) legend */}
      {earned && Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        const x1 = 40 + 14 * Math.cos(angle), y1 = 40 + 14 * Math.sin(angle);
        const x2 = 40 + 25 * Math.cos(angle), y2 = 40 + 25 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />;
      })}

      {/* Inner ring — gold coin edge */}
      <circle cx="40" cy="40" r="28" stroke={gold} strokeWidth="1.2" strokeOpacity="0.7" fill="none" strokeDasharray="2 3" />

      {/* Shine overlay */}
      <circle cx="40" cy="40" r="31" fill={`url(#shine-${uid})`} />

      {/* Icon backing chip — pops the icon against the colored background */}
      {earned && <circle cx="40" cy="40" r="15" fill="white" fillOpacity="0.65" />}

      {/* Star crown at top — festive gold, always, when earned */}
      {earned && (
        <g filter={`url(#glow-${uid})`}>
          <polygon
            points="40,3 42,8.5 48,8.5 43,12 45,17.5 40,14 35,17.5 37,12 32,8.5 38,8.5"
            fill={GOLD}
          />
        </g>
      )}
      {!earned && (
        <circle cx="40" cy="8" r="4" fill={MUTED} />
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

      {/* Ribbon at bottom — badge color with a gold center stripe */}
      <path
        d="M28 68 L40 63 L52 68 L52 76 L40 72 L28 76 Z"
        fill={c}
        opacity={earned ? 1 : 0.4}
      />
      <path d="M37.3 65.3 L42.7 65.3 L42.7 76 L40 74.8 L37.3 76 Z" fill={gold} opacity={earned ? 0.9 : 0.5} />
    </svg>
  );
}
