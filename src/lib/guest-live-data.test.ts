import { describe, expect, it } from 'vitest';
import type { Guest, RSVP, Table } from '@/types';
import { buildRsvpByGuestId, buildTableByGuestId, getGuestRsvpStatus, getGuestTableName } from './guest-live-data';

const guest: Guest = {
  id: 'guest-1',
  eventGuestId: 'event-guest-1',
  tenantId: 'tenant-1',
  eventId: 'event-1',
  fullName: 'Tamu Satu',
  category: 'friend',
  plusOne: false,
  createdAt: '',
  updatedAt: '',
};

describe('guest live data joins', () => {
  it('joins RSVP by guest id and defaults to no response', () => {
    const rsvp: RSVP = {
      id: 'rsvp-1', guestId: 'guest-1', eventId: 'event-1', status: 'attending',
      guestCount: 2, respondedVia: 'web', createdAt: '', updatedAt: '',
    };
    const map = buildRsvpByGuestId([rsvp]);

    expect(getGuestRsvpStatus(guest, map)).toBe('attending');
    expect(getGuestRsvpStatus({ ...guest, id: 'other' }, map)).toBe('no_response');
  });

  it('falls back to event guest id for roster-scoped responses and seating', () => {
    const rsvp: RSVP = {
      id: 'rsvp-1', guestId: 'event-guest-1', eventId: 'event-1', status: 'maybe',
      guestCount: 1, respondedVia: 'manual', createdAt: '', updatedAt: '',
    };
    const table: Table = {
      id: 'table-1', eventId: 'event-1', name: 'Meja 1', shape: 'round', capacity: 8,
      positionX: 0, positionY: 0, assignedGuests: ['event-guest-1'],
    };

    expect(getGuestRsvpStatus(guest, buildRsvpByGuestId([rsvp]))).toBe('maybe');
    expect(getGuestTableName(guest, buildTableByGuestId([table]))).toBe('Meja 1');
  });
});
