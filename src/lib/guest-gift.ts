import type { GuestGift } from '@/types';

export type BackendGuestGift = {
  id: string;
  tenant_id: string;
  event_id: string;
  guest_id: string;
  event_guest_id: string;
  amount: number;
  gift_type?: string | null;
  notes?: string | null;
  received_at: string;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeGuestGift(raw: BackendGuestGift): GuestGift {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    eventId: raw.event_id,
    guestId: raw.guest_id,
    eventGuestId: raw.event_guest_id,
    amount: Number(raw.amount) || 0,
    giftType: raw.gift_type === 'transfer' || raw.gift_type === 'goods' || raw.gift_type === 'other'
      ? raw.gift_type
      : 'cash',
    notes: raw.notes ?? undefined,
    receivedAt: raw.received_at,
    recordedBy: raw.recorded_by ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function parseGiftAmount(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : 0;
}

export function formatGiftAmount(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function buildGiftMap(gifts: GuestGift[]): Map<string, GuestGift> {
  return new Map(gifts.map((gift) => [gift.guestId, gift]));
}
