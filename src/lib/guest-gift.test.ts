import { describe, expect, it } from 'vitest';
import { buildGiftMap, formatGiftAmount, parseGiftAmount } from './guest-gift';

describe('guest gift helpers', () => {
  it('parses formatted rupiah input into an integer amount', () => {
    expect(parseGiftAmount('Rp 1.250.000')).toBe(1250000);
    expect(parseGiftAmount('')).toBe(0);
    expect(parseGiftAmount('abc')).toBe(0);
  });

  it('formats amounts for display', () => {
    expect(formatGiftAmount(1250000)).toBe('1.250.000');
  });

  it('indexes gifts by master guest id', () => {
    const gift = {
      id: 'gift-1', tenantId: 'tenant-1', eventId: 'event-1', guestId: 'guest-1',
      eventGuestId: 'event-guest-1', amount: 100000, giftType: 'cash' as const,
      receivedAt: '', createdAt: '', updatedAt: '',
    };
    expect(buildGiftMap([gift]).get('guest-1')?.amount).toBe(100000);
  });
});
