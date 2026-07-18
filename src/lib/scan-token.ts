export function normalizeScanToken(raw: string) {
  const value = raw.trim().replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  if (!value) return '';

  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? value;
  } catch {
    const urlMatch = value.match(/\/(?:i|rsvp)\/([^/?#\s]+)/i);
    if (urlMatch?.[1]) {
      try {
        return decodeURIComponent(urlMatch[1]);
      } catch {
        return urlMatch[1];
      }
    }
    return value.replace(/[\r\n]+/g, '');
  }
}
