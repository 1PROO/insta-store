const CACHE_PREFIX = 'https://edge-cache.internal/v1';
const TRACKED_PATHS = ['/', '/shop', '/design-system', '/sitemap.xml'];

/**
 * Caches public Storefront GET HTML in Cloudflare Cache API (caches.default)
 * and purges tracked keys when admin writes change Storefront data.
 */
export async function getEdgeCachedResponse(request: Request): Promise<Response | undefined> {
	if (typeof caches === 'undefined') return undefined;
	try {
		const cache = (caches as unknown as { default?: Cache }).default;
		if (!cache) return undefined;
		const url = new URL(request.url);
		const key = new Request(`${CACHE_PREFIX}${url.pathname}${url.search}`, { method: 'GET' });
		const hit = await cache.match(key);
		if (!hit) return undefined;
		// Wrap cached Response in mutable Headers so Astro/Workerd never throws on header writes.
		return new Response(hit.body, {
			status: hit.status,
			statusText: hit.statusText,
			headers: new Headers(hit.headers),
		});
	} catch {
		return undefined;
	}
}

export async function putEdgeCachedResponse(request: Request, response: Response): Promise<void> {
	if (typeof caches === 'undefined' || response.status !== 200) return;
	try {
		const cache = (caches as unknown as { default?: Cache }).default;
		if (!cache) return;
		const url = new URL(request.url);
		const key = new Request(`${CACHE_PREFIX}${url.pathname}${url.search}`, { method: 'GET' });
		const cloned = new Response(response.clone().body, response);
		cloned.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
		await cache.put(key, cloned);
	} catch {
		// Cache API unavailable outside edge runtime
	}
}

export async function purgeEdgeStorefrontCache(_originUrl: string): Promise<void> {
	if (typeof caches === 'undefined') return;
	try {
		const cache = (caches as unknown as { default?: Cache }).default;
		if (!cache) return;
		await Promise.all(
			TRACKED_PATHS.map((p) => cache.delete(new Request(`${CACHE_PREFIX}${p}`, { method: 'GET' }))),
		);
	} catch {
		// Ignore outside edge runtime
	}
}
