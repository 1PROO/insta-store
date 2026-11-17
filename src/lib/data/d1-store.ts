import type {
	Collection,
	Coupon,
	HomepageSections,
	Product,
	ProductVariant,
	ShippingZone,
	StoreConfig,
} from '../domain/types';
import { DEFAULT_STORE_CONFIG } from './sample-catalog';
import { SAMPLE_HOMEPAGE_SECTIONS } from './sample-sections';

interface DbConfigRow {
	store_name: string;
	tagline: string;
	logo_url: string | null;
	preset_id: StoreConfig['presetId'];
	custom_accent: string | null;
	custom_btn_bg: string | null;
	custom_btn_text: string | null;
	radius_preset: StoreConfig['radiusPreset'];
	language_mode: StoreConfig['languageMode'];
	default_lang: StoreConfig['defaultLang'];
	currency: string;
	announcement_text: string | null;
	hero_title: string;
	hero_subtitle: string;
	hero_cta_label: string;
	hero_cta_href: string;
	hero_poster_url: string;
	hero_video_url: string | null;
	whatsapp_number: string | null;
	instagram_url: string | null;
	default_size_guide: string | null;
	global_free_shipping_threshold: number | null;
	meta_pixel_id: string | null;
	tiktok_pixel_id: string | null;
	homepage_sections_json: string;
}

export async function getD1StoreConfig(db: D1Database): Promise<StoreConfig | null> {
	const row = await db.prepare('SELECT * FROM store_config WHERE id = 1').first<DbConfigRow>();
	if (!row) return null;
	return {
		storeName: row.store_name,
		tagline: row.tagline,
		logoUrl: row.logo_url,
		presetId: row.preset_id,
		customAccent: row.custom_accent,
		customBtnBg: row.custom_btn_bg,
		customBtnText: row.custom_btn_text,
		radiusPreset: row.radius_preset,
		languageMode: row.language_mode,
		defaultLang: row.default_lang,
		currency: row.currency,
		announcementText: row.announcement_text,
		heroTitle: row.hero_title,
		heroSubtitle: row.hero_subtitle,
		heroCtaLabel: row.hero_cta_label,
		heroCtaHref: row.hero_cta_href,
		heroPosterUrl: row.hero_poster_url,
		heroVideoUrl: row.hero_video_url,
		whatsappNumber: row.whatsapp_number,
		instagramUrl: row.instagram_url,
		defaultSizeGuide: row.default_size_guide,
		globalFreeShippingThreshold: row.global_free_shipping_threshold,
		metaPixelId: row.meta_pixel_id,
		tiktokPixelId: row.tiktok_pixel_id,
	};
}

export async function getD1HomepageSections(db: D1Database): Promise<HomepageSections> {
	const row = await db
		.prepare('SELECT homepage_sections_json FROM store_config WHERE id = 1')
		.first<{ homepage_sections_json: string }>();
	if (!row?.homepage_sections_json) return SAMPLE_HOMEPAGE_SECTIONS;
	try {
		const parsed = JSON.parse(row.homepage_sections_json) as Partial<HomepageSections>;
		return {
			heroHotspots: parsed.heroHotspots ?? [],
			promoCards: parsed.promoCards ?? [],
			brandStory: parsed.brandStory ?? null,
			lookbookSlides: parsed.lookbookSlides ?? [],
			lookbookTiles: parsed.lookbookTiles ?? [],
			valuePillars: parsed.valuePillars ?? [],
		};
	} catch {
		return SAMPLE_HOMEPAGE_SECTIONS;
	}
}

export async function getD1Collections(
	db: D1Database,
	includeHidden = false,
): Promise<Collection[]> {
	const sql = includeHidden
		? 'SELECT * FROM collections ORDER BY sort_order ASC'
		: 'SELECT * FROM collections WHERE is_visible = 1 ORDER BY sort_order ASC';
	const { results } = await db.prepare(sql).all<{
		id: string;
		name: string;
		slug: string;
		image_url: string;
		sort_order: number;
		is_visible: number;
	}>();
	return results.map((r) => ({
		id: r.id,
		name: r.name,
		slug: r.slug,
		imageUrl: r.image_url,
		sortOrder: r.sort_order,
		isVisible: r.is_visible === 1,
	}));
}

interface D1ProductRow {
	id: string;
	title: string;
	slug: string;
	description: string;
	fabric_care: string | null;
	size_guide: string | null;
	base_price: number;
	compare_at_price: number | null;
	collection_id: string;
	images_json: string;
	status: 'published' | 'hidden';
	is_featured: number;
	deleted_at: string | null;
}

