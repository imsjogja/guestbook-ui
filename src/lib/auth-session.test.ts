import { describe, expect, it } from 'vitest';
import { isAuthResponse } from './auth-session';

describe('isAuthResponse', () => {
  it('accepts a verification response that contains a session', () => {
    expect(isAuthResponse({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { id: 'user-1' },
    })).toBe(true);
  });

  it('rejects the legacy message-only verification response', () => {
    expect(isAuthResponse({ message: 'email berhasil diverifikasi' })).toBe(false);
  });
});
