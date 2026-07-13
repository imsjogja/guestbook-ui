import type { RSVP } from '@/types';

const CSV_HEADERS = [
  'guest_name',
  'guest_id',
  'status',
  'guest_count',
  'message',
  'responded_at',
  'responded_via',
  'created_at',
  'updated_at',
] as const;

function csvEscape(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function normalizeCsvValue(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

export function buildRSVPExportCsv(rsvps: RSVP[]): string {
  const rows = rsvps.map((rsvp) =>
    [
      rsvp.guestName ?? '',
      rsvp.guestId,
      rsvp.status,
      rsvp.guestCount,
      rsvp.message ?? '',
      rsvp.respondedAt ?? '',
      rsvp.respondedVia,
      rsvp.createdAt,
      rsvp.updatedAt,
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
