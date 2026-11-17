import { useState } from 'react';
import type { GuestOrder, OrderStatus } from '../../lib/domain/types';

interface Props {
	initialOrders: GuestOrder[];
	currency: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
	new: 'جديد',
	confirmed: 'مؤكد',
	shipped: 'تم الشحن',
	delivered: 'تم التسليم',
	cancelled: 'ملغي',
};

export default function OrdersManager({ initialOrders, currency }: Props) {
	const [orders, setOrders] = useState<GuestOrder[]>(initialOrders);
	const [filter, setFilter] = useState<string>('all');
	const [selected, setSelected] = useState<string[]>([]);
	const [msg, setMsg] = useState('');

	const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

	function toggleSelect(id: string) {
		setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}

	async function changeStatus(orderId: string, nextStatus: OrderStatus) {
		setMsg('');
		const res = await fetch('/api/admin/orders', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderId, status: nextStatus }),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) {
			setMsg(data.error || 'تعذر تحديث الحالة.');
			return;
		}
		setOrders((prev) =>
			prev.map((o) =>
				o.id === orderId
					? {
							...o,
							status: nextStatus,
							stockState: nextStatus === 'cancelled' ? 'released' : o.stockState,
						}
					: o,
			),
		);
		setMsg(
			nextStatus === 'cancelled'
				? 'تم إلغاء الطلب واسترجاع المخزون تلقائياً ✓'
				: 'تم تحديث حالة الطلب ✓',
		);
	}

	async function bulkCancel() {
		if (!selected.length) return;
		setMsg('');
		const res = await fetch('/api/admin/orders', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderIds: selected, status: 'cancelled' }),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) {
			setMsg(data.error || 'تعذر الإلغاء الجماعي.');
			return;
		}
		setOrders((prev) =>
			prev.map((o) =>
				selected.includes(o.id) ? { ...o, status: 'cancelled', stockState: 'released' } : o,
			),
		);
		setSelected([]);
		setMsg('تم إلغاء الطلبات المحددة واسترجاع مخزونها ✓');
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
					{(['all', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
						<button
							key={st}
							type="button"
							onClick={() => setFilter(st)}
							className={`px-3 py-1.5 rounded-full border shrink-0 ${
								filter === st
									? 'bg-sky-500 text-slate-950 border-sky-500'
									: 'bg-slate-900 text-slate-300 border-slate-800'
							}`}
						>
							{st === 'all' ? `الكل (${orders.length})` : STATUS_LABELS[st]}
						</button>
					))}
				</div>

				{selected.length > 0 && (
					<button
						type="button"
						onClick={bulkCancel}
						className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
					>
						إلغاء المحدد ({selected.length})
					</button>
				)}
			</div>

			{msg && <p className="text-xs font-bold text-emerald-400">{msg}</p>}

			{visible.length === 0 ? (
				<div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
					لا توجد طلبات في هذا التصنيف حالياً.
				</div>
			) : (
				<div className="grid gap-3">
					{visible.map((order) => (
						<article
							key={order.id}
							className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3"
						>
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2.5">
									{order.status !== 'cancelled' && (
										<input
											type="checkbox"
											aria-label={`تحديد الطلب ${order.orderCode}`}
											checked={selected.includes(order.id)}
											onChange={() => toggleSelect(order.id)}
										/>
									)}
									<div>
										<span className="text-xs font-extrabold text-sky-400">#{order.orderCode}</span>
										<h2 className="font-bold text-sm">{order.customerName}</h2>
									</div>
								</div>
								<span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800">
									{STATUS_LABELS[order.status]}
								</span>
							</div>

							<div className="text-xs text-slate-300 space-y-1">
								<p>
									{order.customerPhone} · {order.shippingZoneName}
								</p>
								<p className="text-slate-400">{order.address}</p>
								<div className="pt-1 text-slate-200">
									{order.items.map((it) => (
										<span key={it.variantId} className="block">
											• {it.productTitle} ({it.size} / {it.colorName}) × {it.quantity}
										</span>
									))}
								</div>
								<p className="font-extrabold text-sm pt-1">
									الإجمالي: {order.totalAmount.toLocaleString('en-US')} {currency}
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
								<select
									aria-label="تغيير حالة الطلب"
									disabled={order.status === 'cancelled'}
									value={order.status}
									onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
									className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold disabled:opacity-50"
								>
									{(['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map(
										(st) => (
											<option key={st} value={st}>
												{STATUS_LABELS[st]}
											</option>
										),
									)}
								</select>
								<a
									href={`https://wa.me/2${order.customerPhone}`}
									target="_blank"
									rel="noopener noreferrer"
									className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
								>
									واتساب العميل
								</a>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
