'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  defaultTab?: 'login' | 'register';
  onClose: () => void;
}

type View = 'login' | 'register' | 'forgot' | 'otp' | 'newpass' | 'done';

export default function AuthModal({ defaultTab = 'login', onClose }: Props) {
  const { login, register } = useAuth();
  const [view, setView]      = useState<View>(defaultTab);
  const [showPw, setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');

  // Login / Register fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [regPw, setRegPw]           = useState('');

  // Forgot-password fields
  const [fpEmail, setFpEmail]   = useState('');
  const [otp, setOtp]           = useState('');
  const [newPw, setNewPw]       = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const reset = (to: View) => { setError(''); setView(to); };

  /* ── handlers ── */

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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code'); return; }
      reset('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    reset('newpass');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      reset('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── header text ── */
  const headerTitle: Record<View, string> = {
    login: 'Welcome back',
    register: 'Create account',
    forgot: 'Reset password',
    otp: 'Check your email',
    newpass: 'New password',
    done: 'All done!',
  };
  const headerSub: Record<View, string> = {
    login: 'Sign in to your Liliw account',
    register: 'Join the Liliw community',
    forgot: 'Enter your email to receive a reset code',
    otp: `We sent a 6-digit code to ${fpEmail}`,
    newpass: 'Choose a new password',
    done: 'Your password has been updated',
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
            {(view === 'forgot' || view === 'otp' || view === 'newpass') && (
              <button onClick={() => reset(view === 'forgot' ? 'login' : view === 'otp' ? 'forgot' : 'otp')}
                className="absolute top-4 left-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: '#00BFB3' }}>L</div>
            <h2 className="text-xl font-bold text-white">{headerTitle[view]}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{headerSub[view]}</p>
          </div>

          {/* Tabs — only on login/register */}
          {(view === 'login' || view === 'register') && (
            <div className="flex border-b border-gray-100">
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => reset(t)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    view === t ? 'border-b-2 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={view === t ? { borderColor: '#00BFB3' } : {}}>
                  {t === 'login' ? 'Log In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          <div className="p-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* ── Login ── */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email or Username</label>
                  <input required value={identifier} onChange={e => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600">Password</label>
                    <button type="button" onClick={() => reset('forgot')}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium transition">
                      Forgot password?
                    </button>
                  </div>
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
            )}

            {/* ── Register ── */}
            {view === 'register' && (
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

            {/* ── Forgot — enter email ── */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition"
                      placeholder="you@email.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
                </button>
                <p className="text-center text-xs text-gray-400 pt-1">
                  Remembered it?{' '}
                  <button type="button" onClick={() => reset('login')} className="text-teal-600 font-medium hover:underline">
                    Back to login
                  </button>
                </p>
              </form>
            )}

            {/* ── OTP — enter code ── */}
            {view === 'otp' && (
              <form onSubmit={handleOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">6-digit code</label>
                  <input
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.35em] focus:outline-none focus:border-teal-400 transition"
                    placeholder="000000"
                  />
                </div>
                <button type="submit" disabled={otp.length !== 6}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  Verify Code
                </button>
                <p className="text-center text-xs text-gray-400 pt-1">
                  Didn't receive it?{' '}
                  <button type="button" onClick={() => { setOtp(''); reset('forgot'); }}
                    className="text-teal-600 font-medium hover:underline">
                    Resend
                  </button>
                </p>
              </form>
            )}

            {/* ── New password ── */}
            {view === 'newpass' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New password</label>
                  <div className="relative">
                    <input required value={newPw} onChange={e => setNewPw(e.target.value)}
                      type={showNewPw ? 'text' : 'password'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition pr-11"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set New Password'}
                </button>
              </form>
            )}

            {/* ── Done ── */}
            {view === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#e0fdf4' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#00BFB3' }} />
                </div>
                <p className="text-gray-600 text-sm mb-5">Your password has been updated. You can now log in with your new password.</p>
                <button onClick={() => reset('login')}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}>
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
