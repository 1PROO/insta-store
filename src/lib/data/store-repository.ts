import type {
	Collection,
	Coupon,
	GuestOrder,
	HomepageSections,
	Product,
	ShippingZone,
	StoreConfig,
	ThemePresetId,
	UiLang,
} from '../domain/types';
import { THEME_PRESETS } from '../theme/presets';
import { DEFAULT_STORE_CONFIG, SAMPLE_COLLECTIONS, SAMPLE_PRODUCTS } from './sample-catalog';
import { SAMPLE_HOMEPAGE_SECTIONS } from './sample-sections';
import { SAMPLE_COUPONS, SAMPLE_SHIPPING_ZONES } from './sample-shipping';

const memoryOrders: GuestOrder[] = [];
const memoryIdempotency = new Map<string, GuestOrder>();

export interface StoreRepository {
	getStoreConfig(url?: URL): Promise<StoreConfig>;
	getVisibleCollections(): Promise<Collection[]>;
	getCollectionBySlug(slug: string): Promise<Collection | null>;
	getFeaturedProducts(): Promise<Product[]>;
	getPublishedProducts(): Promise<Product[]>;
	getProductBySlug(slug: string): Promise<Product | null>;
	getHomepageSections(): Promise<HomepageSections>;
	getActiveShippingZones(): Promise<ShippingZone[]>;
	getCouponByCode(code: string): Promise<Coupon | null>;
	findOrderByIdempotencyKey(key: string): Promise<GuestOrder | null>;
	saveGuestOrder(order: GuestOrder): Promise<void>;
}

/**
 * Centralized data pipe ("المواسير"): all Storefront pages and order APIs
 * read/write through this interface. Phase 4 swaps D1 persistence behind
 * this exact interface without rewriting pages.
 */
export function createStoreRepository(): StoreRepository {
	return {
		async getStoreConfig(url?: URL) {
			const presetParam = url?.searchParams.get('preset');
			const validPreset =
				presetParam && presetParam in THEME_PRESETS
					? (presetParam as ThemePresetId)
					: DEFAULT_STORE_CONFIG.presetId;

			return {
				...DEFAULT_STORE_CONFIG,
				presetId: validPreset,
			};
		},

		async getVisibleCollections() {
			return SAMPLE_COLLECTIONS.filter((c) => c.isVisible).sort(
				(a, b) => a.sortOrder - b.sortOrder,
			);
		},

		async getCollectionBySlug(slug: string) {
			return SAMPLE_COLLECTIONS.find((c) => c.slug === slug && c.isVisible) ?? null;
		},

		async getFeaturedProducts() {
			return SAMPLE_PRODUCTS.filter(
				(p) => p.status === 'published' && p.deletedAt === null && p.isFeatured,
			);
		},

		async getPublishedProducts() {
			return SAMPLE_PRODUCTS.filter((p) => p.status === 'published' && p.deletedAt === null);
		},

		async getProductBySlug(slug: string) {
			return (
				SAMPLE_PRODUCTS.find(
					(p) => p.slug === slug && p.status === 'published' && p.deletedAt === null,
				) ?? null
			);
		},

		async getHomepageSections() {
			return SAMPLE_HOMEPAGE_SECTIONS;
		},

		async getActiveShippingZones() {
			return SAMPLE_SHIPPING_ZONES.filter((z) => z.isActive);
		},

		async getCouponByCode(code: string) {
			const normalized = code.trim().toUpperCase();
			if (!normalized) return null;
			return SAMPLE_COUPONS.find((c) => c.code.toUpperCase() === normalized) ?? null;
		},

		async findOrderByIdempotencyKey(key: string) {
			return memoryIdempotency.get(key) ?? null;
		},

		async saveGuestOrder(order: GuestOrder) {
			memoryOrders.push(order);
			memoryIdempotency.set(order.idempotencyKey, order);
		},
	};
}

export function resolveActiveUiLang(config: StoreConfig, url: URL, cookieLang?: string): UiLang {
	if (config.languageMode === 'ar') return 'ar';
	if (config.languageMode === 'en') return 'en';

	const queryLang = url.searchParams.get('lang');
	if (queryLang === 'en' || queryLang === 'ar') return queryLang;
	if (cookieLang === 'en' || cookieLang === 'ar') return cookieLang;
	return config.defaultLang;
}

export function formatMoney(amount: number, currency: string): string {
	return `${amount.toLocaleString('en-US')} ${currency}`;
}
