import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { purgeEdgeStorefrontCache } from '../../../lib/cache/edge-cache';
import { getD1Collections } from '../../../lib/data/d1-store';
import { slugify } from '../../../lib/validation/admin-validators';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const collections = await getD1Collections(auth.db, true);
	return json({ ok: true, collections });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	let body: { name?: string; slug?: string; imageUrl?: string; sortOrder?: number };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}
	const name = String(body.name ?? '').trim();
	if (name.length < 2) return json({ ok: false, error: 'أدخل اسم القسم.' }, 400);
	const slug = slugify(body.slug?.trim() || name);
	const id = crypto.randomUUID();
	try {
		await auth.db
			.prepare(
				'INSERT INTO collections (id, name, slug, image_url, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, 1)',
			)
			.bind(
				id,
				name,
				slug,
				String(body.imageUrl || '/samples/linen-shirt.svg').trim(),
				Number(body.sortOrder ?? 0),
			)
			.run();
	} catch {
		return json({ ok: false, error: 'الرابط الثابت للقسم مستخدم بالفعل.' }, 400);
	}
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true, id, slug }, 201);
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const id = new URL(request.url).searchParams.get('id');
	if (!id) return json({ ok: false, error: 'Missing id' }, 400);

	const activeCount = await auth.db
		.prepare('SELECT COUNT(*) as cnt FROM products WHERE collection_id = ? AND deleted_at IS NULL')
		.bind(id)
		.first<{ cnt: number }>();
	if ((activeCount?.cnt ?? 0) > 0) {
		return json(
			{ ok: false, error: 'لا يمكن حذف قسم يحتوي على منتجات نشطة. انقل المنتجات أولاً.' },
			409,
		);
	}
	await auth.db.prepare('DELETE FROM collections WHERE id = ?').bind(id).run();
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true });
};
