import { describe, expect, it } from 'vitest';
import { toEventUpdatePayload } from '@/hooks/useEvents';

describe('toEventUpdatePayload', () => {
  it('maps legacy birthday type before sending an update', () => {
    expect(toEventUpdatePayload({ eventType: 'birthday', status: 'published' })).toEqual({
      type: 'gathering',
      status: 'published',
    });
  });

  it('maps legacy other type before sending an update', () => {
    expect(toEventUpdatePayload({ eventType: 'other', status: 'ongoing' })).toEqual({
      type: 'community',
      status: 'ongoing',
    });
  });
});
