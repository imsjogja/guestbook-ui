import { describe, expect, it } from 'vitest';
import type { RSVP } from '@/types';
import { buildRSVPExportCsv } from './rsvp-csv';

function makeRsvp(overrides: Partial<RSVP> = {}): RSVP {
  return {
    id: 'rsvp-1',
    guestId: 'guest-1',
    guestName: 'Budi Santoso',
    eventId: 'event-1',
    status: 'attending',
    guestCount: 2,
    message: 'Sampai jumpa',
    respondedAt: '2026-01-02T10:00:00.000Z',
    respondedVia: 'manual',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('rsvp csv helpers', () => {
  it('builds csv rows with guest names and message escaping', () => {
    const csv = buildRSVPExportCsv([
      makeRsvp(),
      makeRsvp({ guestName: 'Rina "Sari"', status: 'maybe', message: 'Bawa anak, ya' }),
    ]);

    expect(csv).toContain('guest_name,guest_id,status,guest_count,message,responded_at,responded_via,created_at,updated_at');
    expect(csv).toContain('Budi Santoso');
    expect(csv).toContain('"Rina ""Sari"""');
    expect(csv).toContain('maybe');
    expect(csv).toContain('Bawa anak, ya');
  });
});
