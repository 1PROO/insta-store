import { useEffect, useState } from 'react';
import { type CartItem, clearCart, readCart } from '../../lib/commerce/cart-store';
import type { GuestOrder, ShippingZone } from '../../lib/domain/types';
import CheckoutSummaryPanel, { type QuotePreview } from './CheckoutSummaryPanel';
import OrderConfirmationCard from './OrderConfirmationCard';

interface Props {
	zones: ShippingZone[];
	currency: string;
	lang: 'ar' | 'en';
	whatsappNumber: string | null;
	globalFreeShippingThreshold: number | null;
}

export default function CheckoutForm({
	zones,
	currency,
	lang,
	whatsappNumber,
	globalFreeShippingThreshold,
}: Props) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [zoneId, setZoneId] = useState(zones[0]?.id ?? '');
	const [couponInput, setCouponInput] = useState('');
	const [appliedCode, setAppliedCode] = useState('');
	const [couponMsg, setCouponMsg] = useState('');
	const [quote, setQuote] = useState<QuotePreview | null>(null);
	const [customerName, setCustomerName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [address, setAddress] = useState('');
	const [notes, setNotes] = useState('');
	const [idempotencyKey] = useState(() =>
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `ord-${Date.now()}`,
	);
	const [submitting, setSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState('');
	const [createdOrder, setCreatedOrder] = useState<GuestOrder | null>(null);

	useEffect(() => {
		setItems(readCart());
	}, []);

	useEffect(() => {
		if (!items.length || !zoneId) {
			setQuote(null);
			return;
		}
		fetch('/api/quote', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				items: items.map((i) => ({
					productId: i.productId,
					variantId: i.variantId,
					quantity: i.quantity,
				})),
				shippingZoneId: zoneId,
				couponCode: appliedCode || null,
			}),
		})
			.then((r) => r.json())
			.then((data) => {
				if (data.ok) {
					setQuote(data.quote);
					if (appliedCode) setCouponMsg(lang === 'en' ? 'Coupon applied ✓' : 'تم تطبيق الكود ✓');
				} else if (appliedCode) {
					setCouponMsg(data.error || 'كود غير صالح');
					setAppliedCode('');
				}
			})
			.catch(() => {});
	}, [items, zoneId, appliedCode, lang]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setErrorMsg('');
		setSubmitting(true);
		try {
			const res = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerName,
					customerPhone,
					shippingZoneId: zoneId,
					address,
					notes,
					couponCode: appliedCode || null,
					idempotencyKey,
					items: items.map((i) => ({
						productId: i.productId,
						variantId: i.variantId,
						quantity: i.quantity,
					})),
				}),
			});
			const data = await res.json();
			if (!res.ok || !data.ok) {
				setErrorMsg(data.error || 'تعذر إرسال الطلب.');
				setSubmitting(false);
				return;
			}
			clearCart();
			setCreatedOrder(data.order);
		} catch {
			setErrorMsg(lang === 'en' ? 'Network error. Please retry.' : 'حدث خطأ في الاتصال.');
		} finally {
			setSubmitting(false);
		}
	}

	if (createdOrder) {
		return (
			<OrderConfirmationCard
				order={createdOrder}
				currency={currency}
				lang={lang}
				whatsappNumber={whatsappNumber}
			/>
		);
	}

	if (items.length === 0) {
		return (
			<div className="store-surface max-w-lg mx-auto p-6 text-center space-y-4">
				<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
					{lang === 'en' ? 'Your bag is empty.' : 'سلة التسوق فارغة حالياً.'}
				</p>
				<a href="/shop" className="inline-block px-5 py-2.5 text-xs font-bold store-btn-primary">
					{lang === 'en' ? 'Browse Pieces' : 'تصفح المنتجات'}
				</a>
			</div>
		);
	}

	const activeZone = zones.find((z) => z.id === zoneId);
	const freeThreshold = activeZone?.freeShippingThreshold ?? globalFreeShippingThreshold;

	return (
		<form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-6 items-start">
			<div className="md:col-span-7 store-surface p-5 space-y-4">
				<h2 className="font-bold text-base">
					{lang === 'en'
						? 'Delivery Details (Cash on Delivery)'
						: 'بيانات التوصيل (الدفع عند الاستلام)'}
				</h2>
				<div>
					<label className="block text-xs font-bold mb-1" htmlFor="custName">
						{lang === 'en' ? 'Full Name' : 'الاسم بالكامل'}
					</label>
					<input
						id="custName"
						required
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						className="w-full px-3.5 py-2.5 text-sm border bg-transparent"
						style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
					/>
				</div>
				<div>
					<label className="block text-xs font-bold mb-1" htmlFor="custPhone">
						{lang === 'en'
							? 'Mobile / WhatsApp (01xxxxxxxxx)'
							: 'رقم الموبايل / الواتساب (01xxxxxxxxx)'}
					</label>
					<input
						id="custPhone"
						type="tel"
						required
						placeholder="01012345678"
						value={customerPhone}
						onChange={(e) => setCustomerPhone(e.target.value)}
						className="w-full px-3.5 py-2.5 text-sm border bg-transparent"
						style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
					/>
				</div>
				<div>
					<label className="block text-xs font-bold mb-1" htmlFor="shipZone">
						{lang === 'en' ? 'Governorate / Zone' : 'المحافظة / منطقة الشحن'}
					</label>
					<select
						id="shipZone"
						value={zoneId}
						onChange={(e) => setZoneId(e.target.value)}
						className="w-full px-3.5 py-2.5 text-sm border bg-transparent"
						style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
					>
						{zones.map((z) => (
							<option key={z.id} value={z.id}>
								{z.name} ({z.fee} {currency})
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-xs font-bold mb-1" htmlFor="custAddr">
						{lang === 'en' ? 'Full Address' : 'العنوان بالتفصيل'}
					</label>
					<textarea
						id="custAddr"
						rows={2}
						required
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="w-full px-3.5 py-2.5 text-sm border bg-transparent"
						style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
					/>
				</div>
				<div>
					<label className="block text-xs font-bold mb-1" htmlFor="custNotes">
						{lang === 'en' ? 'Notes (Optional)' : 'ملاحظات إضافية (اختياري)'}
					</label>
					<input
						id="custNotes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						className="w-full px-3.5 py-2.5 text-sm border bg-transparent"
						style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
					/>
				</div>
			</div>

			<CheckoutSummaryPanel
				items={items}
				quote={quote}
				currency={currency}
				lang={lang}
				freeThreshold={freeThreshold}
				couponInput={couponInput}
				couponMsg={couponMsg}
				errorMsg={errorMsg}
				submitting={submitting}
				onCouponInputChange={setCouponInput}
				onApplyCoupon={() => setAppliedCode(couponInput.trim().toUpperCase())}
			/>
		</form>
	);
}
