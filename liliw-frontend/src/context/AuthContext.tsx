'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  role?: { id: number; name: string; type: string };
}

interface AuthState {
  user: StrapiUser | null;
  token: string | null;
  loading: boolean;
}

interface AuthCtx extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY = 'liliw-jwt';
const USER_KEY  = 'liliw-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    if (token && raw) {
      try {
        const user: StrapiUser = JSON.parse(raw);
        setState({ user, token, loading: false });
        return;
      } catch {}
    }
    setState(s => ({ ...s, loading: false }));
  }, []);

  const persist = (token: string, user: StrapiUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, loading: false });
  };

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Login failed');
    persist(data.jwt, data.user as StrapiUser);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Registration failed');
    persist(data.jwt, data.user as StrapiUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = !!state.user && (
    adminEmails.includes(state.user.email.toLowerCase()) ||
    state.user?.role?.type === 'admin' ||
    state.user?.role?.name?.toLowerCase() === 'admin'
  );

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
