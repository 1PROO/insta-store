import type { Collection, Product, StoreConfig, ThemePresetId, UiLang } from '../domain/types';
import { THEME_PRESETS } from '../theme/presets';
import { DEFAULT_STORE_CONFIG, SAMPLE_COLLECTIONS, SAMPLE_PRODUCTS } from './sample-catalog';

export interface StoreRepository {
	getStoreConfig(url?: URL): Promise<StoreConfig>;
	getVisibleCollections(): Promise<Collection[]>;
	getFeaturedProducts(): Promise<Product[]>;
	getPublishedProducts(): Promise<Product[]>;
	getProductBySlug(slug: string): Promise<Product | null>;
}

/**
 * Centralized data pipe ("المواسير"): all Storefront pages read from this
 * interface. Slice 1 serves local sample data matching the D1 schema; Phase 4
 * swaps in the live D1 repository without touching page components.
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
