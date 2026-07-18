// ── Auth ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  tenantSubdomain?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

export interface RegistrationResponse {
  message: string;
  email_verification_required: boolean;
  user: User;
}

// ── Tenant ────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  primaryColor?: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  language: string;
  notificationPreferences: NotificationPreferences;
}

export interface TenantAccess {
  role: string;
  scope: 'tenant';
  permissions: string[];
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  dailyDigest: boolean;
  rsvpAlerts: boolean;
  checkinAlerts: boolean;
}

// ── Event ─────────────────────────────────────────────

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  eventType: 'wedding' | 'corporate' | 'birthday' | 'government' | 'other';
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  capacity?: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Guest ─────────────────────────────────────────────

export interface Guest {
  id: string;
  tenantId: string;
  eventId: string;
  eventGuestId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  category: 'vip' | 'family' | 'friend' | 'colleague' | 'partner' | 'other';
  subgroup?: string;
  householdId?: string;
  dietaryRestrictions?: string;
  notes?: string;
  plusOne: boolean;
  plusOneName?: string;
  createdAt: string;
  updatedAt: string;
}

// ── RSVP ──────────────────────────────────────────────

export type RSVPStatus = 'attending' | 'not_attending' | 'maybe' | 'no_response';

export interface RSVP {
  id: string;
  guestId: string;
  guestName?: string;
  eventId: string;
  status: RSVPStatus;
  guestCount: number;
  message?: string;
  respondedAt?: string;
  respondedVia: 'web' | 'whatsapp' | 'email' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface RSVPBreakdown {
  attending: number;
  notAttending: number;
  maybe: number;
  noResponse: number;
  total: number;
}

// ── Check-in ──────────────────────────────────────────

export interface Checkin {
  id: string;
  guestId: string;
  eventId: string;
  checkinMethod: 'qr' | 'manual' | 'walk_in';
  checkedInBy: string;
  checkedInAt: string;
  notes?: string;
  seatAssignment?: string;
}

// ── Seating ───────────────────────────────────────────

export interface Table {
  id: string;
  eventId: string;
  name: string;
  shape: 'round' | 'rectangle' | 'rectangular' | 'square';
  capacity: number;
  positionX: number;
  positionY: number;
  assignedGuests: string[];
}

// ── Invitation ────────────────────────────────────────

export type InvitationLifecycleStatus = 'draft' | 'sent' | 'opened' | 'responded' | 'expired' | 'revoked' | 'failed';
export type InvitationDeliveryStatus = 'not_sent' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Invitation {
  id: string;
  guestId: string;
  eventId: string;
  channel: 'whatsapp' | 'email' | 'both';
  status: InvitationLifecycleStatus;
  deliveryStatus: InvitationDeliveryStatus;
  deliveryChannel?: 'whatsapp' | 'email' | 'sms';
  templateId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
  deliverySentAt?: string;
  deliveryDeliveredAt?: string;
  deliveryReadAt?: string;
  deliveryFailedAt?: string;
  deliveryErrorMessage?: string;
  deliveryExternalId?: string;
  deliveryProviderHttpStatus?: number;
  qrCodeUrl?: string;
  shortLink?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Communication Template ────────────────────────────

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  subject?: string;
  body: string;
  channel: 'whatsapp' | 'email' | 'both';
  category: 'invitation' | 'reminder' | 'thank_you' | 'rsvp_confirmation' | 'custom';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Campaign ──────────────────────────────────────────

export interface Campaign {
  id: string;
  tenantId: string;
  eventId?: string;
  name: string;
  templateId: string;
  channel: 'whatsapp' | 'email' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  filters?: CampaignFilters;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFilters {
  categories?: string[];
  rsvpStatus?: RSVPStatus[];
  subgroups?: string[];
}

// ── Message ───────────────────────────────────────────

export interface Message {
  id: string;
  tenantId: string;
  campaignId?: string;
  guestId: string;
  eventId?: string;
  channel: 'whatsapp' | 'email';
  direction: 'outbound' | 'inbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  subject?: string;
  body: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
  createdAt: string;
}

// ── Team ──────────────────────────────────────────────

export type TenantRole =
  | 'tenant_owner'
  | 'event_manager'
  | 'rsvp_officer'
  | 'registration_officer'
  | 'usher'
  | 'gift_officer'
  | 'viewer';

export interface TeamMember {
  id: string;
  tenantId: string;
  userId: string;
  user: User;
  role: TenantRole;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  status: 'pending' | 'active' | 'inactive';
  permissions: Permission[];
}

export type EventRole = 'rsvp_officer' | 'registration_officer' | 'usher' | 'gift_officer' | 'viewer';

export interface EventMember {
  id: string;
  tenantId: string;
  eventId: string;
  userId: string;
  role: EventRole;
  status: 'active' | 'inactive';
  assignedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface EventAccess {
  role: string;
  scope: 'tenant' | 'event';
  permissions: string[];
}

export type Permission =
  | 'events:read' | 'events:write' | 'events:delete'
  | 'guests:read' | 'guests:write' | 'guests:delete'
  | 'rsvp:read' | 'rsvp:write'
  | 'checkin:read' | 'checkin:write'
  | 'seating:read' | 'seating:write'
  | 'communications:read' | 'communications:write'
  | 'team:read' | 'team:write'
  | 'settings:read' | 'settings:write';

// ── Activity ──────────────────────────────────────────

export type ActivityType =
  | 'tamu_ditambahkan'
  | 'rsvp_diterima'
  | 'undangan_dikirim'
  | 'checkin'
  | 'reminder_dikirim'
  | 'tamu_diubah'
  | 'tamu_dihapus'
  | 'acara_dibuat';

export interface Activity {
  id: string;
  tenantId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId?: string;
  userName?: string;
}

// ── Stats ─────────────────────────────────────────────

export interface DashboardStats {
  totalGuests: number;
  rsvpAttending: number;
  rsvpNotAttending: number;
  rsvpMaybe: number;
  rsvpNoResponse: number;
  checkinToday: number;
  totalCheckins: number;
  guestGrowthPercent: number;
  rsvpConfirmationRate: number;
}

export interface AttendanceDataPoint {
  date: string;
  count: number;
}

// ── API Response ──────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface ApiError {
  message: string;
  status: string;
  errors?: Record<string, string[]>;
}
