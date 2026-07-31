import type {
  Campaign,
  Checkin,
  Event,
  EventRole,
  Guest,
  GuestGift,
  Invitation,
  Message,
  Permission,
  RSVPStatus,
  TenantRole,
} from '@/types';

export const APP_LOCALE = 'id-ID';

export const roleLabels: Record<string, string> = {
  tenant_owner: 'Pemilik tenant',
  event_manager: 'Manajer acara',
  rsvp_officer: 'Petugas RSVP',
  registration_officer: 'Petugas registrasi',
  usher: 'Petugas penerima tamu',
  gift_officer: 'Petugas hadiah',
  viewer: 'Pengamat',
};

export const permissionLabels: Record<string, string> = {
  'events:read': 'Melihat acara',
  'events:write': 'Mengelola acara',
  'events:delete': 'Menghapus acara',
  'guests:read': 'Melihat tamu',
  'guests:write': 'Mengelola tamu',
  'guests:delete': 'Menghapus tamu',
  'rsvp:read': 'Melihat RSVP',
  'rsvp:write': 'Mengelola RSVP',
  'checkin:read': 'Melihat check-in',
  'checkin:write': 'Memproses check-in',
  'seating:read': 'Melihat tempat duduk',
  'seating:write': 'Mengelola tempat duduk',
  'communications:read': 'Melihat komunikasi',
  'communications:write': 'Mengirim komunikasi',
  'team:read': 'Melihat tim',
  'team:write': 'Mengelola tim',
  'settings:read': 'Melihat pengaturan',
  'settings:write': 'Mengelola pengaturan',
  'event_team:read': 'Melihat tim acara',
  'event_team:write': 'Mengelola tim acara',
  'report:read': 'Melihat laporan',
  'invitation:read': 'Melihat undangan',
  'invitation:write': 'Mengelola undangan',
  'gift:read': 'Melihat hadiah',
  'gift:write': 'Mengelola hadiah',
  'gift:delete': 'Menghapus hadiah',
};

const eventTypeLabels: Record<string, string> = {
  wedding: 'Pernikahan',
  corporate: 'Korporat',
  birthday: 'Ulang tahun',
  government: 'Pemerintahan',
  other: 'Lainnya',
};

const eventStatusLabels: Record<string, string> = {
  draft: 'Draf',
  published: 'Dipublikasikan',
  ongoing: 'Sedang berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  archived: 'Diarsipkan',
  active: 'Dipublikasikan',
};

const guestCategoryLabels: Record<string, string> = {
  vip: 'VIP',
  vvip: 'VVIP',
  family: 'Keluarga',
  friend: 'Teman',
  colleague: 'Rekan kerja',
  partner: 'Mitra',
  sponsor: 'Sponsor',
  general: 'Umum',
  other: 'Lainnya',
};

const rsvpStatusLabels: Record<string, string> = {
  attending: 'Hadir',
  not_attending: 'Tidak hadir',
  maybe: 'Mungkin',
  tentative: 'Mungkin',
  no_response: 'Belum membalas',
};

const invitationStatusLabels: Record<string, string> = {
  draft: 'Draf',
  pending: 'Belum dikirim',
  sent: 'Terkirim',
  opened: 'Dibuka',
  responded: 'Sudah RSVP',
  expired: 'Kedaluwarsa',
  revoked: 'Dicabut',
  failed: 'Gagal',
};

const deliveryStatusLabels: Record<string, string> = {
  not_sent: 'Belum dikirim',
  queued: 'Dalam antrean',
  sent: 'Diterima provider',
  delivered: 'Tersampaikan',
  read: 'Dibaca',
  failed: 'Gagal',
};

const checkinStatusLabels: Record<string, string> = {
  success: 'Berhasil',
  duplicate: 'Sudah check-in',
  invalid: 'Tidak valid',
  revoked: 'Dicabut',
  wrong_event: 'Acara berbeda',
  expired: 'Kedaluwarsa',
};

const checkinMethodLabels: Record<string, string> = {
  qr: 'Scan QR',
  qr_scan: 'Scan QR',
  manual: 'Pencarian manual',
  manual_search: 'Pencarian manual',
  self_service: 'Check-in mandiri',
  walk_in: 'Tamu langsung',
  kiosk: 'Kios mandiri',
};

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  both: 'WhatsApp dan email',
  outbound: 'Keluar',
  inbound: 'Masuk',
};

const campaignStatusLabels: Record<string, string> = {
  draft: 'Draf',
  scheduled: 'Terjadwal',
  sending: 'Sedang dikirim',
  sent: 'Terkirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const giftTypeLabels: Record<string, string> = {
  cash: 'Tunai / nominal',
  transfer: 'Transfer',
  goods: 'Kado / barang',
  other: 'Lainnya',
};

export function getRoleLabel(role: TenantRole | EventRole | string): string {
  return roleLabels[role] ?? 'Peran lainnya';
}

export function getPermissionLabel(permission: Permission | string): string {
  return permissionLabels[permission] ?? 'Akses lainnya';
}

export function getEventTypeLabel(type: Event['eventType'] | string): string {
  return eventTypeLabels[type] ?? 'Lainnya';
}

