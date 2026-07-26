'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

type Lang = 'en' | 'fil';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const NARRATIONS = [
  {
    key: 'welcome',
    title: { en: 'Welcome to Liliw', fil: 'Maligayang Pagdating' },
    text: {
      en: "Welcome, traveler! I am Gat Tayaw, keeper of Liliw's stories. This town holds centuries of laughter, faith, and craftsmanship. Let me walk you through our most treasured tales.",
      fil: "Maligayang pagdating, manlalakbay! Ako si Gat Tayaw, tagapag-ingat ng mga kuwento ng Liliw. Ang bayang ito ay puno ng siglo-siglong kasaysayan, pananampalataya, at kahusayan. Halika at gabayan kita sa aming mga piling kwento.",
    },
  },
  {
    key: 'legend',
    title: { en: 'The Legend of Liliw', fil: 'Ang Alamat ng Liliw' },
    text: {
      en: "They say our town was named after the liliwanag — a divine light that once shone over this valley, guiding the first settlers who would build the community we cherish today.",
      fil: "Sinasabing ang ating bayan ay pinangalanan mula sa 'liliwanag' — isang banal na liwanag na minsan ay lumiwanag sa lambak na ito, na gumabay sa mga unang manlalakbay na nagtatag ng pamayanan.",
    },
  },
  {
    key: 'church',
    title: { en: 'The Parish Church', fil: 'Ang Parokya' },
    text: {
      en: "The Saint John the Baptist Parish Church has stood for centuries as the heart of Liliw. Its ancient walls have witnessed baptisms, weddings, festivals, and the quiet prayers of every generation.",
      fil: "Ang Parokya ng San Juan Bautista ay nakatayo na sa gitna ng Liliw sa loob ng maraming siglo. Ang mga sinaunang dingding nito ay nasaksihan ang binyag, kasal, pista, at tahimik na panalangin ng bawat henerasyon.",
    },
  },
  {
    key: 'ancestral',
    title: { en: 'Ancestral Houses', fil: 'Mga Bahay na Bato' },
    text: {
      en: "Liliw is graced with some of Laguna's finest ancestral houses. These grand bahay na bato speak of prosperous families, masterful craftsmanship, and a heritage that refuses to be forgotten.",
      fil: "Ang Liliw ay pinarangalan ng ilan sa pinakamagandang bahay na bato sa Laguna. Ang mga dakilang tahanan na ito ay nagkukuwento ng maunlad na mga pamilya, mahusay na pagkakagawa, at pamana na ayaw makalimutan.",
    },
  },
  {
    key: 'tsinelas',
    title: { en: 'The Slipper Capital', fil: 'Kabisera ng Tsinelas' },
    text: {
      en: "Liliw is proudly known as the Slipper Capital of the Philippines! Our talented artisans handcraft thousands of beautiful tsinelas every day — a living tradition passed down through generations.",
      fil: "Ipinagmamalaki ng Liliw ang pagiging Kabisera ng Tsinelas ng Pilipinas! Ang aming mga bihasang manggagawa ay gumgawa ng libu-libong magagandang tsinelas sa bawat araw — isang buhay na tradisyong ipinasa sa bawat henerasyon.",
    },
  },
];

interface Props { defaultKey?: string; }

