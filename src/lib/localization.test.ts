import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  getApiErrorMessage,
  getEventStatusLabel,
  getGuestCategoryLabel,
  getPermissionLabel,
  getRoleLabel,
  getRsvpStatusLabel,
} from './localization';

describe('localization dictionary', () => {
  it('uses consistent Indonesian labels for shared status and access values', () => {
    expect(getEventStatusLabel('draft')).toBe('Draf');
    expect(getGuestCategoryLabel('friend')).toBe('Teman');
    expect(getRsvpStatusLabel('not_attending')).toBe('Tidak hadir');
    expect(getRoleLabel('event_manager')).toBe('Manajer acara');
    expect(getPermissionLabel('guests:write')).toBe('Mengelola tamu');
  });

  it('does not expose common provider errors in English', () => {
    expect(getApiErrorMessage({ response: { data: { error: 'insufficient permissions' } } }))
      .toBe('Peran Anda belum memiliki izin untuk melakukan tindakan ini.');
    expect(getApiErrorMessage({ response: { data: { error: 'Target number is not registered on WhatsApp' } } }))
      .toBe('Nomor tujuan belum terdaftar di WhatsApp.');
    expect(getApiErrorMessage({ response: { data: { code: 'DEVICE_NOT_FOUND' } } }))
      .toBe('Perangkat WhatsApp belum terhubung. Hubungkan perangkat terlebih dahulu.');
  });

  it('formats dates and numbers using the Indonesian locale', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatDate('2026-07-31T08:00:00Z')).toContain('2026');
    expect(formatDateTime('2026-07-31T08:00:00Z')).toContain('2026');
    expect(formatDate('not-a-date')).toBe('-');
  });
});

