import { describe, expect, it } from 'vitest';
import { getWhatsAppReadiness } from './whatsapp-onboarding';

describe('getWhatsAppReadiness', () => {
  it('requires the integration to be enabled before pairing', () => {
    const readiness = getWhatsAppReadiness({ enabled: false, configured: false });

    expect(readiness.state).toBe('disabled');
    expect(readiness.ready).toBe(false);
  });

  it('requires a logged-in device before sending', () => {
    const readiness = getWhatsAppReadiness({
      enabled: true,
      configured: true,
      connection: { state: 'disconnected', connected: false, logged_in: false },
    });

    expect(readiness.state).toBe('disconnected');
    expect(readiness.message).toContain('pindai QR');
  });

  it('marks a logged-in device as ready', () => {
    const readiness = getWhatsAppReadiness({
      enabled: true,
      configured: true,
      connection: { state: 'logged_in', connected: true, logged_in: true },
    });

    expect(readiness).toMatchObject({ state: 'ready', ready: true });
  });

  it('keeps a disconnected device out of the send flow', () => {
    const readiness = getWhatsAppReadiness({
      enabled: true,
      configured: true,
      connection: { state: 'connected', connected: true, logged_in: false },
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.title).toBe('Hubungkan nomor WhatsApp');
  });
});
