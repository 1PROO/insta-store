/** D1-backed sliding/fixed window rate limiter to protect login and guest checkout. */
export async function checkRateLimit(
	db: D1Database,
	key: string,
	maxHits: number,
	windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
	const now = Date.now();
	const existing = await db
		.prepare('SELECT hits, window_start_ms FROM rate_limits WHERE key = ?')
		.bind(key)
		.first<{ hits: number; window_start_ms: number }>();

	if (!existing || now - existing.window_start_ms >= windowMs) {
		await db
			.prepare(
				'INSERT INTO rate_limits (key, hits, window_start_ms) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = 1, window_start_ms = excluded.window_start_ms',
			)
			.bind(key, now)
			.run();
		return { allowed: true, retryAfterSec: 0 };
	}

	if (existing.hits >= maxHits) {
		const retryAfterSec = Math.max(
			1,
			Math.ceil((existing.window_start_ms + windowMs - now) / 1000),
		);
		return { allowed: false, retryAfterSec };
	}

	await db.prepare('UPDATE rate_limits SET hits = hits + 1 WHERE key = ?').bind(key).run();
	return { allowed: true, retryAfterSec: 0 };
}
