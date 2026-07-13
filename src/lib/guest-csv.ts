import type { Guest } from '@/types';

const CSV_HEADERS = [
  'full_name',
  'nickname',
  'phone',
  'email',
  'address',
  'city',
  'country',
  'guest_type',
  'segment',
  'institution',
  'title',
  'relationship',
  'pic',
  'accessibility_needs',
  'dietary_restrictions',
  'allergies',
  'notes',
] as const;

function csvEscape(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function normalizeCsvValue(value?: string | boolean | number | null): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).trim();
}

function mapGuestType(category: Guest['category']): string {
  switch (category) {
    case 'vip':
      return 'vip';
    case 'family':
      return 'family';
    case 'friend':
      return 'friend';
    case 'colleague':
      return 'colleague';
    case 'partner':
      return 'vvip';
    case 'other':
    default:
      return 'general';
  }
}

export function buildGuestImportTemplateCsv(): string {
  return `${CSV_HEADERS.join(',')}\n`;
}

export function buildGuestExportCsv(guests: Guest[]): string {
  const rows = guests.map((guest) =>
    [
      guest.fullName,
      '',
      normalizeCsvValue(guest.phone),
      normalizeCsvValue(guest.email),
      '',
      '',
      '',
      mapGuestType(guest.category),
      normalizeCsvValue(guest.subgroup),
      '',
      '',
      '',
      '',
      '',
      normalizeCsvValue(guest.dietaryRestrictions),
      '',
      normalizeCsvValue(guest.notes),
    ]
      .map((value) => csvEscape(normalizeCsvValue(value)))
      .join(',')
  );

  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

