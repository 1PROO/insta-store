export type ThemePresetId =
	| 'flagship_editorial'
	| 'warm_dune'
	| 'minimal_clean'
	| 'midnight_streetwear';

export type RadiusPreset = 'sharp' | 'soft' | 'pill';
export type UiLanguageMode = 'ar' | 'en' | 'both';
export type UiLang = 'ar' | 'en';
export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type StockState = 'reserved' | 'released';

export interface ThemeTokens {
	bgPrimary: string;
	bgSurface: string;
	textPrimary: string;
	textMuted: string;
	accentPrimary: string;
	btnBg: string;
	btnText: string;
	borderSubtle: string;
	radiusCard: string;
	radiusBtn: string;
	radiusPill: string;
}

export interface StoreConfig {
	storeName: string;
	tagline: string;
	logoUrl: string | null;
	presetId: ThemePresetId;
	customAccent: string | null;
	customBtnBg: string | null;
	customBtnText: string | null;
	radiusPreset: RadiusPreset;
	languageMode: UiLanguageMode;
	defaultLang: UiLang;
	currency: string;
	announcementText: string | null;
	heroTitle: string;
	heroSubtitle: string;
	heroCtaLabel: string;
	heroCtaHref: string;
	heroPosterUrl: string;
	heroVideoUrl: string | null;
	whatsappNumber: string | null;
	instagramUrl: string | null;
	defaultSizeGuide: string | null;
	globalFreeShippingThreshold: number | null;
	metaPixelId: string | null;
	tiktokPixelId: string | null;
}

export interface Collection {
	id: string;
	name: string;
	slug: string;
	imageUrl: string;
	sortOrder: number;
	isVisible: boolean;
}

export interface ProductVariant {
	id: string;
	productId: string;
	size: string;
	colorName: string;
	colorHex: string;
	stock: number;
	priceOverride: number | null;
}

export interface Product {
	id: string;
	title: string;
	slug: string;
	description: string;
	fabricCare: string | null;
	sizeGuide: string | null;
	basePrice: number;
	compareAtPrice: number | null;
	collectionId: string;
	images: string[];
	status: 'published' | 'hidden';
	isFeatured: boolean;
	deletedAt: string | null;
	variants: ProductVariant[];
}

export interface ShippingZone {
	id: string;
	name: string;
	fee: number;
	freeShippingThreshold: number | null;
	isActive: boolean;
}

export interface Coupon {
	id: string;
	code: string;
	type: 'percentage' | 'fixed';
	value: number;
	minSubtotal: number | null;
	maxUses: number | null;
	usedCount: number;
	expiresAt: string | null;
	isActive: boolean;
}

export interface OrderItemInput {
	productId: string;
	variantId: string;
	quantity: number;
}

export interface OrderItemSnapshot {
	productId: string;
	productSlug: string;
	productTitle: string;
	variantId: string;
	size: string;
	colorName: string;
	unitPrice: number;
	quantity: number;
	lineTotal: number;
}

export interface GuestOrder {
	id: string;
	orderCode: string;
	customerName: string;
	customerPhone: string;
	shippingZoneId: string;
	shippingZoneName: string;
	address: string;
	notes: string | null;
	items: OrderItemSnapshot[];
	subtotal: number;
	couponCode: string | null;
	discountAmount: number;
	shippingFee: number;
	totalAmount: number;
	status: OrderStatus;
	stockState: StockState;
	idempotencyKey: string;
	createdAt: string;
}

export interface HeroHotspot {
	productSlug: string;
	label: string;
	priceLabel: string;
	xPercent: number;
	yPercent: number;
}

export interface PromoCard {
	id: string;
	title: string;
	subtitle: string;
	ctaLabel: string;
	ctaHref: string;
	imageUrl: string;
}

export interface BrandStoryBlock {
	eyebrow: string;
	title: string;
	body: string;
	ctaLabel: string;
	ctaHref: string;
	primaryImageUrl: string;
	secondaryImageUrl: string;
}

export interface LookbookSlide {
	id: string;
	title: string;
	subtitle: string;
	ctaLabel: string;
	ctaHref: string;
	imageUrl: string;
}

export interface LookbookTile {
	id: string;
	label: string;
	href: string;
	imageUrl: string;
}

export interface ValuePillar {
	id: string;
	icon: 'fabric' | 'exchange' | 'delivery';
	title: string;
	description: string;
}

export interface HomepageSections {
	heroHotspots: HeroHotspot[];
	promoCards: PromoCard[];
	brandStory: BrandStoryBlock | null;
	lookbookSlides: LookbookSlide[];
	lookbookTiles: LookbookTile[];
	valuePillars: ValuePillar[];
}
