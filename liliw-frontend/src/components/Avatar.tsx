'use client';

import { isCustomAvatar, isDefaultAvatar, spriteStyle, avatarLabel } from '@/lib/avatars';

/**
 * One place that decides how a profile picture is drawn, so the passport, the
 * navbar and the edit form cannot drift apart on it. Falls back to the initial
 * treatment the site used before avatars existed.
 */
export default function Avatar({
  avatar, name, size = 40, className = '', ring = true,
}: {
  avatar?: string | null;
  /** Used for the initial fallback and the alt text. */
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const base = 'rounded-full overflow-hidden shrink-0 flex items-center justify-center';
  const shell: React.CSSProperties = {
    width: size,
    height: size,
    boxShadow: ring ? '0 0 0 2px rgba(255,255,255,0.9), 0 4px 12px -4px rgba(15,95,181,0.55)' : undefined,
  };

  if (isDefaultAvatar(avatar)) {
    return (
      <span role="img" aria-label={avatarLabel(avatar)}
        className={`${base} ${className}`}
        style={{ ...shell, ...spriteStyle(avatar), backgroundColor: '#EAF1FA' }} />
    );
  }

  if (isCustomAvatar(avatar)) {
    return (
      <span className={`${base} ${className}`} style={{ ...shell, backgroundColor: '#EAF1FA' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar!} alt={`${name}'s profile picture`} loading="lazy"
          className="w-full h-full object-cover" />
      </span>
    );
  }

  return (
    <span aria-hidden className={`${base} ${className} font-bold text-white`}
      style={{ ...shell, backgroundColor: '#0F5FB5', fontSize: Math.round(size * 0.4) }}>
      {initial}
    </span>
  );
}