export function getEventStatusLabel(status: Event['status'] | string): string {
  return eventStatusLabels[status] ?? 'Status acara tidak diketahui';
}

export function getGuestCategoryLabel(category: Guest['category'] | string): string {
  return guestCategoryLabels[category] ?? 'Lainnya';
}

export function getRsvpStatusLabel(status: RSVPStatus | string): string {
  return rsvpStatusLabels[status] ?? 'Belum membalas';
}

export function getInvitationStatusLabel(status: Invitation['status'] | string): string {
  return invitationStatusLabels[status] ?? 'Status undangan tidak diketahui';
}

export function getDeliveryStatusLabel(status: Invitation['deliveryStatus'] | string): string {
  return deliveryStatusLabels[status] ?? 'Status pengiriman tidak diketahui';
}

export function getCheckinStatusLabel(status: Checkin['status'] | string): string {
  return checkinStatusLabels[status ?? ''] ?? 'Status check-in tidak diketahui';
}

export function getCheckinMethodLabel(method: Checkin['checkinMethod'] | string): string {
  return checkinMethodLabels[method] ?? 'Metode lainnya';
}

export function getChannelLabel(channel: Message['channel'] | Campaign['channel'] | string): string {
  return channelLabels[channel] ?? 'Saluran lainnya';
}

export function getCampaignStatusLabel(status: Campaign['status'] | string): string {
  return campaignStatusLabels[status] ?? 'Status kampanye tidak diketahui';
}

export function getGiftTypeLabelLocalized(type: GuestGift['giftType'] | string): string {
  return giftTypeLabels[type] ?? 'Lainnya';
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat(APP_LOCALE).format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

type ApiErrorData = {
  code?: string;
  error?: string;
  message?: string;
  detail?: string;
};

function readApiError(error: unknown): ApiErrorData {
  const responseData = (error as { response?: { data?: ApiErrorData } }).response?.data;
  return responseData ?? {};
}

function hasIndonesianCopy(value: string): boolean {
  return /\b(gagal|tidak|belum|sudah|silakan|akses|acara|tamu|email|kata sandi|tenant|peran|nomor|data|dikirim|dipilih|ditemukan|tersedia)\b/i.test(value);
}

const apiErrorByCode: Record<string, string> = {
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.',
  EMAIL_NOT_VERIFIED: 'Email Anda belum diverifikasi. Periksa kotak masuk atau kirim ulang email verifikasi.',
  VALIDATION_ERROR: 'Data yang dikirim belum valid. Periksa kembali isian Anda.',
  BAD_REQUEST: 'Permintaan tidak dapat diproses. Periksa kembali data yang dikirim.',
  UNAUTHORIZED: 'Sesi Anda tidak valid. Silakan masuk kembali.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  INSUFFICIENT_PERMISSIONS: 'Peran Anda belum memiliki izin untuk melakukan tindakan ini.',
  NOT_FOUND: 'Data yang diminta tidak ditemukan.',
  CONFLICT: 'Data tersebut sudah ada atau bertentangan dengan data lain.',
  DEVICE_NOT_FOUND: 'Perangkat WhatsApp belum terhubung. Hubungkan perangkat terlebih dahulu.',
  PROVIDER_UNAVAILABLE: 'Layanan penyedia sedang tidak tersedia. Coba lagi beberapa saat lagi.',
  INTERNAL_SERVER_ERROR: 'Terjadi gangguan pada server. Coba lagi beberapa saat lagi.',
};

const apiErrorByPhrase: Array<[RegExp, string]> = [
  [/network error|failed to fetch|connection refused|cannot connect/i, apiErrorByCode.NETWORK_ERROR],
  [/email.*not verified|verify.*email/i, apiErrorByCode.EMAIL_NOT_VERIFIED],
  [/insufficient permissions|permission denied|forbidden/i, apiErrorByCode.INSUFFICIENT_PERMISSIONS],
  [/device not found|create a device first|valid x-device-id/i, apiErrorByCode.DEVICE_NOT_FOUND],
  [/target number is not registered/i, 'Nomor tujuan belum terdaftar di WhatsApp.'],
  [/invalid input|invalid type|validation failed/i, apiErrorByCode.VALIDATION_ERROR],
  [/not found|does not exist/i, apiErrorByCode.NOT_FOUND],
  [/unauthorized|invalid token|token is required/i, apiErrorByCode.UNAUTHORIZED],
  [/internal server error|something went wrong/i, apiErrorByCode.INTERNAL_SERVER_ERROR],
];

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return apiErrorByCode.NETWORK_ERROR;
  }

  const data = readApiError(error);
  const raw = [data.message, data.error, data.detail].find((value) => typeof value === 'string' && value.trim())?.trim();
  const code = data.code?.toUpperCase();

  if (code && apiErrorByCode[code]) return apiErrorByCode[code];
  if (!raw) return fallback;
  if (hasIndonesianCopy(raw)) return raw;

  const matched = apiErrorByPhrase.find(([pattern]) => pattern.test(raw));
  if (matched) return matched[1];
  return fallback;
}
