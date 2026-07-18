import api from '@/lib/api';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, Event, Tenant } from '@/types';
import { normalizeEvent, type BackendEvent } from '@/lib/normalizers';

export type BackendTenant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  settings?: Record<string, unknown> | null;
  status?: string;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

type BootstrapOptions = {
  reset?: boolean;
  requireTenant?: boolean;
  requireEvent?: boolean;
};

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeTenantSettings(raw?: Record<string, unknown> | null): Tenant['settings'] {
  const settings = raw ?? {};
  const notifications = (settings.notificationPreferences ??
    settings.notification_preferences ??
    {}) as Record<string, unknown>;

  return {
    timezone: readString(settings.timezone, 'Asia/Jakarta'),
    dateFormat: readString(settings.dateFormat ?? settings.date_format, 'dd MMMM yyyy'),
    language: readString(settings.language, 'id'),
    notificationPreferences: {
      emailEnabled: readBool(notifications.emailEnabled ?? notifications.email_enabled, true),
      whatsappEnabled: readBool(notifications.whatsappEnabled ?? notifications.whatsapp_enabled, true),
      dailyDigest: readBool(notifications.dailyDigest ?? notifications.daily_digest, false),
      rsvpAlerts: readBool(notifications.rsvpAlerts ?? notifications.rsvp_alerts, true),
      checkinAlerts: readBool(notifications.checkinAlerts ?? notifications.checkin_alerts, true),
    },
  };
}

export function normalizeTenant(raw: BackendTenant): Tenant {
  const status = raw.status === 'suspended' || raw.status === 'cancelled'
    ? raw.status
    : 'active';

  return {
    id: raw.id,
    name: raw.name,
    subdomain: raw.slug,
    logo: raw.logo_url ?? undefined,
    primaryColor: raw.primary_color ?? '#4f46e5',
    plan: 'basic',
    status,
    settings: normalizeTenantSettings(raw.settings),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function pickCurrentEvent(events: Event[], current?: Event | null): Event | null {
  if (current) {
    const match = events.find((event) => event.id === current.id);
    if (match) return match;
  }
  return null;
}

export async function bootstrapWorkspace(options: BootstrapOptions = {}): Promise<{
  tenant: Tenant | null;
  event: Event | null;
}> {
  const store = useTenantStore.getState();

  if (options.reset) {
    store.setTenant(null);
    store.setCurrentEvent(null);
  }

  const tenantsRes = await api.get<ApiResponse<BackendTenant[]>>('/tenants');
  const tenants = (tenantsRes.data.data ?? []).map(normalizeTenant);
  store.setTenants(tenants);

  const currentTenantId = store.currentTenant?.id;
  let tenant = currentTenantId
    ? tenants.find((item) => item.id === currentTenantId) ?? null
    : tenants[0] ?? null;

  if (tenant) {
    store.setTenant(tenant);
  } else if (store.currentTenant) {
    store.setTenant(null);
    store.setCurrentEvent(null);
  }

  if (!tenant) {
    if (options.requireTenant) {
      throw new Error('Akun ini belum terhubung ke tenant');
    }
    return { tenant: null, event: null };
  }

  const eventsRes = await api.get<ApiResponse<BackendEvent[]>>('/events');
  const events = (eventsRes.data.data ?? []).map(normalizeEvent);
  const event = pickCurrentEvent(events, store.currentEvent);
  store.setCurrentEvent(event);

  if (!event && options.requireEvent) {
    throw new Error('Tenant belum memiliki event aktif');
  }

  return { tenant, event };
}