interface D1VariantRow {
	id: string;
	product_id: string;
	size: string;
	color_name: string;
	color_hex: string;
	stock: number;
	price_override: number | null;
}

function mapVariantRow(v: D1VariantRow): ProductVariant {
	return {
		id: v.id,
		productId: v.product_id,
		size: v.size,
		colorName: v.color_name,
		colorHex: v.color_hex,
		stock: v.stock,
		priceOverride: v.price_override,
	};
}

function mapProductRow(p: D1ProductRow, variants: ProductVariant[]): Product {
	return {
		id: p.id,
		title: p.title,
		slug: p.slug,
		description: p.description,
		fabricCare: p.fabric_care,
		sizeGuide: p.size_guide,
		basePrice: p.base_price,
		compareAtPrice: p.compare_at_price,
		collectionId: p.collection_id,
		images: JSON.parse(p.images_json || '[]') as string[],
		status: p.status,
		isFeatured: p.is_featured === 1,
		deletedAt: p.deleted_at,
		variants,
	};
}

export async function getD1Products(
	db: D1Database,
	opts: { includeHidden?: boolean; onlyDeleted?: boolean; limit?: number } = {},
): Promise<Product[]> {
	const where = opts.onlyDeleted
		? 'WHERE deleted_at IS NOT NULL'
		: opts.includeHidden
			? 'WHERE deleted_at IS NULL'
			: "WHERE status = 'published' AND deleted_at IS NULL";
	const limit = Math.min(200, Math.max(1, opts.limit ?? 100));
	const { results: prods } = await db
		.prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ?`)
		.bind(limit)
		.all<D1ProductRow>();
	if (prods.length === 0) return [];

	const placeholders = prods.map(() => '?').join(',');
	const { results: vars } = await db
		.prepare(`SELECT * FROM variants WHERE product_id IN (${placeholders})`)
		.bind(...prods.map((p) => p.id))
		.all<D1VariantRow>();

	const byProd = new Map<string, ProductVariant[]>();
	for (const v of vars) {
		const list = byProd.get(v.product_id) ?? [];
		list.push(mapVariantRow(v));
		byProd.set(v.product_id, list);
	}

	return prods.map((p) => mapProductRow(p, byProd.get(p.id) ?? []));
}

export async function getD1ProductBySlug(db: D1Database, slug: string): Promise<Product | null> {
	const p = await db
		.prepare(
			"SELECT * FROM products WHERE slug = ? AND status = 'published' AND deleted_at IS NULL",
		)
		.bind(slug)
		.first<D1ProductRow>();
	if (!p) return null;
	const { results: vars } = await db
		.prepare('SELECT * FROM variants WHERE product_id = ?')
		.bind(p.id)
		.all<D1VariantRow>();
	return mapProductRow(p, vars.map(mapVariantRow));
}

export async function getD1ShippingZones(
	db: D1Database,
	includeInactive = false,
): Promise<ShippingZone[]> {
	const sql = includeInactive
		? 'SELECT * FROM shipping_zones ORDER BY fee ASC'
		: 'SELECT * FROM shipping_zones WHERE is_active = 1 ORDER BY fee ASC';
	const { results } = await db.prepare(sql).all<{
		id: string;
		name: string;
		fee: number;
		free_shipping_threshold: number | null;
		is_active: number;
	}>();
	return results.map((z) => ({
		id: z.id,
		name: z.name,
		fee: z.fee,
		freeShippingThreshold: z.free_shipping_threshold,
		isActive: z.is_active === 1,
	}));
}

export async function getD1CouponByCode(db: D1Database, code: string): Promise<Coupon | null> {
	const row = await db
		.prepare('SELECT * FROM coupons WHERE UPPER(code) = ?')
		.bind(code.trim().toUpperCase())
		.first<{
			id: string;
			code: string;
			type: 'percentage' | 'fixed';
			value: number;
			min_subtotal: number | null;
			max_uses: number | null;
			used_count: number;
			expires_at: string | null;
			is_active: number;
		}>();
	if (!row) return null;
	return {
		id: row.id,
		code: row.code,
		type: row.type,
		value: row.value,
		minSubtotal: row.min_subtotal,
		maxUses: row.max_uses,
		usedCount: row.used_count,
		expiresAt: row.expires_at,
		isActive: row.is_active === 1,
	};
}

export { DEFAULT_STORE_CONFIG };
