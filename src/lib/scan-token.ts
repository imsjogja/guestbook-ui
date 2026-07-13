export function normalizeScanToken(raw: string) {
  const value = raw.trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? value;
  } catch {
    const urlMatch = value.match(/\/i\/([^/?#]+)/i);
    if (urlMatch?.[1]) return decodeURIComponent(urlMatch[1]);
    return value;
  }
}
