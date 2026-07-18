import { describe, expect, it } from 'vitest';
import { getInvitationGuestDisplay } from './invitation-display';

describe('getInvitationGuestDisplay', () => {
  it('returns the guest name and WhatsApp number', () => {
    expect(getInvitationGuestDisplay('d71daae3-guest', {
      fullName: 'Budi Santoso',
      phone: '628123456789',
    })).toEqual({ name: 'Budi Santoso', phone: '628123456789' });
  });

  it('uses a dash when the WhatsApp number is missing', () => {
    expect(getInvitationGuestDisplay('d71daae3-guest', {
      fullName: 'Budi Santoso',
    })).toEqual({ name: 'Budi Santoso', phone: '-' });
  });

  it('keeps an ID fallback when the guest roster has no matching record', () => {
    expect(getInvitationGuestDisplay('d71daae3-guest')).toEqual({
      name: 'Tamu d71daae3',
      phone: '-',
    });
  });
});
