import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { purgeEdgeStorefrontCache } from '../../../lib/cache/edge-cache';
import { getD1Products } from '../../../lib/data/d1-store';
import { getWorkerEnv } from '../../../lib/env';
import { cleanupD1MediaAssets } from '../../../lib/media/cloudinary';
import { slugify, validatePublishableProduct } from '../../../lib/validation/admin-validators';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeVariantId(raw?: string): string {
	return raw && UUID_RE.test(raw) ? raw : crypto.randomUUID();
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

interface VariantBody {
	id?: string;
	size: string;
	colorName: string;
	colorHex: string;
	stock: number;
	priceOverride?: number | null;
}

interface ProductBody {
	id?: string;
	title?: string;
	slug?: string;
	description?: string;
	fabricCare?: string | null;
	sizeGuide?: string | null;
	basePrice?: number;
	compareAtPrice?: number | null;
	collectionId?: string;
	images?: string[];
	status?: 'published' | 'hidden';
	isFeatured?: boolean;
	variants?: VariantBody[];
}

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const url = new URL(request.url);
	const trash = url.searchParams.get('trash') === '1';
	const products = await getD1Products(auth.db, { includeHidden: true, onlyDeleted: trash });
	return json({ ok: true, products });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: ProductBody;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	const title = String(body.title ?? '').trim();
	const slug = slugify(body.slug?.trim() || title);
	const basePrice = Number(body.basePrice ?? 0);
	const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
	const variants = Array.isArray(body.variants) ? body.variants : [];
	const status = body.status === 'published' ? 'published' : 'hidden';

	if (status === 'published') {
		const check = validatePublishableProduct({
			title,
			basePrice,
			images,
			variantsCount: variants.length,
		});
		if (!check.ok) return json({ ok: false, error: check.error }, 400);
	}

	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const stmts: D1PreparedStatement[] = [
		auth.db
			.prepare(
				`INSERT INTO products (
					id, title, slug, description, fabric_care, size_guide, base_price,
					compare_at_price, collection_id, images_json, status, is_featured,
					was_ever_published, deleted_at, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
			)
			.bind(
				id,
				title || 'منتج جديد',
				slug,
				String(body.description ?? '').trim(),
				body.fabricCare?.trim() || null,
				body.sizeGuide?.trim() || null,
				basePrice,
				body.compareAtPrice ?? null,
				String(body.collectionId ?? ''),
				JSON.stringify(images),
				status,
				body.isFeatured ? 1 : 0,
				status === 'published' ? 1 : 0,
				now,
			),
	];

	for (const v of variants) {
		stmts.push(
			auth.db
				.prepare(
					'INSERT INTO variants (id, product_id, size, color_name, color_hex, stock, price_override) VALUES (?, ?, ?, ?, ?, ?, ?)',
				)
				.bind(
					crypto.randomUUID(),
					id,
					String(v.size || 'M').trim(),
					String(v.colorName || 'أسود').trim(),
					String(v.colorHex || '#111111').trim(),
					Math.max(0, Number(v.stock ?? 0)),
					v.priceOverride ?? null,
				),
		);
	}

	try {
		await auth.db.batch(stmts);
	} catch {
		return json({ ok: false, error: 'تعذر حفظ المنتج (تأكد من أن الرابط الثابت غير مكرر).' }, 400);
	}
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true, id, slug }, 201);
};

export const PUT: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: ProductBody;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}
	if (!body.id) return json({ ok: false, error: 'Missing product id' }, 400);

	const existing = await auth.db
		.prepare('SELECT slug, was_ever_published FROM products WHERE id = ?')
		.bind(body.id)
		.first<{ slug: string; was_ever_published: number }>();
	if (!existing) return json({ ok: false, error: 'المنتج غير موجود.' }, 404);

	const title = String(body.title ?? '').trim();
	const basePrice = Number(body.basePrice ?? 0);
	const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
	const variants = Array.isArray(body.variants) ? body.variants : [];
	const status = body.status === 'published' ? 'published' : 'hidden';

	if (status === 'published') {
		const check = validatePublishableProduct({
			title,
			basePrice,
			images,
			variantsCount: variants.length,
		});
		if (!check.ok) return json({ ok: false, error: check.error }, 400);
	}

	const nextSlug =
		existing.was_ever_published === 1 ? existing.slug : slugify(body.slug?.trim() || existing.slug);
	const everPub = existing.was_ever_published === 1 || status === 'published' ? 1 : 0;

	const stmts: D1PreparedStatement[] = [
		auth.db
			.prepare(
				`UPDATE products SET
					title = ?, slug = ?, description = ?, fabric_care = ?, size_guide = ?,
					base_price = ?, compare_at_price = ?, collection_id = ?, images_json = ?,
					status = ?, is_featured = ?, was_ever_published = ?
				WHERE id = ?`,
			)
			.bind(
				title,
				nextSlug,
				String(body.description ?? '').trim(),
				body.fabricCare?.trim() || null,
				body.sizeGuide?.trim() || null,
				basePrice,
				body.compareAtPrice ?? null,
				String(body.collectionId ?? ''),
				JSON.stringify(images),
				status,
				body.isFeatured ? 1 : 0,
				everPub,
				body.id,
			),
		auth.db.prepare('DELETE FROM variants WHERE product_id = ?').bind(body.id),
	];

	for (const v of variants) {
		stmts.push(
			auth.db
				.prepare(
					'INSERT INTO variants (id, product_id, size, color_name, color_hex, stock, price_override) VALUES (?, ?, ?, ?, ?, ?, ?)',
				)
				.bind(
					safeVariantId(v.id),
					body.id,
					String(v.size || 'M').trim(),
					String(v.colorName || 'أسود').trim(),
					String(v.colorHex || '#111111').trim(),
					Math.max(0, Number(v.stock ?? 0)),
					v.priceOverride ?? null,
				),
		);
	}

	try {
		await auth.db.batch(stmts);
	} catch {
		return json({ ok: false, error: 'تعذر تحديث المنتج.' }, 400);
	}
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true, slugLocked: existing.was_ever_published === 1 });
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: { id?: string; action?: 'trash' | 'restore' | 'publish' | 'hide' };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}
	if (!body.id) return json({ ok: false, error: 'Missing id' }, 400);

	if (body.action === 'trash') {
		await auth.db
			.prepare("UPDATE products SET deleted_at = ?, status = 'hidden' WHERE id = ?")
			.bind(new Date().toISOString(), body.id)
			.run();
	} else if (body.action === 'restore') {
		await auth.db.prepare('UPDATE products SET deleted_at = NULL WHERE id = ?').bind(body.id).run();
	} else if (body.action === 'hide') {
		await auth.db.prepare("UPDATE products SET status = 'hidden' WHERE id = ?").bind(body.id).run();
	} else if (body.action === 'publish') {
		await auth.db
			.prepare("UPDATE products SET status = 'published', was_ever_published = 1 WHERE id = ?")
			.bind(body.id)
			.run();
	}
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const id = new URL(request.url).searchParams.get('id');
	if (!id) return json({ ok: false, error: 'Missing id' }, 400);

	const prod = await auth.db
		.prepare('SELECT images_json FROM products WHERE id = ? AND deleted_at IS NOT NULL')
		.bind(id)
		.first<{ images_json: string }>();
	if (prod) {
		const env = await getWorkerEnv();
		await cleanupD1MediaAssets(auth.db, env, JSON.parse(prod.images_json || '[]') as string[]);
	}

	await auth.db
		.prepare('DELETE FROM products WHERE id = ? AND deleted_at IS NOT NULL')
		.bind(id)
		.run();
	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true });
};
