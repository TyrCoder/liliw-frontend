'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import { COLORS } from '@/lib/constants';
import type { ChatMessage } from '@/lib/types';

interface Message extends ChatMessage {
  sender: 'user' | 'bot';
}

// Varied opening greetings for natural conversation
const getRandomGreeting = () => {
  const greetings = [
    'Kumusta? 🌞 Welcome to Liliw! I\'m Lilio, your tour guide. What brings you to our wonderful town?',
    'Hey there! 👋 I\'m Lilio, and I\'m here to help you explore Liliw! What would you like to know?',
    'Magandang araw! 🏝️ Welcome to Liliw, Laguna! I\'m Lilio. Excited to show you around?',
    'Hi! I\'m Lilio, your Liliw guide 🌴 What interests you most - our heritage, shopping, food, or something else?',
    'Welcome to Liliw! 😊 I\'m Lilio. Been here many times? I\'d love to help you discover our gems!',
    'Hola, travel friend! 🎉 I\'m Lilio, your Liliw companion. What shall we explore together?',
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getRandomGreeting(),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.reply || typeof data.reply !== 'string') {
        throw new Error('Invalid response from chat API');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      logger.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble responding. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full text-white shadow-xl hover:shadow-2xl transition"
        style={{ backgroundColor: COLORS.primary }}
        title="Chat with Lilio"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2"
            style={{ maxHeight: '650px', borderColor: COLORS.primary }}
          >
            {/* Header - Gradient */}
            <div className="p-5 text-white bg-gradient-to-r" style={{ backgroundImage: COLORS.gradient }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xl">Lilio 🏝️</h3>
                  <p className="text-sm opacity-90">Your Liliw Travel Guide</p>
                </div>
                <div className="text-2xl">✨</div>
              </div>
              <p className="text-xs opacity-85 mt-2">Only answers about Liliw tourism & attractions</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'text-white rounded-br-none shadow-md'
                        : 'bg-white border-2 rounded-bl-none shadow-md'
                    }`}
                    style={
                      msg.sender === 'user'
                        ? { backgroundColor: COLORS.primary }
                        : { borderColor: COLORS.primary }
                    }
                  >
                    <p className="text-sm leading-relaxed text-black">{msg.text}</p>
                    <span
                      className={`text-xs opacity-70 block mt-1.5 ${
                        msg.sender === 'user' ? 'text-white text-right' : 'text-gray-600'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 rounded-lg rounded-bl-none p-4 shadow-md" style={{ borderColor: COLORS.primary }}>
                    <Loader className="animate-spin" size={20} style={{ color: COLORS.primary }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t-2 p-4" style={{ borderTopColor: COLORS.primary }}>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Liliw..."
                  className="flex-1 px-4 py-2.5 border-2 rounded-full focus:outline-none transition text-black placeholder-gray-400"
                  style={{ borderColor: COLORS.primary, '--tw-ring-color': COLORS.primary } as React.CSSProperties}
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 text-white rounded-full transition shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:scale-100"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Send size={20} strokeWidth={2.5} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
