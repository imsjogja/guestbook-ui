import { describe, expect, it } from 'vitest';
import { normalizeScanToken } from './scan-token';

describe('normalizeScanToken', () => {
  it('extracts the token from an invitation URL', () => {
    expect(normalizeScanToken('https://app.guestflow.id/i/abc123-token')).toBe('abc123-token');
  });

  it('returns a plain token unchanged', () => {
    expect(normalizeScanToken('abc123-token')).toBe('abc123-token');
  });

  it('preserves URL-safe tokens with base64 padding', () => {
    expect(normalizeScanToken('9y9b7Rvr_3CpiGplVUb24xpPuOxo_d262wAkicdgVm4=')).toBe(
      '9y9b7Rvr_3CpiGplVUb24xpPuOxo_d262wAkicdgVm4='
    );
  });

  it('supports legacy RSVP links and scanner control characters', () => {
    expect(normalizeScanToken('  https://guestflow.id/rsvp/token-123\n')).toBe('token-123');
    expect(normalizeScanToken('token-123\u200B')).toBe('token-123');
  });
});
