import type { Event, Invitation, Template } from '@/types';

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
  guest_count?: number | null;
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendGuest = {
  id: string;
  tenant_id: string;
  full_name: string;
  nickname?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  language?: string | null;
  guest_type?: string | null;
  segment?: string | null;
  household_id?: string | null;
  institution?: string | null;
  title?: string | null;
  relationship?: string | null;
  pic?: string | null;
  accessibility_needs?: string | null;
  dietary_restrictions?: string | null;
  allergies?: string | null;
  notes?: string | null;
  consent_communication?: boolean;
  consent_version?: string | null;
  source?: string | null;
  is_active?: boolean;
  created_by?: string;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  plus_one?: boolean;
  plus_one_name?: string | null;
  invitations?: BackendInvitation[] | null;
  checkins?: BackendCheckin[] | null;
  rsvp?: BackendRsvp | null;
};

type BackendInvitation = {
  id: string;
  guest_id: string;
  event_id: string;
  url?: string | null;
  channel?: string | null;
  status?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_reason?: string | null;
  delivery_status?: string | null;
  delivery_channel?: string | null;
  delivery_sent_at?: string | null;
  delivery_delivered_at?: string | null;
  delivery_read_at?: string | null;
  delivery_failed_at?: string | null;
  delivery_error_message?: string | null;
  delivery_external_id?: string | null;
  delivery_provider_http_status?: number | null;
  qr_code_url?: string | null;
  short_link?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendCheckin = {
  id: string;
  guest_id: string;
  event_guest_id?: string | null;
  event_id: string;
  method?: string | null;
  status?: string | null;
  checked_in_by?: string | null;
  checked_in_at?: string | null;
  created_at?: string | null;
  seat_assignment?: string | null;
  notes?: string | null;
};

type BackendRsvp = {
  id: string;
  guest_id: string;
  event_id: string;
  status?: string | null;
  guest_count?: number | null;
  attending_pax?: number | null;
  adults?: number | null;
  children?: number | null;
  responded_at?: string | null;
  edited_at?: string | null;
  responded_via?: string | null;
  notes?: string | null;
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

function normalizeGuestCategory(category?: string | null): import('@/types').Guest['category'] {
  switch (category) {
    case 'vip':
      return 'vip';
    case 'family':
      return 'family';
    case 'friend':
      return 'friend';
    case 'colleague':
      return 'colleague';
    case 'partner':
    case 'vvip':
    case 'sponsor':
      return 'partner';
    default:
      return 'other';
  }
}

function normalizeRsvpStatus(status?: string | null): import('@/types').RSVP['status'] {
  switch (status) {
    case 'attending':
      return 'attending';
    case 'not_attending':
      return 'not_attending';
    case 'maybe':
      return 'maybe';
    default:
      return 'no_response';
  }
}

function normalizeCheckinMethod(method?: string | null): import('@/types').Checkin['checkinMethod'] {
  switch (method) {
    case 'qr_scan':
    case 'qr':
      return 'qr';
    case 'walk_in':
      return 'walk_in';
    case 'manual_search':
    case 'manual':
    case 'kiosk':
    default:
      return 'manual';
  }
}

function normalizeGuestName(name?: string | null): string {
  return (name ?? '').trim();
}

function getInitialsFromName(name?: string | null): string {
  const cleaned = normalizeGuestName(name);
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
    case 'active':
      return 'published';
    case 'ongoing':
    case 'paused':
      return 'ongoing';
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
    guestCount: raw.guest_count ?? undefined,
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
    type: raw.type,
    category: normalizeTemplateCategory(raw.type),
    variables: raw.variables ?? [],
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function normalizeGuest(raw: BackendGuest): import('@/types').Guest {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    eventId: '',
    fullName: normalizeGuestName(raw.full_name),
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    category: normalizeGuestCategory(raw.guest_type),
    subgroup: raw.segment ?? undefined,
    householdId: raw.household_id ?? undefined,
    dietaryRestrictions: raw.dietary_restrictions ?? undefined,
    notes: raw.notes ?? undefined,
    plusOne: raw.plus_one ?? false,
    plusOneName: raw.plus_one_name ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function normalizeGuestDetail(raw: BackendGuest) {
  const guest = normalizeGuest(raw);
  const rsvp = raw.rsvp
    ? {
        id: raw.rsvp.id,
        guestId: raw.rsvp.guest_id,
        eventId: raw.rsvp.event_id,
        status: normalizeRsvpStatus(raw.rsvp.status),
        guestCount: raw.rsvp.guest_count ?? raw.rsvp.attending_pax ?? 0,
        message: raw.rsvp.notes ?? undefined,
        respondedAt: raw.rsvp.responded_at ?? undefined,
        respondedVia: raw.rsvp.responded_via ?? 'manual',
        createdAt: raw.rsvp.responded_at ?? raw.created_at,
        updatedAt: raw.rsvp.edited_at ?? raw.rsvp.responded_at ?? raw.created_at,
      }
    : undefined;

  const invitations = (raw.invitations ?? []).map((inv) => ({
    id: inv.id,
    guestId: inv.guest_id,
    eventId: inv.event_id,
    channel: (inv.channel === 'whatsapp' || inv.channel === 'email' || inv.channel === 'both') ? inv.channel : 'both',
    status: inv.status ?? 'draft',
    deliveryStatus: normalizeInvitationDeliveryStatus(inv.delivery_status),
    deliveryChannel: normalizeInvitationDeliveryChannel(inv.delivery_channel),
    sentAt: inv.sent_at ?? undefined,
    deliveredAt: inv.delivered_at ?? undefined,
    readAt: inv.read_at ?? undefined,
    failedReason: inv.failed_reason ?? undefined,
    deliverySentAt: inv.delivery_sent_at ?? undefined,
    deliveryDeliveredAt: inv.delivery_delivered_at ?? undefined,
    deliveryReadAt: inv.delivery_read_at ?? undefined,
    deliveryFailedAt: inv.delivery_failed_at ?? undefined,
    deliveryErrorMessage: inv.delivery_error_message ?? undefined,
    deliveryExternalId: inv.delivery_external_id ?? undefined,
    deliveryProviderHttpStatus: inv.delivery_provider_http_status ?? undefined,
    qrCodeUrl: inv.qr_code_url ?? undefined,
    shortLink: inv.short_link ?? undefined,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
  }));

  const checkins = (raw.checkins ?? []).map((ci) => ({
    id: ci.id,
    guestId: ci.guest_id,
    eventGuestId: ci.event_guest_id ?? undefined,
    eventId: ci.event_id,
    status: ci.status === 'success' || ci.status === 'duplicate' || ci.status === 'invalid' || ci.status === 'revoked' || ci.status === 'wrong_event' || ci.status === 'expired'
      ? ci.status
      : undefined,
    checkinMethod: normalizeCheckinMethod(ci.method),
    checkedInBy: ci.checked_in_by ?? 'System',
    checkedInAt: ci.checked_in_at ?? ci.created_at ?? raw.created_at,
    notes: ci.notes ?? undefined,
    seatAssignment: ci.seat_assignment ?? undefined,
  }));

  return {
    ...guest,
    rsvp,
    invitations,
    checkins,
  };
}

function normalizeInvitationLifecycleStatus(status?: string | null): Invitation['status'] {
  switch (status) {
    case 'draft':
    case 'sent':
    case 'opened':
    case 'responded':
    case 'expired':
    case 'revoked':
    case 'failed':
      return status;
    default:
      return 'draft';
  }
}

function normalizeInvitationDeliveryStatus(status?: string | null): Invitation['deliveryStatus'] {
  switch (status) {
    case 'queued':
    case 'sent':
    case 'delivered':
    case 'read':
    case 'failed':
      return status;
    default:
      return 'not_sent';
  }
}

function normalizeInvitationDeliveryChannel(channel?: string | null): Invitation['deliveryChannel'] {
  return channel === 'whatsapp' || channel === 'email' || channel === 'sms' ? channel : undefined;
}

export function normalizeInvitation(raw: BackendInvitation): Invitation {
  return {
    id: raw.id,
    guestId: raw.guest_id,
    eventId: raw.event_id,
    channel: raw.channel === 'whatsapp' || raw.channel === 'email' || raw.channel === 'both' ? raw.channel : 'both',
    status: normalizeInvitationLifecycleStatus(raw.status),
    deliveryStatus: normalizeInvitationDeliveryStatus(raw.delivery_status),
    deliveryChannel: normalizeInvitationDeliveryChannel(raw.delivery_channel),
    sentAt: raw.sent_at ?? undefined,
    deliveredAt: raw.delivered_at ?? undefined,
    readAt: raw.read_at ?? undefined,
    failedReason: raw.failed_reason ?? undefined,
    deliverySentAt: raw.delivery_sent_at ?? undefined,
    deliveryDeliveredAt: raw.delivery_delivered_at ?? undefined,
    deliveryReadAt: raw.delivery_read_at ?? undefined,
    deliveryFailedAt: raw.delivery_failed_at ?? undefined,
    deliveryErrorMessage: raw.delivery_error_message ?? undefined,
    deliveryExternalId: raw.delivery_external_id ?? undefined,
    deliveryProviderHttpStatus: raw.delivery_provider_http_status ?? undefined,
    qrCodeUrl: raw.qr_code_url ?? raw.url ?? undefined,
    shortLink: raw.short_link ?? raw.url ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function getGuestInitials(name?: string | null): string {
  return getInitialsFromName(name);
}

export function getGuestFirstName(name?: string | null): string {
  const cleaned = normalizeGuestName(name);
  if (!cleaned) return '';
  return cleaned.split(/\s+/)[0] ?? '';
}

export type { BackendEvent, BackendTemplate };
