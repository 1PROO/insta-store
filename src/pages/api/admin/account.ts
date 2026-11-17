import type { APIRoute } from 'astro';
import { createSessionToken, hashPassword, verifyPassword } from '../../../lib/auth/crypto';
import { ADMIN_COOKIE_NAME, requireAdminApi } from '../../../lib/auth/guard';
import { getWorkerEnv, resolveSessionSecret } from '../../../lib/env';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: { currentPassword?: string; newPassword?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	const currentPwd = String(body.currentPassword ?? '');
	const newPwd = String(body.newPassword ?? '');
	if (newPwd.length < 8) {
		return json({ ok: false, error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.' }, 400);
	}

	const matches = await verifyPassword(currentPwd, auth.user.password_hash);
	if (!matches) {
		return json({ ok: false, error: 'كلمة المرور الحالية غير صحيحة.' }, 401);
	}

	const newHash = await hashPassword(newPwd);
	const nextVersion = auth.user.session_version + 1;
	await auth.db
		.prepare(
			'UPDATE admin_users SET password_hash = ?, session_version = ?, must_change_password = 0 WHERE id = ?',
		)
		.bind(newHash, nextVersion, auth.user.id)
		.run();

	const env = await getWorkerEnv();
	const token = await createSessionToken(
		{ userId: auth.user.id, sessionVersion: nextVersion, ttlSeconds: 60 * 60 * 24 * 7 },
		resolveSessionSecret(env),
	);
	cookies.set(ADMIN_COOKIE_NAME, token, {
		httpOnly: true,
		secure: new URL(request.url).protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});

	return json({ ok: true }, 200);
};
