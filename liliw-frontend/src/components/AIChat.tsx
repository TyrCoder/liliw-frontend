'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Magandang araw! 👋 I\'m Lilio, your official Liliw travel guide. Ask me anything about Liliw\'s heritage sites, attractions, tours, and local experiences!',
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

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
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
        style={{ backgroundColor: '#00BFB3' }}
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
            style={{ maxHeight: '650px', borderColor: '#00BFB3' }}
          >
            {/* Header - Gradient */}
            <div className="p-5 text-white bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
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
                        : 'bg-white border-2 rounded-bl-none shadow-sm'
                    }`}
                    style={
                      msg.sender === 'user'
                        ? { backgroundColor: '#00BFB3' }
                        : { borderColor: '#E0F7F5' }
                    }
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span
                      className={`text-xs opacity-70 block mt-1.5 ${
                        msg.sender === 'user' ? 'text-white text-right' : 'text-gray-500'
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
                  <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-4">
                    <Loader className="animate-spin" size={20} style={{ color: '#00BFB3' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t-2 p-4" style={{ borderTopColor: '#E0F7F5' }}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Liliw..."
                  className="flex-1 px-4 py-2.5 border-2 rounded-full focus:outline-none transition"
                  style={{ borderColor: '#E0F7F5', '--tw-ring-color': '#00BFB3' } as any}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-2.5 text-white rounded-full transition hover:shadow-lg active:scale-95"
                  style={{ backgroundColor: '#00BFB3' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
