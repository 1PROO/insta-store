import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const { results } = await auth.db.prepare('SELECT * FROM coupons ORDER BY code ASC').all();
	return json({ ok: true, coupons: results });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	let body: {
		code?: string;
		type?: 'percentage' | 'fixed';
		value?: number;
		minSubtotal?: number | null;
		maxUses?: number | null;
	};
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}
	const code = String(body.code ?? '')
		.trim()
		.toUpperCase();
	const type = body.type === 'fixed' ? 'fixed' : 'percentage';
	const value = Number(body.value ?? 0);
	if (code.length < 3 || value <= 0 || (type === 'percentage' && value > 90)) {
		return json({ ok: false, error: 'كود الخصم أو النسبة غير صالحة (النسبة بين 1 و 90%).' }, 400);
	}
	const id = crypto.randomUUID();
	try {
		await auth.db
			.prepare(
				'INSERT INTO coupons (id, code, type, value, min_subtotal, max_uses, used_count, is_active) VALUES (?, ?, ?, ?, ?, ?, 0, 1)',
			)
			.bind(id, code, type, value, body.minSubtotal ?? null, body.maxUses ?? null)
			.run();
	} catch {
		return json({ ok: false, error: 'هذا الكود موجود بالفعل.' }, 400);
	}
	return json({ ok: true, id, code }, 201);
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const body = (await request.json().catch(() => ({}))) as { id?: string; isActive?: boolean };
	if (!body.id) return json({ ok: false, error: 'Missing id' }, 400);
	await auth.db
		.prepare('UPDATE coupons SET is_active = ? WHERE id = ?')
		.bind(body.isActive ? 1 : 0, body.id)
		.run();
	return json({ ok: true });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const id = new URL(request.url).searchParams.get('id');
	if (!id) return json({ ok: false, error: 'Missing id' }, 400);
	await auth.db.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
	return json({ ok: true });
};
