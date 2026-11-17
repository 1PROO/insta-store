import { describe, expect, it } from 'vitest';
import { filterCatalogProducts } from '../src/lib/commerce/catalog-filter';
import { calculateOrderQuote, normalizeEgyptPhone } from '../src/lib/commerce/pricing';
import { SAMPLE_COLLECTIONS, SAMPLE_PRODUCTS } from '../src/lib/data/sample-catalog';
import type { Coupon, ShippingZone } from '../src/lib/domain/types';

const cairoZone: ShippingZone = {
	id: 'zone-cairo',
	name: 'القاهرة والجيزة',
	fee: 65,
	freeShippingThreshold: null,
	isActive: true,
};

const alexZone: ShippingZone = {
	id: 'zone-alex',
	name: 'الإسكندرية',
	fee: 75,
	freeShippingThreshold: 1000,
	isActive: true,
};

const activePercentCoupon: Coupon = {
	id: 'c-1',
	code: 'WELCOME10',
	type: 'percentage',
	value: 10,
	minSubtotal: 500,
	maxUses: 100,
	usedCount: 0,
	expiresAt: null,
	isActive: true,
};

describe('normalizeEgyptPhone', () => {
	it('normalizes local 01x and +20 formats cleanly', () => {
		expect(normalizeEgyptPhone('010 1234 5678')).toBe('01012345678');
		expect(normalizeEgyptPhone('+201122334455')).toBe('01122334455');
		expect(normalizeEgyptPhone('00201555667788')).toBe('01555667788');
	});

	it('rejects invalid phone strings', () => {
		expect(normalizeEgyptPhone('12345')).toBeNull();
		expect(normalizeEgyptPhone('01912345678')).toBeNull();
	});
});

describe('calculateOrderQuote', () => {
	it('computes server prices, post-coupon free shipping, and zone threshold override', () => {
		const quote = calculateOrderQuote({
			items: [{ productId: 'prod-1', variantId: 'v-1', quantity: 2 }],
			products: SAMPLE_PRODUCTS,
			shippingZone: alexZone,
			globalFreeShippingThreshold: 1500,
			coupon: activePercentCoupon,
			nowIso: '2026-11-17T12:00:00Z',
		});

		expect(quote.ok).toBe(true);
		if (!quote.ok) return;
		// 2 * 890 = 1780, 10% off = 178 -> post-coupon = 1602 >= alex threshold 1000 -> free shipping!
		expect(quote.subtotal).toBe(1780);
		expect(quote.discountAmount).toBe(178);
		expect(quote.shippingFee).toBe(0);
		expect(quote.totalAmount).toBe(1602);
	});

	it('charges shipping when post-coupon subtotal drops below global threshold', () => {
		const fixedCoupon: Coupon = {
			...activePercentCoupon,
			code: 'SAVE400',
			type: 'fixed',
			value: 400,
		};
		const quote = calculateOrderQuote({
			items: [{ productId: 'prod-1', variantId: 'v-1', quantity: 2 }],
			products: SAMPLE_PRODUCTS,
			shippingZone: cairoZone,
			globalFreeShippingThreshold: 1500,
			coupon: fixedCoupon,
			nowIso: '2026-11-17T12:00:00Z',
		});

		expect(quote.ok).toBe(true);
		if (!quote.ok) return;
		// 1780 - 400 = 1380 < 1500 global threshold -> charges 65 shipping
		expect(quote.shippingFee).toBe(65);
		expect(quote.totalAmount).toBe(1445);
	});

	it('rejects out-of-stock or excessive quantities', () => {
		const soldOut = calculateOrderQuote({
			items: [{ productId: 'prod-4', variantId: 'v-8', quantity: 1 }],
			products: SAMPLE_PRODUCTS,
			shippingZone: cairoZone,
			globalFreeShippingThreshold: 1500,
			coupon: null,
			nowIso: '2026-11-17T12:00:00Z',
		});
		expect(soldOut.ok).toBe(false);

		const tooMany = calculateOrderQuote({
			items: [{ productId: 'prod-1', variantId: 'v-1', quantity: 11 }],
			products: SAMPLE_PRODUCTS,
			shippingZone: cairoZone,
			globalFreeShippingThreshold: 1500,
			coupon: null,
			nowIso: '2026-11-17T12:00:00Z',
		});
		expect(tooMany.ok).toBe(false);
	});
});

describe('filterCatalogProducts', () => {
	it('filters by collection, size, availability, and sorts by price', () => {
		const inStockAsc = filterCatalogProducts(SAMPLE_PRODUCTS, SAMPLE_COLLECTIONS, {
			inStockOnly: true,
			sort: 'price_asc',
		});
		expect(inStockAsc.every((p) => p.variants.some((v) => v.stock > 0))).toBe(true);
		expect(inStockAsc[0]?.basePrice).toBeLessThanOrEqual(inStockAsc[1]?.basePrice ?? 0);

		const shirtsOnly = filterCatalogProducts(SAMPLE_PRODUCTS, SAMPLE_COLLECTIONS, {
			collectionSlug: 'linen-shirts',
			size: 'L',
		});
		expect(shirtsOnly).toHaveLength(1);
		expect(shirtsOnly[0]?.slug).toBe('relaxed-linen-shirt');

		const bySearchAndColor = filterCatalogProducts(SAMPLE_PRODUCTS, SAMPLE_COLLECTIONS, {
			query: 'كتان',
			color: 'بيج رملي',
		});
		expect(bySearchAndColor.map((p) => p.slug)).toContain('relaxed-linen-shirt');
		expect(
			filterCatalogProducts(SAMPLE_PRODUCTS, SAMPLE_COLLECTIONS, {
				query: 'nonexistent-keyword-xyz',
			}),
		).toHaveLength(0);
	});
});
