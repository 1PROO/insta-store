import type { AstroCookies } from 'astro';
import { getWorkerEnv, resolveSessionSecret } from '../env';
import { verifyOriginCsrf, verifySessionToken } from './crypto';

export const ADMIN_COOKIE_NAME = 'admin_session';

export interface AdminUserRow {
	id: string;
	email: string;
	password_hash: string;
	session_version: number;
	must_change_password: number;
	failed_attempts: number;
	locked_until: string | null;
}

export async function getAuthenticatedAdmin(cookies: AstroCookies): Promise<AdminUserRow | null> {
	const token = cookies.get(ADMIN_COOKIE_NAME)?.value;
	if (!token) return null;

	const env = await getWorkerEnv();
	if (!env.DB) return null;
	const secret = resolveSessionSecret(env);

	const parts = token.split('.');
	if (parts.length !== 2 || !parts[0]) return null;
	let parsedUserId = '';
	try {
		const pad = parts[0].length % 4 === 0 ? '' : '='.repeat(4 - (parts[0].length % 4));
		const decoded = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/') + pad)) as {
			userId?: string;
		};
		parsedUserId = decoded.userId ?? '';
	} catch {
		return null;
	}
	if (!parsedUserId) return null;

	const user = await env.DB.prepare('SELECT * FROM admin_users WHERE id = ?')
		.bind(parsedUserId)
		.first<AdminUserRow>();
	if (!user) return null;

	const verified = await verifySessionToken(token, secret, user.session_version);
	return verified ? user : null;
}

export async function requireAdminApi(
	request: Request,
	cookies: AstroCookies,
): Promise<{ ok: true; user: AdminUserRow; db: D1Database } | { ok: false; response: Response }> {
	if (!verifyOriginCsrf(request)) {
		return {
			ok: false,
			response: new Response(JSON.stringify({ ok: false, error: 'CSRF check failed' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			}),
		};
	}

	const env = await getWorkerEnv();
	if (!env.DB) {
		return {
			ok: false,
			response: new Response(JSON.stringify({ ok: false, error: 'Database unavailable' }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			}),
		};
	}

	const user = await getAuthenticatedAdmin(cookies);
	if (!user) {
		return {
			ok: false,
			response: new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			}),
		};
	}

	return { ok: true, user, db: env.DB };
}
