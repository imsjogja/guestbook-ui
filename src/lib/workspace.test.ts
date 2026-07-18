import { describe, expect, it } from 'vitest';
import type { Event } from '@/types';
import { pickCurrentEvent } from './workspace';

const eventA: Event = {
  id: 'event-a',
  tenantId: 'tenant-a',
  name: 'Acara A',
  eventType: 'wedding',
  startDate: '2026-07-18T00:00:00Z',
  location: 'Jakarta',
  status: 'published',
  updatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

const eventB = { ...eventA, id: 'event-b', name: 'Acara B' };

describe('pickCurrentEvent', () => {
  it('does not auto-select an event for a new workspace', () => {
    expect(pickCurrentEvent([eventA, eventB], null)).toBeNull();
  });

  it('keeps the selected event when it remains accessible', () => {
    expect(pickCurrentEvent([eventA, eventB], eventB)).toEqual(eventB);
  });

  it('clears a stale event that is no longer accessible', () => {
    expect(pickCurrentEvent([eventA], eventB)).toBeNull();
  });
});
