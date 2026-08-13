'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, X, Loader, MapPin, Star, Utensils, Landmark, MessageSquarePlus, Eye } from 'lucide-react';
import LilioAvatar from '@/components/LilioAvatar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import type { ChatMessage } from '@/lib/types';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface AttractionCard {
  id: string;
  name: string;
  type: 'heritage' | 'spot' | 'dining';
  location?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
  url: string;
}

interface Message extends ChatMessage {
  sender: 'user' | 'bot';
  attractions?: AttractionCard[];
}

const TYPE_META: Record<string, { label: string; color: string; Icon: any }> = {
  heritage: { label: 'Heritage', color: '#8B5CF6', Icon: Landmark },
  spot:     { label: 'Attraction', color: '#1565C0', Icon: MapPin },
  dining:   { label: 'Dining',  color: '#F97316', Icon: Utensils },
};

/**
 * Openers for someone facing an empty box.
 *
 * Chosen to match what the town is actually known for and what the chat can
 * answer from the CMS — slippers, the church, food, the festival — rather than
 * generic prompts that would send Lilio hunting for content nobody has written.
 */
const QUICK_ASKS: { label: string; ask: string }[] = [
  { label: '🥿 Tsinelas shopping', ask: 'Where can I buy tsinelas in Liliw?' },
  { label: '🍽️ Where to eat',      ask: 'Where should I eat in Liliw?' },
  { label: '⛪ Heritage sites',     ask: 'What heritage sites should I visit in Liliw?' },
  { label: '🎉 Festivals',          ask: 'What festivals and events happen in Liliw?' },
  { label: '🚗 Getting here',       ask: 'How do I get to Liliw from Manila?' },
];

/**
 * Reads the page the visitor is on, so Lilio can answer about what is in front
 * of them rather than about Liliw in general.
 *
 * Takes the main content where a page marks one, because otherwise the nav,
 * the footer and the chat's own transcript come along and the useful part is
 * buried. Everything is collapsed to plain text — the model gains nothing from
 * markup, and it would eat the budget.
 */
function readPage(): { title: string; path: string; text: string } {
  const main = document.querySelector('main') ?? document.body;

  const clone = main.cloneNode(true) as HTMLElement;
  // Strip what is furniture rather than content, plus the chat itself: without
  // this the assistant reads its own replies back and answers those.
  clone.querySelectorAll('script, style, nav, footer, [data-lilio-chat]').forEach(n => n.remove());

  const text = (clone.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);

  const heading = document.querySelector('h1')?.textContent?.trim();

  return {
    title: heading || document.title || 'Liliw Tourism',
    path: window.location.pathname,
    text,
  };
}

