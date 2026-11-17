import type { CartItem } from '../../lib/commerce/cart-store';

export interface QuotePreview {
	subtotal: number;
	discountAmount: number;
	shippingFee: number;
	totalAmount: number;
	appliedCouponCode: string | null;
}

interface Props {
	items: CartItem[];
	quote: QuotePreview | null;
	currency: string;
	lang: 'ar' | 'en';
	freeThreshold: number | null;
	couponInput: string;
	couponMsg: string;
	errorMsg: string;
	submitting: boolean;
	onCouponInputChange: (val: string) => void;
	onApplyCoupon: () => void;
}

export default function CheckoutSummaryPanel({
	items,
	quote,
	currency,
	lang,
	freeThreshold,
	couponInput,
	couponMsg,
	errorMsg,
	submitting,
	onCouponInputChange,
	onApplyCoupon,
}: Props) {
	const postCoupon = (quote?.subtotal ?? 0) - (quote?.discountAmount ?? 0);
	const remainingForFree = freeThreshold !== null ? Math.max(0, freeThreshold - postCoupon) : 0;

	return (
		<div className="md:col-span-5 store-surface p-5 space-y-4">
			<h2 className="font-bold text-base">{lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}</h2>

			{freeThreshold !== null && quote && (
				<p className="text-xs p-2.5 border" style={{ borderColor: 'var(--border-subtle)' }}>
					{remainingForFree === 0
						? lang === 'en'
							? 'Free shipping unlocked ✓'
							: 'مبروك! حصلت على شحن مجاني ✓'
						: lang === 'en'
							? `Add ${remainingForFree} ${currency} more for free shipping`
							: `أضف منتجات بقيمة ${remainingForFree} ${currency} للحصول على شحن مجاني`}
				</p>
			)}

			<div className="space-y-2 text-xs">
				{items.map((item) => (
					<div key={item.variantId} className="flex justify-between gap-2">
						<span>
							{item.productTitle} ({item.size}) × {item.quantity}
						</span>
						<span className="font-bold">
							{(item.unitPrice * item.quantity).toLocaleString('en-US')} {currency}
						</span>
					</div>
				))}
			</div>

			<div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
				<input
					value={couponInput}
					onChange={(e) => onCouponInputChange(e.target.value)}
					placeholder={lang === 'en' ? 'Promo code (e.g. WELCOME10)' : 'كود الخصم (مثل WELCOME10)'}
					className="flex-1 px-3 py-2 text-xs border bg-transparent"
					style={{ borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-btn)' }}
				/>
				<button
					type="button"
					onClick={onApplyCoupon}
					className="px-3.5 py-2 text-xs font-bold store-btn-outline"
				>
					{lang === 'en' ? 'Apply' : 'تطبيق'}
				</button>
			</div>
			{couponMsg && <p className="text-xs font-semibold">{couponMsg}</p>}

			{quote && (
				<div
					className="space-y-1.5 text-sm pt-2 border-t"
					style={{ borderColor: 'var(--border-subtle)' }}
				>
					<div className="flex justify-between">
						<span>{lang === 'en' ? 'Subtotal' : 'المجموع'}</span>
						<span>
							{quote.subtotal.toLocaleString('en-US')} {currency}
						</span>
					</div>
					{quote.discountAmount > 0 && (
						<div className="flex justify-between text-emerald-600 font-semibold">
							<span>{lang === 'en' ? 'Discount' : 'الخصم'}</span>
							<span>
								-{quote.discountAmount.toLocaleString('en-US')} {currency}
							</span>
						</div>
					)}
					<div className="flex justify-between">
						<span>{lang === 'en' ? 'Shipping' : 'الشحن'}</span>
						<span>
							{quote.shippingFee === 0
								? lang === 'en'
									? 'Free'
									: 'مجاني'
								: `${quote.shippingFee} ${currency}`}
						</span>
					</div>
					<div className="flex justify-between font-extrabold text-base pt-2">
						<span>{lang === 'en' ? 'Total' : 'الإجمالي'}</span>
						<span>
							{quote.totalAmount.toLocaleString('en-US')} {currency}
						</span>
					</div>
				</div>
			)}

			{errorMsg && <p className="text-xs font-bold text-red-600">{errorMsg}</p>}

			<button
				type="submit"
				disabled={submitting}
				className="w-full py-3.5 text-sm font-bold store-btn-primary disabled:opacity-50"
			>
				{submitting
					? lang === 'en'
						? 'Confirming...'
						: 'جاري التأكيد...'
					: lang === 'en'
						? 'Confirm Order (COD)'
						: 'تأكيد الطلب (الدفع عند الاستلام)'}
			</button>
		</div>
	);
}
