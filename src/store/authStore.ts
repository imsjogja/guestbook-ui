import { create } from 'zustand';
import type { User } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

function readStoredToken() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gf_access_token');
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  return raw;
}

function readStoredRefreshToken() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gf_refresh_token');
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  return raw;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (token: string, refreshToken: string, user: User) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: readStoredToken(),
  refreshToken: readStoredRefreshToken(),
  user: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('gf_user');
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,
  error: null,

  login: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('gf_access_token', token);
    localStorage.setItem('gf_refresh_token', refreshToken);
    localStorage.setItem('gf_user', JSON.stringify(user));
    set({ accessToken: token, refreshToken, user, error: null });
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('gf_access_token', accessToken);
    localStorage.setItem('gf_refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('gf_access_token');
    localStorage.removeItem('gf_refresh_token');
    localStorage.removeItem('gf_user');
    useTenantStore.getState().setTenant(null);
    useTenantStore.getState().setCurrentEvent(null);
    set({ accessToken: null, refreshToken: null, user: null, error: null });
  },

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('gf_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gf_user');
    }
    set({ user });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  isAuthenticated: () => {
    const state = get();
    return !!state.accessToken && !!state.user;
  },
}));
