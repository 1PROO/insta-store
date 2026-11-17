import type { APIRoute } from 'astro';
import { calculateOrderQuote, normalizeEgyptPhone } from '../../lib/commerce/pricing';
import { createStoreRepository } from '../../lib/data/store-repository';
import type { GuestOrder, OrderItemInput } from '../../lib/domain/types';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

interface OrderPayload {
	customerName?: string;
	customerPhone?: string;
	shippingZoneId?: string;
	address?: string;
	notes?: string;
	couponCode?: string | null;
	idempotencyKey?: string;
	items?: OrderItemInput[];
}

export const POST: APIRoute = async ({ request }) => {
	let body: OrderPayload;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON payload' }, 400);
	}

	const name = String(body.customerName ?? '').trim();
	const address = String(body.address ?? '').trim();
	const idempotencyKey = String(body.idempotencyKey ?? '').trim();
	const phone = normalizeEgyptPhone(String(body.customerPhone ?? ''));

	if (name.length < 2) return json({ ok: false, error: 'يرجى إدخال الاسم بالكامل.' }, 400);
	if (!phone)
		return json({ ok: false, error: 'يرجى إدخال رقم موبايل مصري صحيح (01xxxxxxxxx).' }, 400);
	if (address.length < 5) return json({ ok: false, error: 'يرجى إدخال العنوان بالتفصيل.' }, 400);
	if (!idempotencyKey) return json({ ok: false, error: 'Missing idempotencyKey' }, 400);

	const repo = createStoreRepository();
	const existing = await repo.findOrderByIdempotencyKey(idempotencyKey);
	if (existing) {
		return json({ ok: true, order: existing }, 200);
	}

	const [config, products, zones] = await Promise.all([
		repo.getStoreConfig(),
		repo.getPublishedProducts(),
		repo.getActiveShippingZones(),
	]);

	const zone = zones.find((z) => z.id === body.shippingZoneId);
	if (!zone) return json({ ok: false, error: 'منطقة الشحن غير صالحة.' }, 400);

	const coupon = body.couponCode ? await repo.getCouponByCode(body.couponCode) : null;
	if (body.couponCode && !coupon) {
		return json({ ok: false, error: 'كود الخصم غير صالح.' }, 400);
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

	const order: GuestOrder = {
		id: crypto.randomUUID(),
		orderCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
		customerName: name,
		customerPhone: phone,
		shippingZoneId: zone.id,
		shippingZoneName: zone.name,
		address,
		notes: body.notes ? String(body.notes).trim() : null,
		items: quote.items,
		subtotal: quote.subtotal,
		couponCode: quote.appliedCouponCode,
		discountAmount: quote.discountAmount,
		shippingFee: quote.shippingFee,
		totalAmount: quote.totalAmount,
		status: 'new',
		stockState: 'reserved',
		idempotencyKey,
		createdAt: new Date().toISOString(),
	};

	await repo.saveGuestOrder(order);
	return json({ ok: true, order }, 201);
};
