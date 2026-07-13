import { describe, expect, it } from 'vitest';
import type { Guest } from '@/types';
import { buildGuestExportCsv, buildGuestImportTemplateCsv } from './guest-csv';

function makeGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: 'guest-1',
    tenantId: 'tenant-1',
    eventId: 'event-1',
    fullName: 'Budi "Santoso"',
    email: 'budi@example.com',
    phone: '08123456789',
    category: 'friend',
    subgroup: 'Teman Kantor',
    householdId: undefined,
    dietaryRestrictions: 'Tidak pedas',
    notes: 'Catatan, dengan koma',
    plusOne: false,
    plusOneName: undefined,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('guest csv helpers', () => {
  it('builds the import template header expected by the backend', () => {
    expect(buildGuestImportTemplateCsv()).toBe(
      'full_name,nickname,phone,email,address,city,country,guest_type,segment,institution,title,relationship,pic,accessibility_needs,dietary_restrictions,allergies,notes\n'
    );
  });

  it('exports guests with escaped values and backend-compatible guest types', () => {
    const csv = buildGuestExportCsv([
      makeGuest(),
      makeGuest({ fullName: 'Rina', category: 'partner', subgroup: 'VIP Undangan', notes: '' }),
    ]);

    expect(csv).toContain('full_name,nickname,phone,email,address,city,country,guest_type,segment,institution,title,relationship,pic,accessibility_needs,dietary_restrictions,allergies,notes');
    expect(csv).toContain('"Budi ""Santoso"""');
    expect(csv).toContain('friend');
    expect(csv).toContain('vvip');
    expect(csv).toContain('Catatan, dengan koma');
  });
});
