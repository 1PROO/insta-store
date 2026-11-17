import { defineMiddleware } from 'astro:middleware';
import { getEdgeCachedResponse, putEdgeCachedResponse } from './lib/cache/edge-cache';

const CSP_DIRECTIVES = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://connect.facebook.net https://analytics.tiktok.com",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://res.cloudinary.com https:",
	"media-src 'self' blob: https://res.cloudinary.com https:",
	"connect-src 'self' https://api.cloudinary.com https://challenges.cloudflare.com https://www.facebook.com https://analytics.tiktok.com",
	'frame-src https://challenges.cloudflare.com',
].join('; ');

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;
	const isPublicStorefrontGet =
		context.request.method === 'GET' &&
		!pathname.startsWith('/admin') &&
		!pathname.startsWith('/api/') &&
		!pathname.startsWith('/checkout') &&
		!context.url.searchParams.has('lang') &&
		!context.cookies.get('ui_lang');

	if (isPublicStorefrontGet) {
		const cached = await getEdgeCachedResponse(context.request);
		if (cached) return cached;
	}

	const response = await next();

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', CSP_DIRECTIVES);

	if (context.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
		response.headers.set('Cache-Control', 'no-store');
	} else if (isPublicStorefrontGet && response.status === 200) {
		await putEdgeCachedResponse(context.request, response);
	}

	return response;
});
