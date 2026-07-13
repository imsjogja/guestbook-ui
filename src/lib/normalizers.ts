import type { Event, Template } from '@/types';

type BackendEvent = {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  description?: string | null;
  status?: string;
  start_date: string;
  end_date?: string | null;
  capacity?: number | null;
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  channel: string;
  type: string;
  subject?: string | null;
  body: string;
  variables?: string[] | null;
  is_active?: boolean;
  is_system?: boolean;
  description?: string | null;
  language?: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeEventType(type?: string): Event['eventType'] {
  switch (type) {
    case 'wedding':
    case 'corporate':
    case 'birthday':
    case 'government':
      return type;
    default:
      return 'other';
  }
}

function normalizeEventStatus(status?: string): Event['status'] {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'published':
      return 'active';
    case 'ongoing':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'archived':
      return 'archived';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

export function normalizeEvent(raw: BackendEvent): Event {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    name: raw.name,
    description: raw.description ?? undefined,
    eventType: normalizeEventType(raw.type),
    startDate: raw.start_date,
    endDate: raw.end_date ?? undefined,
    location: raw.description?.trim() || '',
    status: normalizeEventStatus(raw.status),
    capacity: raw.capacity ?? undefined,
    coverImage: raw.cover_url ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeTemplateChannel(channel?: string): Template['channel'] {
  switch (channel) {
    case 'whatsapp':
    case 'email':
      return channel;
    default:
      return 'both';
  }
}

function normalizeTemplateCategory(type?: string): Template['category'] {
  switch (type) {
    case 'invitation':
    case 'reminder':
    case 'thank_you':
    case 'rsvp_confirmation':
    case 'custom':
      return type;
    default:
      return 'custom';
  }
}

export function normalizeTemplate(raw: BackendTemplate): Template {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    name: raw.name,
    subject: raw.subject ?? undefined,
    body: raw.body,
    channel: normalizeTemplateChannel(raw.channel),
    category: normalizeTemplateCategory(raw.type),
    variables: raw.variables ?? [],
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export type { BackendEvent, BackendTemplate };
