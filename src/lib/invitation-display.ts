import type { Guest } from '@/types';

export function getInvitationGuestDisplay(
  guestId: string,
  guest?: Pick<Guest, 'fullName' | 'phone'>,
): { name: string; phone: string } {
  return {
    name: guest?.fullName?.trim() || `Tamu ${guestId.slice(0, 8)}`,
    phone: guest?.phone?.trim() || '-',
  };
}
