import type { APIRoute } from 'astro';
import { checkRateLimit } from '../../lib/auth/rate-limit';
import { calculateOrderQuote, normalizeEgyptPhone } from '../../lib/commerce/pricing';
import { createStoreRepository } from '../../lib/data/store-repository';
import type { GuestOrder, OrderItemInput } from '../../lib/domain/types';
import { getWorkerEnv } from '../../lib/env';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

function generateOrderCode(): string {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(36).toUpperCase().padStart(2, '0'))
		.join('')
		.slice(0, 8);
}

interface OrderPayload {
	customerName?: string;
	customerPhone?: string;
	shippingZoneId?: string;
	address?: string;
	notes?: string;
	couponCode?: string | null;
	idempotencyKey?: string;
	turnstileToken?: string;
	items?: OrderItemInput[];
}

export const POST: APIRoute = async ({ request }) => {
	let body: OrderPayload;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON payload' }, 400);
	}

	const env = await getWorkerEnv();
	if (env.DB) {
		const ip = request.headers.get('cf-connecting-ip') || 'local';
		const rl = await checkRateLimit(env.DB, `order:${ip}`, 10, 10 * 60 * 1000);
		if (!rl.allowed) {
			return json(
				{ ok: false, error: 'تم إرسال طلبات كثيرة مؤقتاً. يرجى الانتظار دقائق قليلة.' },
				429,
			);
		}
	}

	if (env.TURNSTILE_SECRET_KEY) {
		const token = String(body.turnstileToken ?? '').trim();
		if (!token) {
			return json({ ok: false, error: 'يرجى إتمام التحقق الأمني أولاً.' }, 400);
		}
		const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
		});
		const verifyJson = (await verifyRes.json()) as { success?: boolean };
		if (!verifyJson.success) {
			return json({ ok: false, error: 'فشل التحقق الأمني (Turnstile).' }, 403);
		}
	}

	const name = String(body.customerName ?? '').trim();
	const address = String(body.address ?? '').trim();
	const notes = body.notes ? String(body.notes).trim() : null;
	const idempotencyKey = String(body.idempotencyKey ?? '').trim();
	const phone = normalizeEgyptPhone(String(body.customerPhone ?? ''));

	if (name.length < 2 || name.length > 80) {
		return json({ ok: false, error: 'يرجى إدخال اسم صحيح (2–80 حرفاً).' }, 400);
	}
	if (!phone) {
		return json({ ok: false, error: 'يرجى إدخال رقم موبايل مصري صحيح (01xxxxxxxxx).' }, 400);
	}
	if (address.length < 5 || address.length > 250) {
		return json({ ok: false, error: 'يرجى إدخال العنوان بالتفصيل (5–250 حرفاً).' }, 400);
	}
	if (notes && notes.length > 300) {
		return json({ ok: false, error: 'الملاحظات طويلة جداً (الحد 300 حرف).' }, 400);
	}
	if (!idempotencyKey || idempotencyKey.length > 80) {
		return json({ ok: false, error: 'Missing or invalid idempotencyKey' }, 400);
	}

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
		orderCode: generateOrderCode(),
		customerName: name,
		customerPhone: phone,
		shippingZoneId: zone.id,
		shippingZoneName: zone.name,
		address,
		notes,
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

	const saveRes = await repo.saveGuestOrder(order, coupon?.id ?? null);
	if (!saveRes.ok) return json({ ok: false, error: saveRes.error }, 409);
	return json({ ok: true, order }, 201);
};
