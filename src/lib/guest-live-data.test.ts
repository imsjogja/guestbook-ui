import { describe, expect, it } from 'vitest';
import type { Checkin, Guest, RSVP, Table } from '@/types';
import {
  buildCheckinByGuestId,
  buildRsvpByGuestId,
  buildTableByGuestId,
  getGuestCheckin,
  getGuestRsvpStatus,
  getGuestTableName,
} from './guest-live-data';

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

  it('joins only successful check-ins and supports the event guest id', () => {
    const failed: Checkin = {
      id: 'checkin-failed', guestId: 'guest-1', eventId: 'event-1', status: 'duplicate',
      checkinMethod: 'qr', checkedInBy: 'System', checkedInAt: '2026-07-22T08:00:00Z',
    };
    const successful: Checkin = {
      id: 'checkin-success', guestId: 'guest-1', eventGuestId: 'event-guest-1', eventId: 'event-1', status: 'success',
      checkinMethod: 'qr', checkedInBy: 'System', checkedInAt: '2026-07-22T08:01:00Z',
    };

    const map = buildCheckinByGuestId([failed, successful]);
    expect(getGuestCheckin(guest, map)?.id).toBe('checkin-success');
    expect(getGuestCheckin({ ...guest, id: 'other', eventGuestId: 'event-guest-1' }, map)?.id).toBe('checkin-success');
    expect(getGuestCheckin({ ...guest, id: 'other', eventGuestId: 'other-event-guest' }, map)).toBeUndefined();
  });
});
