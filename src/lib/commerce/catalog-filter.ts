import type { Collection, Product } from '../domain/types';

export type CatalogSort = 'newest' | 'price_asc' | 'price_desc';

export interface CatalogFilterParams {
	collectionSlug?: string | null;
	size?: string | null;
	color?: string | null;
	query?: string | null;
	inStockOnly?: boolean;
	sort?: CatalogSort;
}

export function filterCatalogProducts(
	products: Product[],
	collections: Collection[],
	params: CatalogFilterParams,
): Product[] {
	let result = products.filter((p) => p.status === 'published' && p.deletedAt === null);

	if (params.collectionSlug) {
		const col = collections.find((c) => c.slug === params.collectionSlug && c.isVisible);
		result = col ? result.filter((p) => p.collectionId === col.id) : [];
	}

	if (params.query?.trim()) {
		const q = params.query.trim().toLowerCase();
		result = result.filter(
			(p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
		);
	}

	if (params.size) {
		const targetSize = params.size.trim().toUpperCase();
		result = result.filter((p) =>
			p.variants.some((v) => v.size.toUpperCase() === targetSize && v.stock > 0),
		);
	}

	if (params.color?.trim()) {
		const targetColor = params.color.trim().toLowerCase();
		result = result.filter((p) =>
			p.variants.some((v) => v.colorName.toLowerCase() === targetColor && v.stock > 0),
		);
	}

	if (params.inStockOnly) {
		result = result.filter((p) => p.variants.some((v) => v.stock > 0));
	}

	if (params.sort === 'price_asc') {
		result = [...result].sort((a, b) => a.basePrice - b.basePrice);
	} else if (params.sort === 'price_desc') {
		result = [...result].sort((a, b) => b.basePrice - a.basePrice);
	}

	return result;
}
