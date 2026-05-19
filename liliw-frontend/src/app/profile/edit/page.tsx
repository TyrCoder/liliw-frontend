'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Lock, Mail, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

type Tab = 'profile' | 'password' | 'email';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-white';

function Banner({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div
      className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
        type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
      style={{ fontFamily: BL }}
    >
      {msg}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs font-bold mb-1.5"
      style={{ color: '#0B3D91', fontFamily: BL }}
    >
      {children}
    </label>
  );
}

function SubmitBtn({
  loading,
  children,
}: {
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
      style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function SendOtpButton({
  onSend,
  label = 'Send Verification Code',
}: {
  onSend: () => Promise<void>;
  label?: string;
}) {
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend();
      setCountdown(60);
      const iv = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(iv); return 0; }
          return c - 1;
        });
      }, 1000);
    } finally {
      setSending(false);
    }
  };

  if (countdown > 0) {
    return (
      <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: BL }}>
        Resend in {countdown}s
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={sending}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200 text-blue-700 hover:bg-blue-50 transition disabled:opacity-60"
      style={{ fontFamily: BL }}
    >
      {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </button>
  );
}

// ─── Profile Info Tab ──────────────────────────────────────────────────────────

function ProfileTab({ token, email, username }: { token: string; email: string; username: string }) {
  const [fullName, setFullName] = useState('');
  const [uname, setUname] = useState(username);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.full_name) setFullName(d.full_name); })
      .catch(() => {});
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: uname, full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Update failed.'); return; }
      setSuccess('Profile updated successfully!');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <Banner type="success" msg={success} />}
      {error   && <Banner type="error"   msg={error}   />}

      <div>
        <Label>Email Address</Label>
        <input
          type="text"
          value={email}
          readOnly
          className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
        />
        <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: BL }}>
          To change your email, use the "Change Email" tab.
        </p>
      </div>

      <div>
        <Label>Username</Label>
        <input
          type="text"
          value={uname}
          onChange={e => setUname(e.target.value)}
          className={inputCls}
          placeholder="Your username"
        />
      </div>

      <div>
        <Label>Full Name</Label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className={inputCls}
          placeholder="Your full name"
        />
      </div>

      <SubmitBtn loading={loading}>Save Changes</SubmitBtn>
    </form>
  );
}

// ─── Change Password Tab ───────────────────────────────────────────────────────

function PasswordTab({ token, email }: { token: string; email: string }) {
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const sendCode = useCallback(async () => {
    setError('');
    const res = await fetch('/api/auth/send-profile-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purpose: 'password' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to send code.');
    setCodeSent(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(''); setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Password change failed.'); return; }
      setSuccess('Password changed successfully!');
      setOtp(''); setNewPassword(''); setConfirmPassword('');
      setCodeSent(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <Banner type="success" msg={success} />}
      {error   && <Banner type="error"   msg={error}   />}

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
        <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: BL }}>
          A verification code will be sent to:
        </p>
        <p className="text-sm font-semibold" style={{ color: '#0B3D91', fontFamily: BL }}>
          {email}
        </p>
        <div className="mt-3">
          <SendOtpButton onSend={sendCode} />
        </div>
      </div>

      {codeSent && (
        <>
          <div>
            <Label>Verification Code</Label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
              placeholder="6-digit code"
            />
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: BL }}>
              Enter the code sent to {email}
            </p>
          </div>

          <div>
            <Label>New Password</Label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputCls}
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="Repeat new password"
            />
          </div>

          <SubmitBtn loading={loading}>Verify &amp; Change Password</SubmitBtn>
        </>
      )}
    </form>
  );
}

// ─── Change Email Tab ──────────────────────────────────────────────────────────

