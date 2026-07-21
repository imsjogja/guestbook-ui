import { describe, expect, it } from 'vitest';
import { normalizePaymentHistory, normalizePlansResponse } from './useSubscription';

describe('subscription response normalization', () => {
  it('normalizes the billing plans envelope', () => {
    const result = normalizePlansResponse({
      data: {
        plans: [{ id: 'starter-monthly' }],
        client_key: 'sandbox-client',
        snap_url: 'https://example.test/snap.js',
      },
    });

    expect(result.plans).toHaveLength(1);
    expect(result.client_key).toBe('sandbox-client');
  });

  it('returns an empty payment history for object error payloads', () => {
    expect(normalizePaymentHistory({ error: 'unauthorized' })).toEqual([]);
    expect(normalizePaymentHistory({ data: { items: [] } })).toEqual([]);
  });

  it('supports both direct arrays and nested data arrays', () => {
    const item = { id: 'payment-1' };
    expect(normalizePaymentHistory([item])).toEqual([item]);
    expect(normalizePaymentHistory({ data: [item] })).toEqual([item]);
  });
});
