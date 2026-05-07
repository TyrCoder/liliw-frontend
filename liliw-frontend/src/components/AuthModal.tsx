'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  defaultTab?: 'login' | 'register';
  onClose: () => void;
}

export default function AuthModal({ defaultTab = 'login', onClose }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab]       = useState<'login' | 'register'>(defaultTab);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');

  // Register fields
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [regPw, setRegPw]           = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(username, email, regPw);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#0F1F3C,#1a3a5c)' }} className="px-6 pt-6 pb-5">
            <button onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: '#00BFB3' }}>L</div>
            <h2 className="text-xl font-bold text-white">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {tab === 'login' ? 'Sign in to your Liliw account' : 'Join the Liliw community'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t ? 'border-b-2 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                style={tab === t ? { borderColor: '#00BFB3' } : {}}>
                {t === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email or Username</label>
                  <input required value={identifier} onChange={e => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input required value={password} onChange={e => setPassword(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition pr-11"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                  <input required value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                    placeholder="yourname" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input required value={regPw} onChange={e => setRegPw(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition pr-11"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
