import type {
	Coupon,
	OrderItemInput,
	OrderItemSnapshot,
	Product,
	ShippingZone,
} from '../domain/types';

export const MAX_QTY_PER_VARIANT = 10;

/** Normalizes Egyptian mobile numbers to `01xxxxxxxxx` or returns null if invalid. */
export function normalizeEgyptPhone(raw: string): string | null {
	const digits = raw.replace(/[\s\-()]/g, '');
	let local = digits;
	if (digits.startsWith('+20')) {
		local = `0${digits.slice(3)}`;
	} else if (digits.startsWith('0020')) {
		local = `0${digits.slice(4)}`;
	} else if (digits.startsWith('20') && digits.length === 12) {
		local = `0${digits.slice(2)}`;
	}
	return /^01[0125][0-9]{8}$/.test(local) ? local : null;
}

export interface QuoteInput {
	items: OrderItemInput[];
	products: Product[];
	shippingZone: ShippingZone;
	globalFreeShippingThreshold: number | null;
	coupon: Coupon | null;
	nowIso: string;
}

export type QuoteResult =
	| {
			ok: true;
			items: OrderItemSnapshot[];
			subtotal: number;
			discountAmount: number;
			shippingFee: number;
			totalAmount: number;
			appliedCouponCode: string | null;
	  }
	| {
			ok: false;
			error: string;
	  };

function evaluateCouponDiscount(
	coupon: Coupon | null,
	subtotal: number,
	nowIso: string,
): { ok: true; discount: number; code: string | null } | { ok: false; error: string } {
	if (!coupon) return { ok: true, discount: 0, code: null };
	if (!coupon.isActive) return { ok: false, error: 'كود الخصم غير مفعل حالياً.' };
	if (coupon.expiresAt && coupon.expiresAt < nowIso) {
		return { ok: false, error: 'انتهت صلاحية كود الخصم.' };
	}
	if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
		return { ok: false, error: 'تم استهلاك الحد الأقصى لكود الخصم.' };
	}
	if (coupon.minSubtotal !== null && subtotal < coupon.minSubtotal) {
		return { ok: false, error: `الحد الأدنى لاستخدام الكود هو ${coupon.minSubtotal}.` };
	}
	const rawDiscount =
		coupon.type === 'percentage' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
	return {
		ok: true,
		discount: Math.max(0, Math.min(subtotal, rawDiscount)),
		code: coupon.code,
	};
}

export function calculateOrderQuote(input: QuoteInput): QuoteResult {
	if (!input.items.length) {
		return { ok: false, error: 'السلة فارغة.' };
	}
	if (!input.shippingZone.isActive) {
		return { ok: false, error: 'منطقة الشحن غير متاحة.' };
	}

	const snapshots: OrderItemSnapshot[] = [];
	let subtotal = 0;

	for (const reqItem of input.items) {
		if (!Number.isInteger(reqItem.quantity) || reqItem.quantity < 1) {
			return { ok: false, error: 'الكمية غير صالحة.' };
		}
		if (reqItem.quantity > MAX_QTY_PER_VARIANT) {
			return {
				ok: false,
				error: `الحد الأقصى للقطعة الواحدة هو ${MAX_QTY_PER_VARIANT}.`,
			};
		}

		const product = input.products.find(
			(p) => p.id === reqItem.productId && p.status === 'published' && p.deletedAt === null,
		);
		if (!product) {
			return { ok: false, error: 'أحد المنتجات لم يعد متاحاً.' };
		}
		const variant = product.variants.find((v) => v.id === reqItem.variantId);
		if (!variant) {
			return { ok: false, error: 'المقاس أو اللون المختار غير موجود.' };
		}
		if (variant.stock < reqItem.quantity) {
			return {
				ok: false,
				error: `الكمية المطلوبة من (${product.title} - ${variant.size}) غير متوفرة حالياً.`,
			};
		}

		const unitPrice = variant.priceOverride ?? product.basePrice;
		const lineTotal = unitPrice * reqItem.quantity;
		subtotal += lineTotal;
		snapshots.push({
			productId: product.id,
			productSlug: product.slug,
			productTitle: product.title,
			variantId: variant.id,
			size: variant.size,
			colorName: variant.colorName,
			unitPrice,
			quantity: reqItem.quantity,
			lineTotal,
		});
	}

	const couponEval = evaluateCouponDiscount(input.coupon, subtotal, input.nowIso);
	if (!couponEval.ok) return couponEval;

	const postCouponSubtotal = subtotal - couponEval.discount;
	const freeThreshold =
		input.shippingZone.freeShippingThreshold ?? input.globalFreeShippingThreshold;
	const shippingFee =
		freeThreshold !== null && postCouponSubtotal >= freeThreshold ? 0 : input.shippingZone.fee;

	return {
		ok: true,
		items: snapshots,
		subtotal,
		discountAmount: couponEval.discount,
		shippingFee,
		totalAmount: postCouponSubtotal + shippingFee,
		appliedCouponCode: couponEval.code,
	};
}