const getRandomGreeting = () => {
  const greetings = [
    'Kumusta! Welcome to Liliw! I\'m Lilio, your tour guide. What brings you to our wonderful town?',
    'Hey there! I\'m Lilio, and I\'m here to help you explore Liliw! What would you like to know?',
    'Magandang araw! Welcome to Liliw, Laguna! I\'m Lilio. Excited to show you around?',
    'Hi! I\'m Lilio, your Liliw guide. What interests you most — our heritage, shopping, food, or something else?',
    'Welcome to Liliw! I\'m Lilio. Been here many times? I\'d love to help you discover our gems!',
    'Hello, travel friend! I\'m Lilio, your Liliw companion. What shall we explore together?',
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

function renderBotText(text: string, onLinkClick: () => void): React.ReactNode {
  const linkRe = /\[([^\]]+)\]\((\/[^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const href = m[2];
    const label = m[1];
    nodes.push(
      <a key={m.index} href={href}
        onClick={(e) => { e.preventDefault(); onLinkClick(); window.location.href = href; }}
        className="underline font-semibold" style={{ color: '#F5C518' }}>
        {label} →
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function AttractionCards({ cards, onClose }: { cards: AttractionCard[]; onClose: () => void }) {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {cards.map((card, idx) => {
        const meta = TYPE_META[card.type] ?? TYPE_META.spot;
        const Icon = meta.Icon;
        return (
          <motion.div key={card.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
            className="shrink-0 w-36 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <Link href={card.url} onClick={onClose}>
              {/* Image */}
              <div className="h-20 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}44)` }}>
                {card.imageUrl
                  ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                  : <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-7 h-7 opacity-40" style={{ color: meta.color }} />
                    </div>
                }
                <span className="absolute top-1.5 left-1.5 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.color, fontFamily: HL, fontSize: '10px' }}>
                  {meta.label}
                </span>
              </div>
              {/* Info */}
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold leading-tight line-clamp-2 text-gray-800" style={{ fontFamily: HL }}>{card.name}</p>
                {card.location && (
                  <p className="text-gray-400 mt-0.5 flex items-center gap-0.5" style={{ fontSize: '10px', fontFamily: BL }}>
                    <MapPin className="w-2.5 h-2.5 shrink-0" />{card.location}
                  </p>
                )}
                {card.rating ? (
                  <div className="flex items-center gap-0.5 mt-1">
                    <Star className="w-2.5 h-2.5" fill="#F5C518" stroke="#F5C518" />
                    <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: BL }}>{card.rating}/5</span>
                  </div>
                ) : null}
                <div className="mt-1.5 text-center text-xs font-bold py-1 rounded-lg text-white"
                  style={{ backgroundColor: meta.color, fontFamily: HL, fontSize: '10px' }}>
                  View →
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function AIChat() {
  const pathname = usePathname();
  const isMapPage = pathname === '/map';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: getRandomGreeting(), sender: 'bot', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // localStorage rather than state: the point is that it stays dismissed on
  // the next page and the next visit. Wrapped because Safari's private mode
  // throws on access, and a greeting bubble is not worth breaking the chat for.
  const INVITE_KEY = 'liliw-lilio-invite-seen';
  const dismissInvite = () => {
    setShowInvite(false);
    try { localStorage.setItem(INVITE_KEY, '1'); } catch { /* nothing to do */ }
  };

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(INVITE_KEY) === '1'; } catch { seen = false; }
    if (seen) return;
    const t = setTimeout(() => setShowInvite(true), 4000);
    return () => clearTimeout(t);
  }, []);

  /**
   * Clears the thread back to a fresh greeting.
   *
   * The history sent to the model is built from `messages`, so emptying it
   * genuinely starts over rather than only hiding what came before — ask about
   * food, start again, and Lilio is no longer answering in the context of
   * restaurants.
   */
  const startNewChat = () => {
    setMessages([{ id: String(Date.now()), text: getRandomGreeting(), sender: 'bot', timestamp: new Date() }]);
    setInput('');
  };

  /**
   * Takes the text rather than reading the input box, so a quick-reply chip
   * and the form can both use it. Previously the send path could only be
   * driven by whatever was typed, which is why a chip could not simply ask.
   */
  const sendMessage = async (text: string, withPage = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(1).slice(-10)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant' as const, content: m.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, pageContext: withPage ? readPage() : undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.unavailable
          ? 'Chat is temporarily unavailable. Please try again later.'
          : 'Sorry, I had trouble responding. Please try again.';
        throw new Error(msg);
      }

      if (!data?.reply || typeof data.reply !== 'string') throw new Error('Invalid response');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        attractions: data.attractions ?? [],
      }]);
    } catch (error: any) {
      logger.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: error?.message || 'Sorry, I had trouble responding. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* A word from Lilio before you have opened anything.
          Shown once per browser: an invitation that reappears on every page
          load stops being an invitation and becomes something to dismiss. It
          also waits a few seconds, so it does not land on top of someone still
          reading the page they just opened. */}
      <AnimatePresence>
        {showInvite && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className={`fixed bottom-24 z-40 max-w-[15rem] ${isMapPage ? 'right-24' : 'right-6'}`}
          >
            <button
              onClick={() => { setIsOpen(true); dismissInvite(); }}
              className="relative block text-left rounded-2xl rounded-br-sm bg-white shadow-xl px-4 py-3 pr-8 border hover:shadow-2xl transition-shadow"
              style={{ borderColor: 'rgba(21,101,192,0.25)' }}
            >
              <p className="text-sm font-bold leading-snug" style={{ color: '#0B3D91', fontFamily: HL }}>
                Kumusta! I&rsquo;m Lilio 👋
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug" style={{ fontFamily: BL }}>
                Ask me anything about Liliw — where to eat, what to see, how to get around.
              </p>
            </button>
            <span
              role="button"
              tabIndex={0}
              aria-label="Dismiss"
              onClick={dismissInvite}
              onKeyDown={e => { if (e.key === 'Enter') dismissInvite(); }}
              className="absolute top-2 right-2 w-5 h-5 grid place-items-center rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <X size={12} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setIsOpen(!isOpen); dismissInvite(); }}
        // No `relative` here: `fixed` already establishes a containing block
        // for the absolutely positioned head and dot below. Adding both put
        // two position utilities on one element, and Tailwind emits `relative`
        // after `fixed`, so it won — the button stopped being pinned to the
        // viewport and rendered inline at the end of the page, out of sight.
        className={`fixed bottom-6 z-40 rounded-full text-white shadow-xl transition-shadow hover:shadow-2xl grid place-items-center ${isMapPage ? 'right-24' : 'right-6'}`}
        style={{
          width: 64, height: 64,
          background: isOpen ? 'linear-gradient(135deg, #0B3D91, #1565C0)' : '#0B1220',
          // The ring is the avatar's own edge rather than a border on the
          // button, so the head can sit right against it without a gap.
          boxShadow: isOpen
            ? '0 10px 30px -10px rgba(11,61,145,0.7)'
            : '0 0 0 3px #22C55E, 0 10px 30px -10px rgba(0,0,0,0.6)',
        }}
        title="Chat with Lilio"
        aria-label={isOpen ? 'Close chat' : 'Chat with Lilio'}
      >
        {isOpen ? <X size={24} /> : (
          <>
            {/* Slightly larger than the button so the head fills the disc the
                way a profile picture does, with the overflow clipped. */}
            <span className="absolute inset-0 rounded-full overflow-hidden grid place-items-center">
              <LilioAvatar size={62} crop="head" />
            </span>
            {/* His name rather than a status dot. A green dot claims he is
                online, which says nothing useful — he answers whenever the
                page loads. The name is what a first-time visitor actually
                needs before deciding to tap a face. Sits on the bottom edge,
                overlapping it, so it reads as a label on the avatar rather
                than a separate element. */}
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 leading-none"
              style={{
                bottom: -7,
                backgroundColor: '#22C55E',
                color: '#06281A',
                fontFamily: HL,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: '0 0 0 2.5px #0B1220',
              }}
            >
              Lilio
            </span>
          </>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            data-lilio-chat
            className={`fixed bottom-24 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isMapPage ? 'right-24' : 'right-6'}`}
            style={{ maxHeight: 600, border: '1.5px solid #1565C0', background: '#fff' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
              <div className="flex items-center gap-3">
                <LilioAvatar size={42} crop="head" />
                <div>
                  <p className="font-extrabold text-base leading-tight" style={{ fontFamily: HL }}>Lilio</p>
                  <p className="text-xs opacity-75" style={{ fontFamily: BL }}>Your Liliw Travel Guide</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Only offered once there is something to clear — on a fresh
                    thread it would do nothing visible and read as a broken
                    button. Starting over also brings the quick questions back,
                    since the thread is a greeting again. */}
                {messages.length > 1 && (
                  <button onClick={startNewChat} title="Start a new chat" aria-label="Start a new chat"
                    className="w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-white/20">
                    <MessageSquarePlus size={17} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} title="Close" aria-label="Close chat"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#F8FAFF' }}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Lilio beside what he says, so a long thread still reads as
                      a conversation with someone rather than blocks of text. */}
                  {msg.sender === 'bot' && <LilioAvatar size={26} crop="head" />}
                  <div className={`${msg.sender === 'user' ? 'max-w-[78%]' : 'max-w-[86%]'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        msg.sender === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'text-gray-800 rounded-bl-sm border border-blue-100 bg-white'
                      }`}
                      style={msg.sender === 'user' ? { background: 'linear-gradient(135deg, #0B3D91, #1565C0)' } : {}}>
                      <p className="text-sm leading-relaxed" style={{ fontFamily: BL }}>
                        {msg.sender === 'bot'
                          ? renderBotText(msg.text, () => setIsOpen(false))
                          : msg.text}
                      </p>
                      <span className={`text-xs opacity-60 block mt-1 ${msg.sender === 'user' ? 'text-right text-white' : 'text-gray-400'}`}
                        style={{ fontFamily: BL }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Attraction cards below bot bubble */}
                    {msg.sender === 'bot' && msg.attractions && msg.attractions.length > 0 && (
                      <AttractionCards cards={msg.attractions} onClose={() => setIsOpen(false)} />
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <LilioAvatar size={26} crop="head" />
                  <div className="bg-white border border-blue-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader size={16} className="animate-spin" style={{ color: '#1565C0' }} />
                    <span className="text-xs text-gray-400" style={{ fontFamily: BL }}>Lilio is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions.
                Shown only while the thread is still just the greeting: they
                exist to get someone past the blank box, and once a
                conversation is going they would be answering a question
                nobody asked. Each sends the full sentence rather than the
                short label, because the model reads the message and "Food"
                on its own is not a question. */}
            {messages.length === 1 && !loading && (
              <div className="px-4 pt-1 pb-2 flex flex-wrap gap-1.5 bg-white border-t border-blue-50">
                {QUICK_ASKS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.ask)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition hover:bg-blue-50"
                    style={{ borderColor: 'rgba(21,101,192,0.3)', color: '#1565C0', fontFamily: BL }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              className="px-4 py-3 border-t border-blue-100 bg-white flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about Liliw…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm text-gray-800 placeholder-gray-400 transition"
                style={{ fontFamily: BL }}
              />
              {/* Read this page.
                  Sends whatever the visitor is looking at along with the
                  question, so "what is this?" and "is it open?" resolve
                  against the page instead of against Liliw in general. Only
                  offered where there is something to read — the chat itself is
                  excluded, or it would summarise its own transcript. */}
              <motion.button
                type="button"
                disabled={loading}
                onClick={() => sendMessage('Tell me about this page in a sentence or two.', true)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                title="Let Lilio read this page"
                aria-label="Let Lilio read this page"
                className="w-10 h-10 flex items-center justify-center rounded-xl border transition disabled:opacity-40 hover:bg-blue-50"
                style={{ borderColor: 'rgba(21,101,192,0.3)', color: '#1565C0' }}>
                <Eye size={17} strokeWidth={2.2} />
              </motion.button>
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white shadow transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)' }}>
                <Send size={17} strokeWidth={2.5} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
