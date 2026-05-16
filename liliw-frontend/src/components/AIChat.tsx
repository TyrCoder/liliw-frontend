'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, X, Loader, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import type { ChatMessage } from '@/lib/types';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface Message extends ChatMessage {
  sender: 'user' | 'bot';
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
      <a
        key={m.index}
        href={href}
        onClick={(e) => { e.preventDefault(); onLinkClick(); window.location.href = href; }}
        className="underline font-semibold"
        style={{ color: '#F5C518' }}
      >
        {label} →
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function AIChat() {
  const pathname = usePathname();
  const isMapPage = pathname === '/map';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: getRandomGreeting(), sender: 'bot', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
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
        body: JSON.stringify({ message: input, history }),
      });

      if (!response.ok) throw new Error(`Chat API error: ${response.status}`);

      const data = await response.json();
      if (!data?.reply || typeof data.reply !== 'string') throw new Error('Invalid response');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } catch (error) {
      logger.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble responding. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 z-40 rounded-full text-white shadow-xl transition-shadow hover:shadow-2xl ${isMapPage ? 'right-24' : 'right-6'}`}
        style={{ background: 'linear-gradient(135deg, #1E3A8A, #1565C0)', padding: '14px 18px' }}
        title="Chat with Lilio"
      >
        {isOpen
          ? <X size={22} />
          : <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span className="text-sm font-bold" style={{ fontFamily: HL }}>Lilio</span>
            </div>
        }
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-24 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isMapPage ? 'right-24' : 'right-6'}`}
            style={{ maxHeight: 600, border: '1.5px solid #1565C0', background: '#fff' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1565C0 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-extrabold text-base leading-tight" style={{ fontFamily: HL }}>Lilio</p>
                  <p className="text-xs opacity-75" style={{ fontFamily: BL }}>Your Liliw Travel Guide</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-white/20">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#F8FAFF' }}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender === 'user'
                        ? 'text-white rounded-br-sm'
                        : 'text-gray-800 rounded-bl-sm border border-blue-100 bg-white'
                    }`}
                    style={msg.sender === 'user'
                      ? { background: 'linear-gradient(135deg, #1E3A8A, #1565C0)' }
                      : {}}
                  >
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
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-blue-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader size={16} className="animate-spin" style={{ color: '#1565C0' }} />
                    <span className="text-xs text-gray-400" style={{ fontFamily: BL }}>Lilio is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage}
              className="px-4 py-3 border-t border-blue-100 bg-white flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about Liliw…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm text-gray-800 placeholder-gray-400 transition"
                style={{ fontFamily: BL }}
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white shadow transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #1565C0)' }}
              >
                <Send size={17} strokeWidth={2.5} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
