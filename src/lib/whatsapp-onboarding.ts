export interface WhatsAppIntegrationStatus {
  enabled: boolean;
  configured: boolean;
  device_id?: string;
  connection?: {
    state: string;
    connected: boolean;
    logged_in: boolean;
    jid?: string;
    phone_number?: string;
    error?: string;
  };
}

export type WhatsAppReadinessState =
  | 'loading'
  | 'disabled'
  | 'not_configured'
  | 'not_registered'
  | 'disconnected'
  | 'unauthorized'
  | 'unavailable'
  | 'ready';

export interface WhatsAppReadiness {
  state: WhatsAppReadinessState;
  ready: boolean;
  title: string;
  message: string;
}

export function getWhatsAppReadiness(status: WhatsAppIntegrationStatus | null): WhatsAppReadiness {
  if (!status) {
    return {
      state: 'loading',
      ready: false,
      title: 'Memeriksa koneksi WhatsApp',
      message: 'Status koneksi sedang diperiksa. Silakan tunggu sebentar.',
    };
  }

  if (!status.enabled) {
    return {
      state: 'disabled',
      ready: false,
      title: 'Aktifkan pengiriman WhatsApp',
      message: 'Aktifkan WhatsApp di Pengaturan > Integrasi, lalu simpan perubahan.',
    };
  }

  if (!status.configured) {
    return {
      state: 'not_configured',
      ready: false,
      title: 'WhatsApp belum siap digunakan',
      message: 'Selesaikan pengaturan WhatsApp di Pengaturan > Integrasi terlebih dahulu.',
    };
  }

  if (status.connection?.logged_in) {
    return {
      state: 'ready',
      ready: true,
      title: 'WhatsApp siap mengirim',
      message: 'Nomor WhatsApp sudah terhubung dan dapat digunakan untuk pengiriman.',
    };
  }

  const state = status.connection?.state;
  if (state === 'unauthorized') {
    return {
      state,
      ready: false,
      title: 'Koneksi WhatsApp perlu diperiksa',
      message: 'Koneksi WhatsApp belum dapat digunakan. Hubungi administrator jika masalah berlanjut.',
    };
  }

  if (state === 'unavailable') {
    return {
      state,
      ready: false,
      title: 'Layanan WhatsApp tidak tersedia',
      message: 'Layanan sedang tidak tersedia. Coba lagi setelah beberapa saat.',
    };
  }

  return {
    state: state === 'not_registered' ? state : 'disconnected',
    ready: false,
    title: 'Hubungkan nomor WhatsApp',
    message: 'Klik Hubungkan WhatsApp di Pengaturan > Integrasi, lalu pindai QR dari aplikasi WhatsApp.',
  };
}
