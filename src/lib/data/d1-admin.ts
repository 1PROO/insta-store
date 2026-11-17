import type { OrderStatus } from '../domain/types';
import { mapOrderRow } from './d1-orders';

export async function listD1Orders(db: D1Database, statusFilter?: string | null) {
	const sql = statusFilter
		? 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 100'
		: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100';
	const stmt = statusFilter ? db.prepare(sql).bind(statusFilter) : db.prepare(sql);
	const { results } = await stmt.all<Record<string, unknown>>();
	return results.map(mapOrderRow);
}

/**
 * Transitions order status safely; cancelling an order with stock_state = 'reserved'
 * atomically restores variant stock and marks stock_state = 'released'.
 * Cancelled orders cannot be reactivated without creating a new order.
 */
export async function updateD1OrderStatus(
	db: D1Database,
	orderId: string,
	nextStatus: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const row = await db
		.prepare('SELECT * FROM orders WHERE id = ?')
		.bind(orderId)
		.first<Record<string, unknown>>();
	if (!row) return { ok: false, error: 'الطلب غير موجود.' };

	const order = mapOrderRow(row);
	if (order.status === 'cancelled' && nextStatus !== 'cancelled') {
		return { ok: false, error: 'لا يمكن إعادة تفعيل طلب ملغي بعد استرجاع مخزونه.' };
	}

	if (nextStatus === 'cancelled' && order.stockState === 'reserved') {
		const stmts: D1PreparedStatement[] = [
			db
				.prepare(
					"UPDATE orders SET status = 'cancelled', stock_state = 'released' WHERE id = ? AND stock_state = 'reserved'",
				)
				.bind(order.id),
		];
		for (const item of order.items) {
			stmts.push(
				db
					.prepare('UPDATE variants SET stock = stock + ? WHERE id = ?')
					.bind(item.quantity, item.variantId),
			);
		}
		const res = await db.batch(stmts);
		if ((res[0]?.meta?.changes ?? 0) !== 1) {
			return { ok: false, error: 'تم استرجاع المخزون مسبقاً لهذا الطلب.' };
		}
		return { ok: true };
	}

	await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(nextStatus, order.id).run();
	return { ok: true };
}

export async function recordAtomicLoginFailure(db: D1Database, userId: string): Promise<void> {
	const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
	await db
		.prepare(
			`UPDATE admin_users
			SET failed_attempts = failed_attempts + 1,
				locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN ? ELSE locked_until END
			WHERE id = ?`,
		)
		.bind(lockedUntil, userId)
		.run();
}

export async function resetLoginFailures(db: D1Database, userId: string): Promise<void> {
	await db
		.prepare('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?')
		.bind(userId)
		.run();
}
