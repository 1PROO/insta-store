import type { APIRoute } from 'astro';
import { createSessionToken, verifyOriginCsrf, verifyPassword } from '../../../lib/auth/crypto';
import { ADMIN_COOKIE_NAME, type AdminUserRow } from '../../../lib/auth/guard';
import { checkRateLimit } from '../../../lib/auth/rate-limit';
import { recordAtomicLoginFailure, resetLoginFailures } from '../../../lib/data/d1-admin';
import { getWorkerEnv, resolveSessionSecret } from '../../../lib/env';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

const DUMMY_HASH =
	'pbkdf2_sha256$4000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const POST: APIRoute = async ({ request, cookies }) => {
	if (!verifyOriginCsrf(request)) {
		return json({ ok: false, error: 'CSRF validation failed' }, 403);
	}

	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	const email = String(body.email ?? '')
		.trim()
		.toLowerCase();
	const password = String(body.password ?? '');
	if (!email || !password) {
		return json({ ok: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' }, 400);
	}

	const env = await getWorkerEnv();
	if (!env.DB) return json({ ok: false, error: 'Database unavailable' }, 503);

	const ip = request.headers.get('cf-connecting-ip') || 'local';
	const rl = await checkRateLimit(env.DB, `login:${ip}`, 12, 15 * 60 * 1000);
	if (!rl.allowed) {
		return json({ ok: false, error: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.' }, 429);
	}

	const user = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ?')
		.bind(email)
		.first<AdminUserRow>();
	if (!user) {
		// Run dummy PBKDF2 to eliminate user-enumeration timing gap
		await verifyPassword(password, DUMMY_HASH);
		return json({ ok: false, error: 'بيانات الدخول غير صحيحة.' }, 401);
	}

	if (user.locked_until && user.locked_until > new Date().toISOString()) {
		return json(
			{ ok: false, error: 'تم قفل الحساب مؤقتاً لكثرة المحاولات الخاطئة. حاول بعد 15 دقيقة.' },
			429,
		);
	}

	const ok = await verifyPassword(password, user.password_hash);
	if (!ok) {
		await recordAtomicLoginFailure(env.DB, user.id);
		return json({ ok: false, error: 'بيانات الدخول غير صحيحة.' }, 401);
	}

	await resetLoginFailures(env.DB, user.id);
	const secret = resolveSessionSecret(env, request.url);
	const token = await createSessionToken(
		{ userId: user.id, sessionVersion: user.session_version, ttlSeconds: 60 * 60 * 24 * 7 },
		secret,
	);
	const isHttps = new URL(request.url).protocol === 'https:';
	cookies.set(ADMIN_COOKIE_NAME, token, {
		httpOnly: true,
		secure: isHttps,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});

	return json({ ok: true, mustChangePassword: user.must_change_password === 1 }, 200);
};
