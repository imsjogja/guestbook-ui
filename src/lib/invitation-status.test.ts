import { describe, expect, it } from 'vitest';
import { normalizeInvitation } from './normalizers';

const baseInvitation = {
  id: 'invitation-1',
  tenant_id: 'tenant-1',
  event_id: 'event-1',
  guest_id: 'guest-1',
  url: 'https://guestflow.id/i/token',
  channel: null,
  created_at: '2026-07-18T14:00:00Z',
  updated_at: '2026-07-18T14:00:00Z',
};

describe('normalizeInvitation delivery state', () => {
  it('keeps RSVP lifecycle separate from provider delivery', () => {
    const invitation = normalizeInvitation({
      ...baseInvitation,
      status: 'responded',
      delivery_status: 'sent',
      delivery_channel: 'whatsapp',
      delivery_sent_at: '2026-07-18T14:01:00Z',
      delivery_provider_http_status: 200,
    });

    expect(invitation.status).toBe('responded');
    expect(invitation.deliveryStatus).toBe('sent');
    expect(invitation.deliverySentAt).toBe('2026-07-18T14:01:00Z');
    expect(invitation.deliveryProviderHttpStatus).toBe(200);
  });

  it('does not infer delivery from an invitation lifecycle status', () => {
    const invitation = normalizeInvitation({
      ...baseInvitation,
      status: 'responded',
    });

    expect(invitation.status).toBe('responded');
    expect(invitation.deliveryStatus).toBe('not_sent');
  });
});
