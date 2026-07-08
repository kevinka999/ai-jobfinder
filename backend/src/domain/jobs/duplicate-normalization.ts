const TRACKING_QUERY_KEYS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid']);

export function normalizeApplicationUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  try {
    const url = new URL(trimmedValue);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';

    for (const key of Array.from(url.searchParams.keys())) {
      const normalizedKey = key.toLowerCase();

      if (
        normalizedKey.startsWith('utm_') ||
        TRACKING_QUERY_KEYS.has(normalizedKey)
      ) {
        url.searchParams.delete(key);
      }
    }

    const pathname = url.pathname.replace(/\/+$/, '');
    url.searchParams.sort();
    const queryString = url.searchParams.toString();

    return `${url.protocol}//${url.host}${pathname}${queryString ? `?${queryString}` : ''}`;
  } catch {
    return trimmedValue.toLowerCase().replace(/\/+$/, '');
  }
}

export function normalizeComparableText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
