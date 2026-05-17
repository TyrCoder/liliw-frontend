'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  role?: { id: number; name: string; type: string };
  adminPanelRole?: string;
}

interface AuthState {
  user: StrapiUser | null;
  token: string | null;
  loading: boolean;
}

interface AuthCtx extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithJwt: (jwt: string, user: StrapiUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isChatoOfficer: boolean;
  isChatoEditor: boolean;
  isStaff: boolean;
  isLocal: boolean;
  userRole: string;
  adminPanelRole: string | null;
}

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY = 'liliw-jwt';
const USER_KEY  = 'liliw-user';
const STRAPI    = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  // On mount: always re-fetch the user's current role from Strapi so role
  // changes (e.g. Admin → CHATO Officer) are reflected without re-logging in.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    fetch(`/api/auth/me?token=${encodeURIComponent(token)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(user => {
        if (user?.id) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          setState({ user, token, loading: false });
        } else {
          // Token expired or invalid — clear session
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({ user: null, token: null, loading: false });
        }
      })
      .catch(() => {
        // Network error — fall back to cached data so offline still works
        const raw = localStorage.getItem(USER_KEY);
        try {
          setState({ user: raw ? JSON.parse(raw) : null, token, loading: false });
        } catch {
          setState({ user: null, token: null, loading: false });
        }
      });
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

  const loginWithJwt = useCallback((jwt: string, user: StrapiUser) => {
    persist(jwt, user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const userRole       = state.user?.role?.type ?? 'public';
  // Normalize: lowercase + strip spaces/hyphens/underscores for flexible matching
  const roleName       = state.user?.role?.name?.toLowerCase() ?? '';
  const roleNorm       = roleName.replace(/[\s_-]/g, '');
  const roleType       = userRole.replace(/[\s_-]/g, '');
  const adminPanelRole = state.user?.adminPanelRole ?? null;

  if (state.user?.role) {
    console.log('[Auth] role:', state.user.role);
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

  const hasChatoRole = roleNorm.includes('chato');
  const isAdmin = !!state.user && (
    userRole === 'admin' ||
    roleName === 'admin' ||
    (!!state.user.email && adminEmails.includes(state.user.email) && !hasChatoRole)
  );

  const isChatoOfficer = !isAdmin && !!state.user && (
    roleNorm.includes('chatoofficer') || roleType.includes('chatoofficer')
  );

  const isChatoEditor = !isAdmin && !isChatoOfficer && !!state.user && (
    roleNorm.includes('chatoeditor') || roleType.includes('chatoeditor')
  );

  const isStaff = isAdmin || isChatoOfficer || isChatoEditor;
  const isLocal = !!state.user && !isStaff && userRole === 'authenticated';

  return (
    <AuthContext.Provider value={{
      ...state, login, register, loginWithJwt, logout,
      isAdmin, isChatoOfficer, isChatoEditor, isStaff, isLocal,
      userRole, adminPanelRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
