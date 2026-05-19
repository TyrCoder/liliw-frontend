'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle,
  ShieldCheck, RefreshCw, User, Lock, AtSign,
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
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${80 + Math.random() * 80|0},${80 + Math.random() * 80|0},${120 + Math.random() * 100|0},0.28)`;
      ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.bezierCurveTo(Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H);
      ctx.strokeStyle = 'rgba(60,80,180,0.13)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    const cw = W / code.length;
    code.split('').forEach((ch, i) => {
      const x = cw * i + cw / 2;
      const y = H / 2 + (Math.random() - 0.5) * 7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.font = `bold ${24 + Math.random() * 8}px system-ui,sans-serif`;
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
    <canvas ref={ref} width={200} height={56}
      className="rounded-xl border border-blue-100 select-none flex-1"
      style={{ userSelect: 'none', pointerEvents: 'none' }} />
  );
}

/* ── Password strength ── */
function pwStrength(pw: string) {
  if (pw.length >= 10 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 3;
  if (pw.length >= 8) return 2;
  if (pw.length >= 6) return 1;
  return 0;
}
const STRENGTH_COLOR = ['#EF4444', '#EF4444', '#F59E0B', '#10B981'];
const STRENGTH_LABEL = ['', 'Weak', 'Medium — add numbers & uppercase', 'Strong password'];

/* ── Shared styles ── */
const INPUT_CLS = 'w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10 transition';
const LABEL_CLS = 'block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2';

function InputIcon({ icon: Icon }: { icon: (p: { className: string }) => React.ReactNode }) {
  return <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />;
}

export default function AuthModal({ defaultTab = 'login', onClose, message }: Props) {
  const { login, loginWithJwt } = useAuth();

  const [view, setView]       = useState<View>(defaultTab);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');

  const [fullName,  setFullName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [regPw,     setRegPw]     = useState('');

  const [captchaCode,  setCaptchaCode]  = useState(generateCode);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaOk,    setCaptchaOk]    = useState(false);
  const [captchaWrong, setCaptchaWrong] = useState(false);
  const [cooldownSec,  setCooldownSec]  = useState(0);
  const cooldownEndRef = useRef(0);

  const [regOtp, setRegOtp] = useState('');

  const [fpEmail,   setFpEmail]   = useState('');
  const [otp,       setOtp]       = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const reset = (to: View) => { setError(''); setView(to); };

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setTimeout(() => setCooldownSec(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldownSec]);

  const doRefresh = useCallback(() => {
    setCaptchaCode(generateCode());
    setCaptchaInput('');
    setCaptchaOk(false);
    setCaptchaWrong(false);
    cooldownEndRef.current = Date.now() + COOLDOWN_MS;
    setCooldownSec(Math.ceil(COOLDOWN_MS / 1000));
  }, []);

  const handleCaptchaInput = useCallback((val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setCaptchaInput(cleaned);
    if (!cleaned) { setCaptchaOk(false); setCaptchaWrong(false); }
    else if (cleaned === captchaCode) { setCaptchaOk(true); setCaptchaWrong(false); }
    else if (cleaned.length === captchaCode.length) {
      setCaptchaOk(false); setCaptchaWrong(true);
      setTimeout(() => { if (Date.now() < cooldownEndRef.current) return; doRefresh(); }, 800);
    } else { setCaptchaOk(false); setCaptchaWrong(false); }
  }, [captchaCode, doRefresh]);

  const refreshCaptcha = () => { if (Date.now() < cooldownEndRef.current) return; doRefresh(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(identifier, password); onClose(); }
    catch (err: any) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!captchaOk)        { setError('Please complete the security check'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setError('Username must be 3–20 characters: letters, numbers, underscores only'); return; }
    if (regPw.length < 6)  { setError('Password must be at least 6 characters'); return; }
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
        body: JSON.stringify({ email, otp: regOtp, fullName, username, password: regPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); return; }
      loginWithJwt(data.jwt, data.user); onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResendRegOtp = async () => {
    setError(''); setLoading(true);
    try { await fetch('/api/auth/send-reg-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); }
    catch {} finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) });
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
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, otp, newPassword: newPw }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      reset('done');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const TITLE: Record<View, string> = {
    login: 'Welcome Back', register: 'Create Account',
    forgot: 'Reset Password', otp: 'Check Your Email',
    newpass: 'New Password', done: 'All Done!', 'reg-otp': 'Verify Email',
  };
  const SUB: Record<View, string> = {
    login: 'Sign in to your Liliw Tourism account',
    register: 'Join the Liliw Tourism community',
    forgot: 'Enter your email to receive a reset code',
    otp: `We sent a code to ${fpEmail}`,
    newpass: 'Choose a strong new password',
    done: 'Your password has been updated',
    'reg-otp': `Verification code sent to ${email}`,
  };

  const primaryBtn = {
    background: 'linear-gradient(135deg,#1565C0,#0B3D91)',
    boxShadow: '0 6px 24px rgba(21,101,192,.35)',
  };
  const canSubmit = captchaOk;
  const strength  = pwStrength(regPw);

  const isSubView = view === 'forgot' || view === 'otp' || view === 'newpass' || view === 'reg-otp';
  const backView: Partial<Record<View, View>> = { forgot: 'login', otp: 'forgot', newpass: 'otp', 'reg-otp': 'register' };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="relative z-10 bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.28)] w-full max-w-md max-h-[92vh] overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}>

          {/* ── Header ── */}
          <div className="relative overflow-hidden px-8 pt-10 pb-8"
            style={{ background: 'linear-gradient(145deg,#0B3D91 0%,#1565C0 55%,#1976D2 100%)' }}>

            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)',
            }} />
            {/* Glow orb */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle,#F5C518,transparent 70%)' }} />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition z-10">
              <X className="w-4 h-4" />
            </button>

            {/* Back */}
            {isSubView && (
              <button onClick={() => reset(backView[view] as View)}
                className="absolute top-4 left-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition z-10">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative z-10">
              {/* Brand label */}
              <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-4"
                style={{ color: '#F5C518', fontFamily: 'var(--font-heading), Outfit, sans-serif' }}>
                Liliw Tourism
              </p>
              {/* Title */}
              <h2 className="text-3xl font-black text-white leading-tight mb-1.5"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}>
                {TITLE[view]}
              </h2>
              <p className="text-white/55 text-sm" style={{ fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif' }}>
                {SUB[view]}
              </p>
            </div>
          </div>

          {/* ── Context message ── */}
          {message && (view === 'login' || view === 'register') && (
            <div className="px-8 pt-5 pb-0">
              <div className="px-4 py-3 rounded-xl text-sm font-medium text-blue-800 bg-blue-50 border border-blue-200">
                {message}
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          {(view === 'login' || view === 'register') && (
            <div className="flex border-b border-gray-100 mx-8 mt-6">
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => reset(t)}
                  className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                    view === t
                      ? 'border-[#1565C0] text-[#1565C0]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  {t === 'login' ? 'Log In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* ── Body ── */}
          <div className="px-8 py-6">

            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 px-4 py-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5">
                <span className="shrink-0 font-bold mt-px">✕</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* ── Login ── */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <div className="relative">
                    <InputIcon icon={Mail} />
                    <input required value={identifier} onChange={e => setIdentifier(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" autoComplete="email" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={LABEL_CLS} style={{ margin: 0 }}>Password</label>
                    <button type="button" onClick={() => reset('forgot')}
                      className="text-xs font-bold text-[#1565C0] hover:text-[#0B3D91] transition">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <InputIcon icon={Lock} />
                    <input required value={password} onChange={e => setPassword(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-12`} placeholder="••••••••" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition mt-1">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                </button>
              </form>
            )}

            {/* ── Register ── */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Full Name</label>
                  <div className="relative">
                    <InputIcon icon={User} />
                    <input required value={fullName} onChange={e => setFullName(e.target.value)}
                      className={INPUT_CLS} placeholder="Juan dela Cruz" autoComplete="name" />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Username</label>
                  <div className="relative">
                    <InputIcon icon={AtSign} />
                    <input required value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                      className={INPUT_CLS} placeholder="juandelacruz123" autoComplete="username"
                      minLength={3} maxLength={20} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">3–20 chars · letters, numbers, underscores</p>
                </div>
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <div className="relative">
                    <InputIcon icon={Mail} />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" autoComplete="email" />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Password</label>
                  <div className="relative">
                    <InputIcon icon={Lock} />
                    <input required value={regPw} onChange={e => setRegPw(e.target.value)}
                      type={showPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-12`} placeholder="Min. 6 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPw.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                            style={{ backgroundColor: i <= strength ? STRENGTH_COLOR[strength] : '#E5E7EB' }} />
                        ))}
                      </div>
                      <p className="text-xs mt-1 font-medium" style={{ color: STRENGTH_COLOR[strength] }}>
                        {STRENGTH_LABEL[strength]}
                      </p>
                    </div>
                  )}
                </div>
                {/* CAPTCHA */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1565C0]" />
                    <span className="text-[10px] font-black text-[#1565C0] uppercase tracking-[0.2em]">Security Check</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Type the 5 characters shown below</p>
                  <div className="flex items-center gap-2 mb-3">
                    <CaptchaCanvas code={captchaCode} />
                    <button type="button" onClick={refreshCaptcha} disabled={cooldownSec > 0}
                      title={cooldownSec > 0 ? `Wait ${cooldownSec}s` : 'New code'}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-[#1565C0] hover:border-[#1565C0] hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[44px]">
                      <RefreshCw className="w-4 h-4" />
                      {cooldownSec > 0 && <span className="text-[9px] font-bold mt-0.5">{cooldownSec}s</span>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" value={captchaInput}
                      onChange={e => handleCaptchaInput(e.target.value)}
                      maxLength={5} autoComplete="off" autoCorrect="off"
                      autoCapitalize="characters" spellCheck={false}
                      placeholder="Enter code"
                      className={`flex-1 text-center rounded-xl border px-3 py-2.5 text-sm font-bold tracking-[0.25em] focus:outline-none transition uppercase ${
                        captchaOk     ? 'border-green-400 bg-green-50 text-green-700'
                        : captchaWrong ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10'
                      }`} />
                    {captchaOk && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                  </div>
                  {captchaWrong && !captchaOk && (
                    <p className="text-xs text-red-500 mt-2">Incorrect — a new code is loading…</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !canSubmit} style={canSubmit ? primaryBtn : undefined}
                  className={`w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition ${
                    !canSubmit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'disabled:opacity-60'
                  }`}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                </button>
                <p className="text-center text-xs text-gray-400">
                  A 6-digit code will be sent to verify your email.
                </p>
              </form>
            )}

            {/* ── Registration OTP ── */}
            {view === 'reg-otp' && (
              <form onSubmit={handleRegOtp} className="space-y-5">
                <div className="flex items-center gap-3.5 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#1565C0' }}>
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">Verification code sent!</p>
                    <p className="text-xs text-blue-600 mt-0.5 truncate">{email}</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>6-Digit Code</label>
                  <input required value={regOtp}
                    onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric" autoComplete="one-time-code"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 text-center text-3xl font-black tracking-[0.4em] focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10 transition text-gray-800"
                    placeholder="000000" />
                  <p className="text-xs text-gray-400 mt-2 text-center">Expires in 10 min · Check spam if not received</p>
                </div>
                <button type="submit" disabled={loading || regOtp.length !== 6} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Create Account</>}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={handleResendRegOtp} disabled={loading}
                    className="text-[#1565C0] font-bold hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot ── */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-5">
                <div>
                  <label className={LABEL_CLS}>Your Email Address</label>
                  <div className="relative">
                    <InputIcon icon={Mail} />
                    <input required type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                      className={INPUT_CLS} placeholder="you@email.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Remember it?{' '}
                  <button type="button" onClick={() => reset('login')}
                    className="text-[#1565C0] font-bold hover:underline">Back to login</button>
                </p>
              </form>
            )}

            {/* ── Forgot OTP ── */}
            {view === 'otp' && (
              <form onSubmit={handleOtp} className="space-y-5">
                <div>
                  <label className={LABEL_CLS}>6-Digit Code</label>
                  <input required value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 text-center text-3xl font-black tracking-[0.4em] focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10 transition text-gray-800"
                    placeholder="000000" />
                </div>
                <button type="submit" disabled={otp.length !== 6} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 transition">
                  Verify Code
                </button>
                <p className="text-center text-xs text-gray-400">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={() => { setOtp(''); reset('forgot'); }}
                    className="text-[#1565C0] font-bold hover:underline">Resend</button>
                </p>
              </form>
            )}

            {/* ── New password ── */}
            {view === 'newpass' && (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className={LABEL_CLS}>New Password</label>
                  <div className="relative">
                    <InputIcon icon={Lock} />
                    <input required value={newPw} onChange={e => setNewPw(e.target.value)}
                      type={showNewPw ? 'text' : 'password'}
                      className={`${INPUT_CLS} pr-12`} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
                </button>
              </form>
            )}

            {/* ── Done ── */}
            {view === 'done' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)' }}>
                  <CheckCircle className="w-10 h-10" style={{ color: '#1565C0' }} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2"
                  style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}>
                  Password Updated!
                </h3>
                <p className="text-gray-500 text-sm mb-6">You can now log in with your new password.</p>
                <button onClick={() => reset('login')} style={primaryBtn}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] transition">
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
