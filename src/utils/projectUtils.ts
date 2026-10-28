export function isValidUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ensureHttpPrefix(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function parseTechStack(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((t) => t.trim()).filter(Boolean);
  }
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