function EmailTab({ token, email, logout }: { token: string; email: string; logout: () => void }) {
  const [phase1Sent, setPhase1Sent] = useState(false);
  const [phase1Done, setPhase1Done] = useState(false);
  const [otp1, setOtp1] = useState('');
  const [verifying1, setVerifying1] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [phase2Sent, setPhase2Sent] = useState(false);
  const [otp2, setOtp2] = useState('');
  const [verifying2, setVerifying2] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const sendOld = useCallback(async () => {
    setError('');
    const res = await fetch('/api/auth/send-profile-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purpose: 'email_old' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to send code.');
    setPhase1Sent(true);
  }, [token]);

  const verifyOld = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying1(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phase: 'verify_old', otp: otp1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Verification failed.'); return; }
      setPhase1Done(true);
    } catch {
      setError('Something went wrong.');
    } finally {
      setVerifying1(false);
    }
  };

  const sendNew = useCallback(async () => {
    if (!newEmail) throw new Error('Please enter your new email first.');
    setError('');
    const res = await fetch('/api/auth/send-profile-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purpose: 'email_new', newEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to send code.');
    setPhase2Sent(true);
  }, [token, newEmail]);

  const confirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying2(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phase: 'verify_new', otp: otp2, newEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Email change failed.'); return; }
      setSuccess('Email changed successfully! You will be logged out in a moment.');
      setTimeout(() => logout(), 3000);
    } catch {
      setError('Something went wrong.');
    } finally {
      setVerifying2(false);
    }
  };

  return (
    <div className="space-y-5">
      {success && <Banner type="success" msg={success} />}
      {error   && <Banner type="error"   msg={error}   />}

      <div>
        <Label>Current Email Address</Label>
        <input type="text" value={email} readOnly className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
      </div>

      {/* Phase 1 */}
      {!phase1Done ? (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide" style={{ fontFamily: HL }}>
            Step 1 — Verify Current Email
          </p>
          <SendOtpButton onSend={sendOld} label="Send Code to Current Email" />
          {phase1Sent && (
            <form onSubmit={verifyOld} className="space-y-2 pt-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp1}
                onChange={e => setOtp1(e.target.value.replace(/\D/g, ''))}
                className={inputCls}
                placeholder="6-digit code"
              />
              <button
                type="submit"
                disabled={verifying1 || otp1.length < 6}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition"
                style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}
              >
                {verifying1 && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-700 text-sm font-semibold px-1" style={{ fontFamily: BL }}>
          <Check className="w-4 h-4" /> Current email verified
        </div>
      )}

      {/* Phase 2 */}
      {phase1Done && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide" style={{ fontFamily: HL }}>
            Step 2 — Set New Email
          </p>
          <div>
            <Label>New Email Address</Label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className={inputCls}
              placeholder="new@example.com"
            />
          </div>
          <SendOtpButton onSend={sendNew} label="Send Code to New Email" />
          {phase2Sent && (
            <form onSubmit={confirmChange} className="space-y-2 pt-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp2}
                onChange={e => setOtp2(e.target.value.replace(/\D/g, ''))}
                className={inputCls}
                placeholder="6-digit code sent to new email"
              />
              <button
                type="submit"
                disabled={verifying2 || otp2.length < 6}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition"
                style={{ backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: BL }}
              >
                {verifying2 && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Email Change
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const initials = (user.username ?? 'U').charAt(0).toUpperCase();
  const safeToken = token ?? '';

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',  label: 'Profile Info',     icon: <User  className="w-3.5 h-3.5" /> },
    { key: 'password', label: 'Change Password',  icon: <Lock  className="w-3.5 h-3.5" /> },
    { key: 'email',    label: 'Change Email',      icon: <Mail  className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0B3D91 0%,#1565C0 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
            <Link
              href="/profile"
              className="inline-flex items-center font-semibold mb-6 group text-sm"
              style={{ color: '#F5C518', fontFamily: BL }}
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
              Back to Profile
            </Link>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: HL }}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: HL }}>Edit Profile</h1>
                <p className="text-white/60 text-sm mt-0.5" style={{ fontFamily: BL }}>{user.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition"
              style={{
                backgroundColor: tab === t.key ? '#0B3D91' : '#fff',
                color: tab === t.key ? '#F5C518' : '#374151',
                fontFamily: BL,
                border: tab === t.key ? '2px solid #0B3D91' : '2px solid #E5E7EB',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          {tab === 'profile' && (
            <ProfileTab token={safeToken} email={user.email} username={user.username} />
          )}
          {tab === 'password' && (
            <PasswordTab token={safeToken} email={user.email} />
          )}
          {tab === 'email' && (
            <EmailTab token={safeToken} email={user.email} logout={logout} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
