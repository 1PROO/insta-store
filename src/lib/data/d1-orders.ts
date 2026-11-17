import type { GuestOrder, OrderItemSnapshot, OrderStatus } from '../domain/types';

export function mapOrderRow(r: Record<string, unknown>): GuestOrder {
	return {
		id: String(r.id),
		orderCode: String(r.order_code),
		customerName: String(r.customer_name),
		customerPhone: String(r.customer_phone),
		shippingZoneId: String(r.shipping_zone_id),
		shippingZoneName: String(r.shipping_zone_name),
		address: String(r.address),
		notes: r.notes ? String(r.notes) : null,
		items: JSON.parse(String(r.items_json || '[]')) as OrderItemSnapshot[],
		subtotal: Number(r.subtotal),
		couponCode: r.coupon_code ? String(r.coupon_code) : null,
		discountAmount: Number(r.discount_amount),
		shippingFee: Number(r.shipping_fee),
		totalAmount: Number(r.total_amount),
		status: String(r.status) as OrderStatus,
		stockState: String(r.stock_state) as GuestOrder['stockState'],
		idempotencyKey: String(r.idempotency_key),
		createdAt: String(r.created_at),
	};
}

export async function findD1OrderByIdempotency(
	db: D1Database,
	key: string,
): Promise<GuestOrder | null> {
	const row = await db
		.prepare('SELECT * FROM orders WHERE idempotency_key = ?')
		.bind(key)
		.first<Record<string, unknown>>();
	return row ? mapOrderRow(row) : null;
}

/**
 * Executes conditional stock deduction + optional coupon increment + order insert
 * atomically inside D1.batch() so overselling cannot happen.
 */
export async function commitD1GuestOrder(
	db: D1Database,
	order: GuestOrder,
	couponId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const stmts: D1PreparedStatement[] = [];
	for (const item of order.items) {
		stmts.push(
			db
				.prepare('UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?')
				.bind(item.quantity, item.variantId, item.quantity),
		);
	}
	if (couponId) {
		stmts.push(
			db
				.prepare(
					'UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (max_uses IS NULL OR used_count < max_uses)',
				)
				.bind(couponId),
		);
	}
	stmts.push(
		db
			.prepare(
				`INSERT INTO orders (
					id, order_code, customer_name, customer_phone, shipping_zone_id, shipping_zone_name,
					address, notes, items_json, subtotal, coupon_code, discount_amount, shipping_fee,
					total_amount, status, stock_state, idempotency_key, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				order.id,
				order.orderCode,
				order.customerName,
				order.customerPhone,
				order.shippingZoneId,
				order.shippingZoneName,
				order.address,
				order.notes,
				JSON.stringify(order.items),
				order.subtotal,
				order.couponCode,
				order.discountAmount,
				order.shippingFee,
				order.totalAmount,
				order.status,
				order.stockState,
				order.idempotencyKey,
				order.createdAt,
			),
	);

	const results = await db.batch(stmts);
	for (let i = 0; i < order.items.length; i++) {
		if ((results[i]?.meta?.changes ?? 0) !== 1) {
			return { ok: false, error: 'نفذت الكمية المتاحة لأحد المنتجات أثناء إتمام الطلب.' };
		}
	}
	if (couponId && (results[order.items.length]?.meta?.changes ?? 0) !== 1) {
		return { ok: false, error: 'انتهت صلاحية كود الخصم أو حد الاستخدام.' };
	}
	return { ok: true };
}
