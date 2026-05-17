'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

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

export default function GatTayaw() {
  const [lang, setLang]       = useState<Lang>('en');
  const [idx, setIdx]         = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]     = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const narration = NARRATIONS[idx];
  const audioSrc  = `/audio/${narration.key}-${lang}.mp3`;

  // Stop playback when track or language changes
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
        // Autoplay blocked — silently ignore
      }
    }
  }, [playing]);

  const prev = () => setIdx(i => (i - 1 + NARRATIONS.length) % NARRATIONS.length);
  const next = () => setIdx(i => (i + 1) % NARRATIONS.length);

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !muted;
    setMuted(m => !m);
  };

  return (
    <>
      <style>{`
        @keyframes gatFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(1deg); }
        }
        .gat-float { animation: gatFloat 4s ease-in-out infinite; will-change: transform; }

        @keyframes bubbleFade {
          from { opacity: 0; transform: translateX(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        .bubble-fade { animation: bubbleFade 0.3s ease-out forwards; }

        @keyframes speakerPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .speaker-pulse { animation: speakerPulse 1s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-3xl mx-auto mb-10 px-2">
        {/* Layout: illustration left, bubble right */}
        <div className="flex items-end gap-0 sm:gap-1">

          {/* ── Gat Tayaw illustration ── */}
          <div className="relative shrink-0 gat-float select-none"
            style={{ width: 110, height: 155, filter: 'drop-shadow(0 8px 18px rgba(11,61,145,0.25))' }}>
            <Image
              src="/images/gat-tayaw.png"
              alt="Gat Tayaw, narrator of Liliw's stories"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* ── Triangle tail pointing left ── */}
          <div className="self-center mb-6 shrink-0" style={{
            width: 0, height: 0,
            borderTop:    '11px solid transparent',
            borderBottom: '11px solid transparent',
            borderRight:  '14px solid #F5C518',
            marginRight: -1,
            zIndex: 1,
          }} />
          <div className="self-center mb-6 shrink-0" style={{
            width: 0, height: 0,
            borderTop:    '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderRight:  '12px solid #0B3D91',
            marginRight: -1,
            zIndex: 2,
            marginLeft: -13,
          }} />

          {/* ── Speech bubble ── */}
          <div key={`${idx}-${lang}`} className="bubble-fade flex-1 rounded-2xl border-2 shadow-xl overflow-hidden"
            style={{ borderColor: '#F5C518', background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: 'rgba(245,197,24,0.25)' }}>

              {/* Prev / title / Next */}
              <div className="flex items-center gap-1.5 min-w-0">
                <button onClick={prev} aria-label="Previous narration"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wide truncate"
                  style={{ color: '#F5C518', fontFamily: HL }}>
                  {narration.title[lang]}
                </span>
                <button onClick={next} aria-label="Next narration"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* EN / FIL toggle */}
              <div className="flex items-center gap-0.5 rounded-full p-0.5 shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                {(['en', 'fil'] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold transition-all"
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
            <div className="px-4 py-3">
              <p className="text-white text-sm leading-relaxed"
                style={{ fontFamily: BL, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                &ldquo;{narration.text[lang]}&rdquo;
              </p>
            </div>

            {/* Bottom controls */}
            <div className="flex items-center gap-3 px-4 pb-4">
              {/* Play / Pause */}
              <button onClick={toggle} aria-label={playing ? 'Pause narration' : 'Play narration'}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95 hover:brightness-110"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                {playing
                  ? <Pause className="w-3.5 h-3.5" />
                  : <Play  className="w-3.5 h-3.5" />}
                {playing ? 'Pause' : 'Listen'}
              </button>

              {/* Mute toggle */}
              <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
                className="text-white/50 hover:text-white transition-colors">
                {muted
                  ? <VolumeX className={`w-4 h-4`} />
                  : <Volume2 className={`w-4 h-4 ${playing ? 'speaker-pulse' : ''}`} />}
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1 ml-auto">
                {NARRATIONS.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} aria-label={`Go to narration ${i + 1}`}
                    className="rounded-full transition-all"
                    style={{
                      width:  i === idx ? 16 : 6,
                      height: 6,
                      backgroundColor: i === idx ? '#F5C518' : 'rgba(255,255,255,0.3)',
                    }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
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
