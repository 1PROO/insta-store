/** Allows only safe relative paths or http/https URLs; blocks javascript:/data: XSS. */
export function sanitizeHref(raw: string | null | undefined, fallback = '#'): string {
	if (!raw) return fallback;
	const trimmed = raw.trim();
	if (!trimmed) return fallback;
	if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
	try {
		const u = new URL(trimmed);
		if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
		return fallback;
	} catch {
		return fallback;
	}
}
