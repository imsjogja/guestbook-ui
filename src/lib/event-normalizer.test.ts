import { describe, expect, it } from 'vitest';
import { normalizeEvent, type BackendEvent } from './normalizers';

const baseEvent: BackendEvent = {
  id: 'event-1',
  tenant_id: 'tenant-1',
  name: 'Acara Demo',
  type: 'wedding',
  status: 'published',
  start_date: '2026-07-18T10:00:00Z',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
};

describe('normalizeEvent', () => {
  it('keeps business status separate from the selected context and maps live guest count', () => {
    const event = normalizeEvent({ ...baseEvent, guest_count: 42 });

    expect(event.status).toBe('published');
    expect(event.guestCount).toBe(42);
  });

  it('keeps compatibility with legacy status values without treating them as context selection', () => {
    expect(normalizeEvent({ ...baseEvent, status: 'active' }).status).toBe('published');
    expect(normalizeEvent({ ...baseEvent, status: 'paused' }).status).toBe('ongoing');
  });
});