export default function GatTayaw({ defaultKey }: Props) {
  // When defaultKey is provided, lock to that narration only
  const locked = !!defaultKey;
  const startIdx = defaultKey
    ? Math.max(0, NARRATIONS.findIndex(n => n.key === defaultKey))
    : 0;

  const [lang, setLang]       = useState<Lang>('en');
  const [idx]                 = useState(startIdx);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]     = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const narration = NARRATIONS[idx];
  const audioSrc  = narration.key === 'welcome'
    ? `/audio/welcome.mp3`
    : `/audio/${narration.key}-${lang}.mp3`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    audio.load();
  }, [audioSrc]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        // Autoplay blocked
      }
    }
  }, [playing]);

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !muted;
    setMuted(m => !m);
  };

  return (
    <>
      <style>{`
        /* ── Rigged mascot: layers pivot at their joints ──
           Idle = gentle breathing + head sway + arm drift.
           Speaking = livelier nod + arm gestures. */
        @keyframes gatBreath {
          0%, 100% { transform: scaleY(1)     scaleX(1); }
          50%       { transform: scaleY(1.013) scaleX(0.994); }
        }
        @keyframes gatBreathFast {
          0%, 100% { transform: scaleY(1)     scaleX(1); }
          50%       { transform: scaleY(1.02)  scaleX(0.99); }
        }
        @keyframes gatHeadIdle {
          0%, 100% { transform: rotate(0deg); }
          30%       { transform: rotate(-1.6deg); }
          65%       { transform: rotate(1.1deg); }
        }
        @keyframes gatHeadTalk {
          0%, 100% { transform: rotate(-1.5deg); }
          25%       { transform: rotate(1.8deg); }
          50%       { transform: rotate(-0.8deg); }
          75%       { transform: rotate(2.4deg); }
        }
        @keyframes gatArmFreeIdle {
          0%, 100% { transform: rotate(0deg); }
          50%       { transform: rotate(3.2deg); }
        }
        @keyframes gatArmFreeTalk {
          0%, 100% { transform: rotate(-3deg); }
          40%       { transform: rotate(7deg); }
          70%       { transform: rotate(1deg); }
        }
        @keyframes gatArmStaffIdle {
          0%, 100% { transform: rotate(0deg); }
          50%       { transform: rotate(1.6deg); }
        }
        @keyframes gatArmStaffTalk {
          0%, 100% { transform: rotate(-2deg); }
          45%       { transform: rotate(3.5deg); }
        }
        @keyframes gatSwayIdle {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }

        .gat-rig       { position: relative; user-select: none; will-change: transform; }
        .gat-layer     { position: absolute; inset: 0; width: 100%; height: 100%; }
        .gat-layer img { width: 100%; height: 100%; display: block; }
        /* head holds two stacked faces (closed + open mouth) */
        .gat-head img  { position: absolute; inset: 0; }
        .gat-mouth     { opacity: 0; }

        /* Mouth flap while narrating — irregular cadence reads as speech, not a metronome */
        @keyframes gatMouthFlap {
          0%, 7%    { opacity: 0; }
          8%, 20%   { opacity: 1; }
          21%, 29%  { opacity: 0; }
          30%, 44%  { opacity: 1; }
          45%, 51%  { opacity: 0; }
          52%, 67%  { opacity: 1; }
          68%, 77%  { opacity: 0; }
          78%, 90%  { opacity: 1; }
          91%, 100% { opacity: 0; }
        }
        .gat-talking .gat-mouth { animation: gatMouthFlap 1.35s steps(1, end) infinite; }

        .gat-sway  { animation: gatSwayIdle 4.2s ease-in-out infinite; }
        .gat-body  { transform-origin: 50% 100%;        animation: gatBreath 4.2s ease-in-out infinite; }
        .gat-head  { transform-origin: 52.75% 28.68%;   animation: gatHeadIdle 6.5s ease-in-out infinite; }
        .gat-armF  { transform-origin: 67.66% 40.29%;   animation: gatArmFreeIdle 4.2s ease-in-out infinite; }
        .gat-armS  { transform-origin: 29.20% 38.83%;   animation: gatArmStaffIdle 4.2s ease-in-out infinite; }

        .gat-talking .gat-sway { animation: none; }
        .gat-talking .gat-body { animation: gatBreathFast 2.2s ease-in-out infinite; }
        .gat-talking .gat-head { animation: gatHeadTalk 1.9s ease-in-out infinite; }
        .gat-talking .gat-armF { animation: gatArmFreeTalk 1.6s ease-in-out infinite; }
        .gat-talking .gat-armS { animation: gatArmStaffTalk 1.75s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .gat-sway, .gat-body, .gat-head, .gat-armF, .gat-armS { animation: none !important; }
        }

        @keyframes bubbleFade {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .bubble-fade { animation: bubbleFade 0.35s ease-out forwards; }

        @keyframes speakerPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .speaker-pulse { animation: speakerPulse 0.9s ease-in-out infinite; }
      `}</style>

      <div className="w-full mb-6">

        {/* ── Character (rigged layers, centered) ── */}
        <div className="flex justify-center mb-0">
          <div
            className={`gat-sway ${playing ? 'gat-talking' : ''}`}
            style={{ filter: 'drop-shadow(0 10px 22px rgba(11,61,145,0.3))' }}
          >
            {/* aspect ratio matches the 1274×1911 source art */}
            <div className="gat-rig" style={{ width: 178, height: 178 * (1911 / 1274) }}>
              {/* eslint-disable @next/next/no-img-element */}
              <div className="gat-layer gat-armF"><img src="/images/gat/arm-free.png"  alt="" aria-hidden /></div>
              <div className="gat-layer gat-body"><img src="/images/gat/body.png"      alt="Gat Tayaw" /></div>
              <div className="gat-layer gat-armS"><img src="/images/gat/arm-staff.png" alt="" aria-hidden /></div>
              <div className="gat-layer gat-head">
                <img src="/images/gat/head.png" alt="" aria-hidden />
                <img src="/images/gat/head-speaking.png" className="gat-mouth" alt="" aria-hidden />
              </div>
              {/* eslint-enable @next/next/no-img-element */}
            </div>
          </div>
        </div>

        {/* ── Triangle tail pointing up from bubble ── */}
        <div className="flex justify-center" style={{ marginBottom: -1, zIndex: 1, position: 'relative' }}>
          <div style={{
            width: 0, height: 0,
            borderLeft:   '13px solid transparent',
            borderRight:  '13px solid transparent',
            borderBottom: '16px solid #F5C518',
          }} />
        </div>
        <div className="flex justify-center" style={{ marginTop: -14, marginBottom: -1, zIndex: 2, position: 'relative' }}>
          <div style={{
            width: 0, height: 0,
            borderLeft:   '11px solid transparent',
            borderRight:  '11px solid transparent',
            borderBottom: '14px solid #0B3D91',
          }} />
        </div>

        {/* ── Speech bubble ── */}
        <div
          key={`${idx}-${lang}`}
          className="bubble-fade rounded-2xl border-2 shadow-2xl overflow-hidden"
          style={{ borderColor: '#F5C518', background: 'linear-gradient(150deg, #0B3D91 0%, #1565C0 100%)' }}
        >
          {/* Top bar: title + EN/FIL */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(245,197,24,0.3)' }}>
            <span className="text-sm font-bold uppercase tracking-wide"
              style={{ color: '#F5C518', fontFamily: HL }}>
              {narration.title[lang]}
            </span>

            {/* EN / FIL toggle */}
            <div className="flex items-center gap-0.5 rounded-full p-0.5 shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              {(['en', 'fil'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: lang === l ? '#F5C518' : 'transparent',
                    color:           lang === l ? '#0B3D91' : 'rgba(255,255,255,0.6)',
                    fontFamily: HL,
                  }}>
                  {l === 'en' ? 'EN' : 'FIL'}
                </button>
              ))}
            </div>
          </div>

          {/* Narration text */}
          <div className="px-5 py-4">
            <p className="text-white text-sm leading-relaxed"
              style={{ fontFamily: BL, textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
              &ldquo;{narration.text[lang]}&rdquo;
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 px-5 pb-5">
            <button onClick={toggle} aria-label={playing ? 'Pause narration' : 'Play narration'}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
              {playing
                ? <Pause className="w-4 h-4" />
                : <Play  className="w-4 h-4" />}
              {playing ? 'Pause' : 'Listen'}
            </button>

            <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
              className="text-white/50 hover:text-white transition-colors">
              {muted
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className={`w-4 h-4 ${playing ? 'speaker-pulse' : ''}`} />}
            </button>

            {/* Dot indicator (single dot when locked, shows which narration otherwise) */}
            {!locked && (
              <div className="flex items-center gap-1 ml-auto">
                {NARRATIONS.map((_, i) => (
                  <div key={i} className="rounded-full"
                    style={{
                      width:  i === idx ? 16 : 6,
                      height: 6,
                      backgroundColor: i === idx ? '#F5C518' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s',
                    }} />
                ))}
              </div>
            )}
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={() => setPlaying(false)}
          preload="none"
        />
      </div>
    </>
  );
}
