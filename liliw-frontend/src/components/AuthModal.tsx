'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle,
  ShieldCheck, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  defaultTab?: 'login' | 'register';
  onClose: () => void;
  message?: string;
}

type View = 'login' | 'register' | 'forgot' | 'otp' | 'newpass' | 'done' | 'reg-otp';

function newCaptcha() {
  const a = Math.floor(Math.random() * 10) + 3;
  const b = Math.floor(Math.random() * 9)  + 1;
  return { a, b, answer: a + b };
}

export default function AuthModal({ defaultTab = 'login', onClose, message }: Props) {
  const { login, loginWithJwt } = useAuth();

  const [view, setView]      = useState<View>(defaultTab);
  const [showPw, setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');

  /* ── Login fields ── */
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');

  /* ── Register fields ── */
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [regPw,    setRegPw]    = useState('');

  /* ── CAPTCHA ── */
  const [captcha,      setCaptcha]      = useState(newCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaOk,    setCaptchaOk]    = useState(false);
  const [captchaWrong, setCaptchaWrong] = useState(false);

  /* ── Registration OTP ── */
  const [regOtp, setRegOtp] = useState('');

  /* ── Forgot-password fields ── */
  const [fpEmail,   setFpEmail]   = useState('');
  const [otp,       setOtp]       = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const reset = (to: View) => { setError(''); setView(to); };

  /* ── CAPTCHA helpers ── */
  const handleCaptchaInput = useCallback((val: string) => {
    setCaptchaInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num === captcha.answer) {
      setCaptchaOk(true);
      setCaptchaWrong(false);
    } else if (val !== '') {
      setCaptchaOk(false);
      setCaptchaWrong(!isNaN(num) && String(Math.abs(num)).length >= String(captcha.answer).length);
    } else {
      setCaptchaOk(false);
      setCaptchaWrong(false);
    }
  }, [captcha.answer]);

  const refreshCaptcha = () => {
    setCaptcha(newCaptcha());
    setCaptchaInput('');
    setCaptchaOk(false);
    setCaptchaWrong(false);
  };

  /* ── Handlers ── */
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
    if (!captchaOk) { setError('Please complete the security check first'); return; }
    if (regPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-reg-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send verification code'); return; }
      setRegOtp('');
      reset('reg-otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regOtp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reg-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: regOtp, username, password: regPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); return; }
      loginWithJwt(data.jwt, data.user);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await fetch('/api/auth/send-reg-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setLoading(false);
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

  /* ── Header text ── */
  const headerTitle: Record<View, string> = {
    login:    'Welcome back',
    register: 'Create account',
    forgot:   'Reset password',
    otp:      'Check your email',
    newpass:  'New password',
    done:     'All done!',
    'reg-otp': 'Verify your email',
  };
  const headerSub: Record<View, string> = {
    login:    'Sign in to your Liliw account',
    register: 'Join the Liliw community',
    forgot:   'Enter your email to receive a reset code',
    otp:      `We sent a 6-digit code to ${fpEmail}`,
    newpass:  'Choose a new password',
    done:     'Your password has been updated',
    'reg-otp': `We sent a 6-digit code to ${email}`,
  };

  const btnStyle = {
    background: 'linear-gradient(135deg,#00BFB3,#009E99)',
    boxShadow: '0 6px 20px rgba(0,191,179,.35)',
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

            {(view === 'forgot' || view === 'otp' || view === 'newpass' || view === 'reg-otp') && (
              <button onClick={() => reset(
                view === 'forgot'   ? 'login'
                : view === 'otp'    ? 'forgot'
                : view === 'newpass' ? 'otp'
                : 'register'
              )}
                className="absolute top-4 left-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: '#00BFB3' }}>L</div>
            <h2 className="text-xl font-bold text-white">{headerTitle[view]}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{headerSub[view]}</p>
          </div>

          {/* Context message */}
          {message && (view === 'login' || view === 'register') && (
            <div className="px-4 pt-3 pb-0">
              <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200">
                {message}
              </div>
            </div>
          )}

          {/* Tabs */}
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
                <button type="submit" disabled={loading} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition">
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
                  {/* Password strength bar */}
                  {regPw.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map(i => {
                          const strength = regPw.length >= 10 && /[A-Z]/.test(regPw) && /[0-9]/.test(regPw) ? 3
                            : regPw.length >= 8 ? 2 : regPw.length >= 6 ? 1 : 0;
                          return (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all"
                              style={{ backgroundColor: i <= strength ? (strength === 3 ? '#10B981' : strength === 2 ? '#F59E0B' : '#EF4444') : '#E5E7EB' }} />
                          );
                        })}
                      </div>
                      <p className="text-xs" style={{
                        color: regPw.length >= 10 && /[A-Z]/.test(regPw) && /[0-9]/.test(regPw) ? '#10B981'
                          : regPw.length >= 8 ? '#F59E0B' : '#EF4444'
                      }}>
                        {regPw.length >= 10 && /[A-Z]/.test(regPw) && /[0-9]/.test(regPw) ? 'Strong password'
                          : regPw.length >= 8 ? 'Medium — add numbers & uppercase'
                          : 'Weak — at least 6 characters required'}
                      </p>
                    </div>
                  )}
                </div>

                {/* CAPTCHA */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Human Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 select-none">
                      {captcha.a} + {captcha.b} = ?
                    </div>
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={e => handleCaptchaInput(e.target.value)}
                      className={`w-16 text-center rounded-lg border px-2 py-2 text-sm font-bold focus:outline-none transition ${
                        captchaOk
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : captchaWrong
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-gray-200 bg-white focus:border-teal-400'
                      }`}
                      placeholder="?"
                      max={99}
                      min={0}
                    />
                    <button type="button" onClick={refreshCaptcha}
                      className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-gray-100 transition"
                      title="New question">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {captchaOk && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
                  {captchaWrong && !captchaOk && (
                    <p className="text-xs text-red-500 mt-1.5 pl-0.5">Incorrect — try again or click ↺ for a new question</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !captchaOk} style={captchaOk ? btnStyle : undefined}
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition ${
                    !captchaOk ? 'bg-gray-300 cursor-not-allowed opacity-60' : 'disabled:opacity-60'
                  }`}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                </button>

                <p className="text-center text-xs text-gray-400">
                  A 6-digit code will be sent to your email to verify your account.
                </p>
              </form>
            )}

            {/* ── Registration OTP ── */}
            {view === 'reg-otp' && (
              <form onSubmit={handleRegOtp} className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-700">Verification code sent!</p>
                    <p className="text-xs text-teal-600 truncate">{email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">6-digit verification code</label>
                  <input
                    required
                    value={regOtp}
                    onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.35em] focus:outline-none focus:border-teal-400 transition"
                    placeholder="000000"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Code expires in 10 minutes · Check spam if not received</p>
                </div>

                <button type="submit" disabled={loading || regOtp.length !== 6} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle className="w-4 h-4" /> Verify &amp; Create Account</>}
                </button>

                <p className="text-center text-xs text-gray-400 pt-1">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={handleResendRegOtp} disabled={loading}
                    className="text-teal-600 font-medium hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </p>
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
                <button type="submit" disabled={loading} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition">
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

            {/* ── Forgot OTP ── */}
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
                <button type="submit" disabled={otp.length !== 6} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  Verify Code
                </button>
                <p className="text-center text-xs text-gray-400 pt-1">
                  Didn&apos;t receive it?{' '}
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
                <button type="submit" disabled={loading} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition">
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
                <button onClick={() => reset('login')} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition">
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
