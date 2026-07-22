import type { Checkin, Guest, RSVP, RSVPStatus, Table } from '@/types';

export function buildRsvpByGuestId(rsvps: RSVP[]) {
  return new Map(rsvps.map((rsvp) => [rsvp.guestId, rsvp]));
}

export function buildTableByGuestId(tables: Table[]) {
  const tableByGuestId = new Map<string, string>();
  for (const table of tables) {
    for (const guestId of Array.isArray(table.assignedGuests) ? table.assignedGuests : []) {
      tableByGuestId.set(guestId, table.name);
    }
  }
  return tableByGuestId;
}

export function getGuestRsvpStatus(guest: Guest, rsvpByGuestId: Map<string, RSVP>): RSVPStatus {
  return rsvpByGuestId.get(guest.id)?.status
    ?? (guest.eventGuestId ? rsvpByGuestId.get(guest.eventGuestId)?.status : undefined)
    ?? 'no_response';
}

export function getGuestTableName(guest: Guest, tableByGuestId: Map<string, string>): string | undefined {
  return tableByGuestId.get(guest.id)
    ?? (guest.eventGuestId ? tableByGuestId.get(guest.eventGuestId) : undefined);
}

export function buildCheckinByGuestId(checkins: Checkin[]) {
  const checkinByGuestId = new Map<string, Checkin>();
  for (const checkin of checkins) {
    // Recent check-ins also contain failed and duplicate attempts. Only a
    // successful record represents the guest being checked in.
    if (checkin.status && checkin.status !== 'success') continue;
    if (!checkinByGuestId.has(checkin.guestId)) {
      checkinByGuestId.set(checkin.guestId, checkin);
    }
    if (checkin.eventGuestId && !checkinByGuestId.has(checkin.eventGuestId)) {
      checkinByGuestId.set(checkin.eventGuestId, checkin);
    }
  }
  return checkinByGuestId;
}

export function getGuestCheckin(guest: Guest, checkinByGuestId: Map<string, Checkin>): Checkin | undefined {
  return checkinByGuestId.get(guest.id)
    ?? (guest.eventGuestId ? checkinByGuestId.get(guest.eventGuestId) : undefined);
}
