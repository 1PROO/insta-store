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
import { getWorkerEnv } from '../env';
import { THEME_PRESETS } from '../theme/presets';
import { commitD1GuestOrder, findD1OrderByIdempotency } from './d1-orders';
import {
	getD1Collections,
	getD1CouponByCode,
	getD1HomepageSections,
	getD1ProductBySlug,
	getD1Products,
	getD1ShippingZones,
	getD1StoreConfig,
} from './d1-store';
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
	saveGuestOrder(
		order: GuestOrder,
		couponId: string | null,
	): Promise<{ ok: true } | { ok: false; error: string }>;
}

async function resolveDb(): Promise<D1Database | null> {
	const env = await getWorkerEnv();
	return env.DB ?? null;
}

/**
 * Centralized data pipe ("المواسير"): uses live Cloudflare D1 strictly
 * whenever DB is bound (no silent sample fallback in production), and uses
 * in-memory sample data only in DB-less unit tests.
 */
export function createStoreRepository(): StoreRepository {
	return {
		async getStoreConfig(url?: URL) {
			const db = await resolveDb();
			const base = (db ? await getD1StoreConfig(db) : null) ?? DEFAULT_STORE_CONFIG;
			const presetParam = url?.searchParams.get('preset');
			const validPreset =
				presetParam && presetParam in THEME_PRESETS
					? (presetParam as ThemePresetId)
					: base.presetId;

			return { ...base, presetId: validPreset };
		},

		async getVisibleCollections() {
			const db = await resolveDb();
			if (db) return getD1Collections(db, false);
			return SAMPLE_COLLECTIONS.filter((c) => c.isVisible).sort(
				(a, b) => a.sortOrder - b.sortOrder,
			);
		},

		async getCollectionBySlug(slug: string) {
			const cols = await this.getVisibleCollections();
			return cols.find((c) => c.slug === slug) ?? null;
		},

		async getFeaturedProducts() {
			const all = await this.getPublishedProducts();
			return all.filter((p) => p.isFeatured);
		},

		async getPublishedProducts() {
			const db = await resolveDb();
			if (db) return getD1Products(db, { includeHidden: false });
			return SAMPLE_PRODUCTS.filter((p) => p.status === 'published' && p.deletedAt === null);
		},

		async getProductBySlug(slug: string) {
			const db = await resolveDb();
			if (db) return getD1ProductBySlug(db, slug);
			return (
				SAMPLE_PRODUCTS.find(
					(p) => p.slug === slug && p.status === 'published' && p.deletedAt === null,
				) ?? null
			);
		},

		async getHomepageSections() {
			const db = await resolveDb();
			if (db) return getD1HomepageSections(db);
			return SAMPLE_HOMEPAGE_SECTIONS;
		},

		async getActiveShippingZones() {
			const db = await resolveDb();
			if (db) return getD1ShippingZones(db, false);
			return SAMPLE_SHIPPING_ZONES.filter((z) => z.isActive);
		},

		async getCouponByCode(code: string) {
			const db = await resolveDb();
			if (db) return getD1CouponByCode(db, code);
			const normalized = code.trim().toUpperCase();
			if (!normalized) return null;
			return SAMPLE_COUPONS.find((c) => c.code.toUpperCase() === normalized) ?? null;
		},

		async findOrderByIdempotencyKey(key: string) {
			const db = await resolveDb();
			if (db) return findD1OrderByIdempotency(db, key);
			return memoryIdempotency.get(key) ?? null;
		},

		async saveGuestOrder(order: GuestOrder, couponId: string | null) {
			const db = await resolveDb();
			if (db) return commitD1GuestOrder(db, order, couponId);
			memoryOrders.push(order);
			memoryIdempotency.set(order.idempotencyKey, order);
			return { ok: true };
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
