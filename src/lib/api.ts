import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import type { AuthResponse } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = api
      .post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken })
      .then((response) => {
        const { access_token, refresh_token } = response.data;
        if (!access_token || !refresh_token) {
          throw new Error('Refresh response is incomplete');
        }
        useAuthStore.getState().updateTokens(access_token, refresh_token);
        return access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function expireSession() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function splitUrl(url: string) {
  const [pathname, query = ''] = url.split('?');
  return { pathname, query: query ? `?${query}` : '' };
}

function getBodyData(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof data === 'object') {
    return data as Record<string, unknown>;
  }
  return {};
}

function resolveWorkspacePath(url: string, method?: string, data?: unknown) {
  const tenant = useTenantStore.getState().currentTenant;
  const event = useTenantStore.getState().currentEvent;
  if (!tenant) {
    return { url, method };
  }

  const { pathname, query } = splitUrl(url);
  const lowerMethod = (method ?? 'get').toLowerCase();
  const tenantPrefix = `/tenants/${tenant.id}`;
  const eventPrefix = event ? `${tenantPrefix}/events/${event.id}` : null;

  if (pathname === '/team' || pathname.startsWith('/team/')) {
    if (pathname === '/team') {
      return { url: `${tenantPrefix}/users${query}`, method };
    }

    if (pathname === '/team/invite') {
      return { url: `${tenantPrefix}/users/invite${query}`, method };
    }

    if (/^\/team\/[^/]+\/role$/.test(pathname)) {
      const memberId = pathname.split('/')[2];
      return { url: `${tenantPrefix}/users/${memberId}/role${query}`, method };
    }

    if (/^\/team\/[^/]+$/.test(pathname)) {
      const memberId = pathname.split('/')[2];
      return { url: `${tenantPrefix}/users/${memberId}${query}`, method };
    }
  }

  if (pathname === '/event-members' || pathname.startsWith('/event-members/')) {
    if (!eventPrefix) return { url, method };
    const memberPath = pathname.replace(/^\/event-members/, '/members');
    return { url: `${eventPrefix}${memberPath}${query}`, method };
  }

  if (pathname === '/event-access') {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/members/access${query}`, method };
  }

  if (pathname === '/tenant-access') {
    return { url: `${tenantPrefix}/access${query}`, method };
  }

  if (pathname === '/events' || pathname.startsWith('/events/')) {
    if (pathname.endsWith('/publish') && lowerMethod === 'patch') {
      return { url: `${tenantPrefix}${pathname}${query}`, method: 'post' };
    }
    return { url: `${tenantPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/guests' || pathname.startsWith('/guests/')) {
    return { url: `${tenantPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/event-guests' || pathname.startsWith('/event-guests/')) {
    if (!eventPrefix) return { url, method };
    const rosterPath = pathname.replace(/^\/event-guests/, '/guests');
    return { url: `${eventPrefix}${rosterPath}${query}`, method };
  }

  if (pathname === '/templates' || pathname.startsWith('/templates/')) {
    return { url: `${tenantPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/invitations' || pathname.startsWith('/invitations/')) {
    if (!eventPrefix) return { url, method };
    if (pathname.endsWith('/revoke')) {
      const basePath = pathname.replace(/\/revoke$/, '');
      return { url: `${eventPrefix}${basePath}${query}`, method: 'delete' };
    }
    return { url: `${eventPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/campaigns' || pathname.startsWith('/campaigns/')) {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/messages' || pathname.startsWith('/messages/')) {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/rsvp' && lowerMethod === 'get') {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/rsvp${query}`, method };
  }

  if (pathname === '/rsvp/breakdown') {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/rsvp/dashboard${query}`, method };
  }

  if (pathname.startsWith('/rsvp/')) {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}${pathname}${query}`, method };
  }

  if (pathname === '/checkins' || pathname.startsWith('/checkins/')) {
    if (!eventPrefix) return { url, method };
    if (pathname === '/checkins') {
      if (lowerMethod === 'get') {
        return { url: `${eventPrefix}/checkin/recent${query}`, method };
      }
      if (lowerMethod === 'post') {
        return { url: `${eventPrefix}/checkin${query}`, method };
      }
    }

    if (pathname === '/checkins/stats') {
      return { url: `${eventPrefix}/checkin/stats${query}`, method };
    }

    if (pathname === '/checkins/search') {
      return { url: `${eventPrefix}/checkin/search${query}`, method };
    }

    if (pathname === '/checkins/walk-in') {
      return { url: `${eventPrefix}/checkin/walkin${query}`, method };
    }

    const rewritten = pathname.replace(/^\/checkins/, '/checkin').replace('/walk-in', '/walkin');
    return { url: `${eventPrefix}${rewritten}${query}`, method };
  }

  if (pathname === '/seating') {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/tables${query}`, method };
  }

  if (pathname === '/seating/layout') {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/seating/layout${query}`, method };
  }

  if (pathname.startsWith('/seating/auto-assign')) {
    if (!eventPrefix) return { url, method };
    return { url: `${eventPrefix}/seating/auto-assign${query}`, method };
  }

  if (pathname.startsWith('/seating/')) {
    if (!eventPrefix) return { url, method };
    const parts = pathname.split('/').filter(Boolean);
    const tableId = parts[1];
    const action = parts[2];

    if (!tableId) return { url, method };

    if (action === 'unassign') {
      const body = getBodyData(data);
      const guestId = typeof body.guestId === 'string' ? body.guestId : '';
      if (!guestId) return { url, method };
      return {
        url: `${eventPrefix}/tables/${tableId}/assign/${guestId}${query}`,
        method: 'delete',
      };
    }

    if (action === 'assign') {
      return { url: `${eventPrefix}/tables/${tableId}/assign${query}`, method };
    }

    return { url: `${eventPrefix}/tables/${tableId}${query}`, method };
  }

  return { url, method };
}

// Request interceptor: attach auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const tenant = useTenantStore.getState().currentTenant;
    const resolved = resolveWorkspacePath(config.url ?? '', config.method, config.data);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenant) {
      config.headers['X-Tenant-ID'] = tenant.id;
    }

    config.url = resolved.url;
    if (resolved.method) {
      config.method = resolved.method === 'put' ? 'patch' : resolved.method;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const hasSession = !!useAuthStore.getState().accessToken;

    if (error.response?.status === 401 && !isAuthRoute && hasSession && originalRequest) {
      if (originalRequest._retry) {
        expireSession();
      } else {
        originalRequest._retry = true;
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(originalRequest);
        }
        expireSession();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
