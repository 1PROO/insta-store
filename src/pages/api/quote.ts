import type { APIRoute } from 'astro';
import { calculateOrderQuote } from '../../lib/commerce/pricing';
import { createStoreRepository } from '../../lib/data/store-repository';
import type { OrderItemInput } from '../../lib/domain/types';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const POST: APIRoute = async ({ request }) => {
	let body: { items?: OrderItemInput[]; shippingZoneId?: string; couponCode?: string | null };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON payload' }, 400);
	}

	const repo = createStoreRepository();
	const [config, products, zones] = await Promise.all([
		repo.getStoreConfig(),
		repo.getPublishedProducts(),
		repo.getActiveShippingZones(),
	]);

	const zone = zones.find((z) => z.id === body.shippingZoneId);
	if (!zone) return json({ ok: false, error: 'منطقة الشحن غير صالحة.' }, 400);

	const coupon = body.couponCode ? await repo.getCouponByCode(body.couponCode) : null;
	if (body.couponCode && !coupon) {
		return json({ ok: false, error: 'كود الخصم غير موجود.' }, 404);
	}

	const quote = calculateOrderQuote({
		items: Array.isArray(body.items) ? body.items : [],
		products,
		shippingZone: zone,
		globalFreeShippingThreshold: config.globalFreeShippingThreshold,
		coupon,
		nowIso: new Date().toISOString(),
	});

	if (!quote.ok) return json({ ok: false, error: quote.error }, 400);
	return json({ ok: true, quote }, 200);
};
