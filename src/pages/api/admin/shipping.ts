import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { getD1ShippingZones } from '../../../lib/data/d1-store';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const zones = await getD1ShippingZones(auth.db, true);
	return json({ ok: true, zones });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	let body: { name?: string; fee?: number; freeShippingThreshold?: number | null };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}
	const name = String(body.name ?? '').trim();
	const fee = Number(body.fee ?? 0);
	if (name.length < 2 || fee < 0) {
		return json({ ok: false, error: 'أدخل اسم المحافظة وسعر شحن صحيح.' }, 400);
	}
	const id = crypto.randomUUID();
	await auth.db
		.prepare(
			'INSERT INTO shipping_zones (id, name, fee, free_shipping_threshold, is_active) VALUES (?, ?, ?, ?, 1)',
		)
		.bind(id, name, fee, body.freeShippingThreshold ?? null)
		.run();
	return json({ ok: true, id }, 201);
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const id = new URL(request.url).searchParams.get('id');
	if (!id) return json({ ok: false, error: 'Missing id' }, 400);
	await auth.db.prepare('DELETE FROM shipping_zones WHERE id = ?').bind(id).run();
	return json({ ok: true });
};
