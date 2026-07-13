import { describe, expect, it } from 'vitest';
import { slugifyTenantName } from './slugify';

describe('slugifyTenantName', () => {
  it('normalizes spacing and punctuation', () => {
    expect(slugifyTenantName('PT Sukses Abadi!')).toBe('pt-sukses-abadi');
  });

  it('trims leading and trailing separators', () => {
    expect(slugifyTenantName('  ---GuestFlow Demo---  ')).toBe('guestflow-demo');
  });
});
