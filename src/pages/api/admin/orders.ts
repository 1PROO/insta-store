import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { listD1Orders, updateD1OrderStatus } from '../../../lib/data/d1-admin';
import type { OrderStatus } from '../../../lib/domain/types';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

const VALID_STATUSES = new Set<OrderStatus>([
	'new',
	'confirmed',
	'shipped',
	'delivered',
	'cancelled',
]);

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const status = new URL(request.url).searchParams.get('status');
	const orders = await listD1Orders(auth.db, status);
	return json({ ok: true, orders });
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: { orderId?: string; orderIds?: string[]; status?: OrderStatus };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	if (!body.status || !VALID_STATUSES.has(body.status)) {
		return json({ ok: false, error: 'حالة طلب غير صالحة.' }, 400);
	}

	const ids = body.orderIds?.length ? body.orderIds : body.orderId ? [body.orderId] : [];
	if (!ids.length) return json({ ok: false, error: 'Missing orderId' }, 400);

	for (const id of ids) {
		const res = await updateD1OrderStatus(auth.db, id, body.status);
		if (!res.ok) return json({ ok: false, error: res.error }, 400);
	}
	return json({ ok: true });
};
