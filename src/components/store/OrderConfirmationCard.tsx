import type { GuestOrder } from '../../lib/domain/types';

interface Props {
	order: GuestOrder;
	currency: string;
	lang: 'ar' | 'en';
	whatsappNumber: string | null;
}

export default function OrderConfirmationCard({ order, currency, lang, whatsappNumber }: Props) {
	const waText = `طلب جديد #${order.orderCode}\nالاسم: ${order.customerName}\nالهاتف: ${order.customerPhone}\nالإجمالي: ${order.totalAmount} ${currency}`;
	const waHref = whatsappNumber
		? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`
		: null;

	return (
		<div className="store-surface max-w-lg mx-auto p-6 text-center space-y-4">
			<h2 className="text-xl font-extrabold">
				{lang === 'en' ? 'Order Confirmed!' : 'تم تأكيد طلبك بنجاح ✓'}
			</h2>
			<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
				{lang === 'en' ? 'Order Reference:' : 'رقم الطلب المرجعي:'}{' '}
				<strong className="text-base" style={{ color: 'var(--text-primary)' }}>
					#{order.orderCode}
				</strong>
			</p>
			<p className="text-sm font-bold">
				{lang === 'en' ? 'Total COD:' : 'الإجمالي عند الاستلام:'}{' '}
				{order.totalAmount.toLocaleString('en-US')} {currency}
			</p>
			<div className="flex flex-col gap-2.5 pt-2">
				{waHref && (
					<a
						href={waHref}
						target="_blank"
						rel="noopener noreferrer"
						className="py-3 text-sm font-bold store-btn-primary"
					>
						{lang === 'en'
							? 'Send Order to Store WhatsApp'
							: 'إرسال تفاصيل الطلب على واتساب المتجر'}
					</a>
				)}
				<a href="/shop" className="py-3 text-sm font-semibold store-btn-outline">
					{lang === 'en' ? 'Continue Shopping' : 'العودة للمتجر'}
				</a>
			</div>
		</div>
	);
}
