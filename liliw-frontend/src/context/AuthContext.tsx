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

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
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
    const res = await fetch(`${STRAPI}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Login failed');

    // Fetch full user with role populated
    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const me: StrapiUser = await meRes.json();
    persist(data.jwt, me);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await fetch(`${STRAPI}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Registration failed');

    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const me: StrapiUser = await meRes.json();
    persist(data.jwt, me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const isAdmin = state.user?.role?.type === 'admin' || state.user?.role?.name?.toLowerCase() === 'admin';

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
