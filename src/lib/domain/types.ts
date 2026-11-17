export type ThemePresetId =
	| 'flagship_editorial'
	| 'warm_dune'
	| 'minimal_clean'
	| 'midnight_streetwear';

export type RadiusPreset = 'sharp' | 'soft' | 'pill';
export type UiLanguageMode = 'ar' | 'en' | 'both';
export type UiLang = 'ar' | 'en';

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
