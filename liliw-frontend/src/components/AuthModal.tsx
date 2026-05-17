'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle,
  ShieldCheck, RefreshCw, MapPin, User, Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  defaultTab?: 'login' | 'register';
  onClose: () => void;
  message?: string;
}

type View = 'login' | 'register' | 'forgot' | 'otp' | 'newpass' | 'done' | 'reg-otp';

/* ── Canvas CAPTCHA ── */
const CAPTCHA_CHARS  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAPTCHA_COLORS = ['#1565C0', '#0B3D91', '#00695C', '#6A1B9A', '#1B5E20', '#B71C1C'];
const COOLDOWN_MS    = 10_000;

function generateCode(): string {
  return Array.from({ length: 5 }, () =>
    CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  ).join('');
}

function CaptchaCanvas({ code }: { code: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#EFF6FF');
    grad.addColorStop(1, '#DBEAFE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${80 + Math.random() * 80|0},${80 + Math.random() * 80|0},${120 + Math.random() * 100|0},0.3)`;
      ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.bezierCurveTo(Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(60,80,180,0.15)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const cw = W / code.length;
    code.split('').forEach((ch, i) => {
      const x = cw * i + cw / 2;
      const y = H / 2 + (Math.random() - 0.5) * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.font = `bold ${23 + Math.random() * 7}px system-ui,sans-serif`;
      ctx.fillStyle = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, [code]);

  return (
    <canvas ref={ref} width={185} height={52}
      className="rounded-lg border border-blue-100 select-none"
      style={{ userSelect: 'none', pointerEvents: 'none' }} />
  );
}

/* ── Location options ── */
const USER_TYPE_OPTIONS = [
  { value: 'liliw_local',   label: 'Liliw Resident' },
  { value: 'laguna',        label: 'From Laguna Province' },
  { value: 'provincial',    label: 'From Another Province' },
  { value: 'international', label: 'International / Tourist' },
];

/* ── Password strength ── */
function pwStrength(pw: string) {
  if (pw.length >= 10 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 3;
  if (pw.length >= 8) return 2;
  if (pw.length >= 6) return 1;
  return 0;
}
const STRENGTH_COLOR = ['#EF4444', '#EF4444', '#F59E0B', '#10B981'];
const STRENGTH_LABEL = ['', 'Weak — at least 6 characters required', 'Medium — add numbers & uppercase', 'Strong password'];

/* ── Shared input wrapper ── */
function Field({ icon: Icon, children }: { icon: (p: { className: string }) => React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <div className="[&>input]:pl-10 [&>select]:pl-10">{children}</div>
    </div>
  );
}

const INPUT_CLS = 'w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#00BFB3] focus:ring-1 focus:ring-[#00BFB3]/20 transition bg-white';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide';

export default function AuthModal({ defaultTab = 'login', onClose, message }: Props) {
  const { login, loginWithJwt } = useAuth();

  const [view, setView]      = useState<View>(defaultTab);
  const [showPw, setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');

  /* ── Login ── */
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');

  /* ── Register ── */
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [regPw,    setRegPw]    = useState('');
  const [userType, setUserType] = useState('');

  /* ── CAPTCHA state ── */
  const [captchaCode,  setCaptchaCode]  = useState(generateCode);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaOk,    setCaptchaOk]    = useState(false);
  const [captchaWrong, setCaptchaWrong] = useState(false);
  const [cooldownSec,  setCooldownSec]  = useState(0);
  const cooldownEndRef = useRef(0);

  /* ── Registration OTP ── */
  const [regOtp, setRegOtp] = useState('');

  /* ── Forgot-password ── */
  const [fpEmail,   setFpEmail]   = useState('');
  const [otp,       setOtp]       = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const reset = (to: View) => { setError(''); setView(to); };

  /* ── Cooldown ticker ── */
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setTimeout(() => setCooldownSec(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldownSec]);

  /* ── CAPTCHA helpers ── */
  const doRefresh = useCallback((withCooldown = true) => {
    setCaptchaCode(generateCode());
    setCaptchaInput('');
    setCaptchaOk(false);
    setCaptchaWrong(false);
    if (withCooldown) {
      cooldownEndRef.current = Date.now() + COOLDOWN_MS;
      setCooldownSec(Math.ceil(COOLDOWN_MS / 1000));
    }
  }, []);

  const handleCaptchaInput = useCallback((val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setCaptchaInput(cleaned);
    if (!cleaned) {
      setCaptchaOk(false); setCaptchaWrong(false);
    } else if (cleaned === captchaCode) {
      setCaptchaOk(true); setCaptchaWrong(false);
    } else if (cleaned.length === captchaCode.length) {
      setCaptchaOk(false); setCaptchaWrong(true);
      // auto-refresh after short delay if cooldown allows
      setTimeout(() => {
        if (Date.now() < cooldownEndRef.current) return;
        doRefresh(true);
      }, 800);
    } else {
      setCaptchaOk(false); setCaptchaWrong(false);
    }
  }, [captchaCode, doRefresh]);

  const refreshCaptcha = () => {
    if (Date.now() < cooldownEndRef.current) return;
    doRefresh(true);
  };

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!captchaOk)     { setError('Please complete the security check'); return; }
    if (!userType)       { setError('Please select where you are from'); return; }
    if (regPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-reg-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code'); return; }
      setRegOtp(''); reset('reg-otp');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regOtp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reg-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: regOtp, fullName, password: regPw, userType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); return; }
      loginWithJwt(data.jwt, data.user);
      onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResendRegOtp = async () => {
    setError(''); setLoading(true);
    try {
      await fetch('/api/auth/send-reg-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code'); return; }
      reset('otp');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    reset('newpass');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (newPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      reset('done');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ── Header copy ── */
  const TITLE: Record<View, string> = {
    login: 'Welcome back', register: 'Create account', forgot: 'Reset password',
    otp: 'Check your email', newpass: 'New password', done: 'All done!', 'reg-otp': 'Verify your email',
  };
  const SUB: Record<View, string> = {
    login: 'Sign in to your Liliw account', register: 'Join the Liliw community',
    forgot: 'Enter your email to get a reset code', otp: `Code sent to ${fpEmail}`,
    newpass: 'Choose a new password', done: 'Password updated', 'reg-otp': `Code sent to ${email}`,
  };

  const btnStyle = { background: 'linear-gradient(135deg,#00BFB3,#0097A7)', boxShadow: '0 4px 18px rgba(0,191,179,.3)' };
  const canSubmit = captchaOk && !!userType;
  const strength  = pwStrength(regPw);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[95vh] overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}>

          {/* ── Header ── */}
          <div style={{ background: 'linear-gradient(150deg,#0F1F3C 0%,#1a3a5c 100%)' }}
            className="px-6 pt-7 pb-6 relative overflow-hidden">
            {/* subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 28px)' }} />

            <button onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition z-10">
              <X className="w-4 h-4" />
            </button>

            {(view === 'forgot' || view === 'otp' || view === 'newpass' || view === 'reg-otp') && (
              <button onClick={() => reset(
                view === 'forgot' ? 'login' : view === 'otp' ? 'forgot' : view === 'newpass' ? 'otp' : 'register'
              )} className="absolute top-4 left-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition z-10">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl mb-4"
                style={{ background: 'linear-gradient(135deg,#00BFB3,#0097A7)', color: '#fff', boxShadow: '0 4px 14px rgba(0,191,179,.4)' }}>L</div>
              <h2 className="text-xl font-bold text-white tracking-tight">{TITLE[view]}</h2>
              <p className="text-white/50 text-sm mt-0.5">{SUB[view]}</p>
            </div>
          </div>

          {/* ── Context message ── */}
          {message && (view === 'login' || view === 'register') && (
            <div className="px-5 pt-4 pb-0">
              <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200">
                {message}
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          {(view === 'login' || view === 'register') && (
            <div className="flex mx-5 mt-4 bg-gray-100 rounded-2xl p-1 gap-1">
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => reset(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    view === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t === 'login' ? 'Log In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          <div className="p-5 space-y-0">
            {error && (
              <div className="mb-4 mt-1 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✕</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Login ── */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 mt-2">
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <Field icon={Mail}>
                    <input required value={identifier} onChange={e => setIdentifier(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" autoComplete="email" />
                  </Field>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={LABEL_CLS} style={{ margin: 0 }}>Password</label>
                    <button type="button" onClick={() => reset('forgot')}
                      className="text-xs font-semibold text-[#00BFB3] hover:text-[#0097A7] transition">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input required value={password} onChange={e => setPassword(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-11`} placeholder="••••••••" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                </button>
              </form>
            )}

            {/* ── Register ── */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5 mt-2">
                {/* Full Name */}
                <div>
                  <label className={LABEL_CLS}>Full Name</label>
                  <Field icon={User}>
                    <input required value={fullName} onChange={e => setFullName(e.target.value)}
                      className={INPUT_CLS} placeholder="Juan dela Cruz" autoComplete="name" />
                  </Field>
                </div>
                {/* Email */}
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <Field icon={Mail}>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" autoComplete="email" />
                  </Field>
                </div>
                {/* Password */}
                <div>
                  <label className={LABEL_CLS}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input required value={regPw} onChange={e => setRegPw(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-11`} placeholder="Min. 6 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPw.length > 0 && (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{ backgroundColor: i <= strength ? STRENGTH_COLOR[strength] : '#E5E7EB' }} />
                        ))}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</p>
                    </div>
                  )}
                </div>
                {/* Location */}
                <div>
                  <label className={LABEL_CLS}>Where are you from?</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                    <select required value={userType} onChange={e => setUserType(e.target.value)}
                      className={`${INPUT_CLS} appearance-none cursor-pointer`}>
                      <option value="">Select your location…</option>
                      {USER_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CAPTCHA */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Human Verification</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2.5">Type the 5 characters shown in the image</p>

                  <div className="flex items-center gap-2 mb-2.5">
                    <CaptchaCanvas code={captchaCode} />
                    <button type="button" onClick={refreshCaptcha} disabled={cooldownSec > 0}
                      title={cooldownSec > 0 ? `Wait ${cooldownSec}s` : 'New code'}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[40px]">
                      <RefreshCw className={`w-3.5 h-3.5 ${cooldownSec > 0 ? '' : 'hover:rotate-180 transition-transform duration-300'}`} />
                      {cooldownSec > 0 && <span className="text-[9px] font-bold mt-0.5 text-gray-400">{cooldownSec}s</span>}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text" value={captchaInput}
                      onChange={e => handleCaptchaInput(e.target.value)}
                      maxLength={5} autoComplete="off" autoCorrect="off"
                      autoCapitalize="characters" spellCheck={false}
                      placeholder="Enter code"
                      className={`flex-1 text-center rounded-xl border px-3 py-2 text-sm font-bold tracking-[0.2em] focus:outline-none transition uppercase ${
                        captchaOk    ? 'border-green-400 bg-green-50 text-green-700 focus:border-green-400'
                        : captchaWrong ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-300'
                        : 'border-gray-200 bg-white focus:border-[#00BFB3]'
                      }`}
                    />
                    {captchaOk && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                  </div>
                  {captchaWrong && !captchaOk && (
                    <p className="text-xs text-red-500 mt-1.5">Incorrect — a new code is loading…</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !canSubmit} style={canSubmit ? btnStyle : undefined}
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition ${
                    !canSubmit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'disabled:opacity-60'
                  }`}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                </button>
                <p className="text-center text-xs text-gray-400 pb-1">
                  A 6-digit code will be sent to verify your email.
                </p>
              </form>
            )}

            {/* ── Registration OTP ── */}
            {view === 'reg-otp' && (
              <form onSubmit={handleRegOtp} className="space-y-4 mt-2">
                <div className="flex items-center gap-3 p-3.5 bg-teal-50 rounded-2xl border border-teal-100">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-700">Verification code sent!</p>
                    <p className="text-xs text-teal-600 truncate">{email}</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>6-digit verification code</label>
                  <input required value={regOtp}
                    onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric" autoComplete="one-time-code"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-[#00BFB3] focus:ring-1 focus:ring-[#00BFB3]/20 transition"
                    placeholder="000000" />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Expires in 10 min · Check spam if not received</p>
                </div>
                <button type="submit" disabled={loading || regOtp.length !== 6} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Create Account</>}
                </button>
                <p className="text-center text-xs text-gray-400 pb-1">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={handleResendRegOtp} disabled={loading}
                    className="text-[#00BFB3] font-semibold hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot ── */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4 mt-2">
                <div>
                  <label className={LABEL_CLS}>Your email address</label>
                  <Field icon={Mail}>
                    <input required type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" />
                  </Field>
                </div>
                <button type="submit" disabled={loading} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
                </button>
                <p className="text-center text-xs text-gray-400 pb-1">
                  Remember it?{' '}
                  <button type="button" onClick={() => reset('login')}
                    className="text-[#00BFB3] font-semibold hover:underline">Back to login</button>
                </p>
              </form>
            )}

            {/* ── Forgot OTP ── */}
            {view === 'otp' && (
              <form onSubmit={handleOtp} className="space-y-4 mt-2">
                <div>
                  <label className={LABEL_CLS}>6-digit code</label>
                  <input required value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-[#00BFB3] transition"
                    placeholder="000000" />
                </div>
                <button type="submit" disabled={otp.length !== 6} style={btnStyle}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  Verify Code
                </button>
                <p className="text-center text-xs text-gray-400 pb-1">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={() => { setOtp(''); reset('forgot'); }}
                    className="text-[#00BFB3] font-semibold hover:underline">Resend</button>
                </p>
              </form>
            )}

            {/* ── New password ── */}
            {view === 'newpass' && (
              <form onSubmit={handleReset} className="space-y-4 mt-2">
                <div>
                  <label className={LABEL_CLS}>New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input required value={newPw} onChange={e => setNewPw(e.target.value)}
                      type={showNewPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-11`} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
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
              <div className="text-center py-6 mt-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg,#e0fdf4,#ccfbf1)' }}>
                  <CheckCircle className="w-8 h-8 text-[#00BFB3]" />
                </div>
                <p className="text-gray-600 text-sm mb-6">Password updated. You can now log in with your new password.</p>
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
