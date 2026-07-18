import type { Guest, RSVP, RSVPStatus, Table } from '@/types';

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
