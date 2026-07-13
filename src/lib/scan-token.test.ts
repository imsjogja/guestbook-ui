import { describe, expect, it } from 'vitest';
import { normalizeScanToken } from './scan-token';

describe('normalizeScanToken', () => {
  it('extracts the token from an invitation URL', () => {
    expect(normalizeScanToken('https://app.guestflow.id/i/abc123-token')).toBe('abc123-token');
  });

  it('returns a plain token unchanged', () => {
    expect(normalizeScanToken('abc123-token')).toBe('abc123-token');
  });
});
