import type { APIRoute } from 'astro';
import { verifyOriginCsrf } from '../../../lib/auth/crypto';
import { ADMIN_COOKIE_NAME } from '../../../lib/auth/guard';

export const POST: APIRoute = async ({ request, cookies }) => {
	if (!verifyOriginCsrf(request)) {
		return new Response(JSON.stringify({ ok: false, error: 'CSRF check failed' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	cookies.delete(ADMIN_COOKIE_NAME, { path: '/' });
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
