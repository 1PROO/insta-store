import type { UiLang } from '../domain/types';

export interface UiDictionary {
	navHome: string;
	navShop: string;
	navDesignSystem: string;
	navAdmin: string;
	cartLabel: string;
	collectionsTitle: string;
	featuredTitle: string;
	viewAll: string;
	saleBadge: string;
	soldOutBadge: string;
	quickView: string;
	whatsappLabel: string;
	instagramLabel: string;
	footerNote: string;
	langToggleLabel: string;
	playMotionTip: string;
}

const AR_DICT: UiDictionary = {
	navHome: 'الرئيسية',
	navShop: 'كل المنتجات',
	navDesignSystem: 'نظام التصميم',
	navAdmin: 'لوحة التحكم',
	cartLabel: 'السلة',
	collectionsTitle: 'تصفح الأقسام',
	featuredTitle: 'وصلنا حديثاً',
	viewAll: 'عرض الكل',
	saleBadge: 'خصم',
	soldOutBadge: 'نفذت الكمية',
	quickView: 'اختيار المقاس',
	whatsappLabel: 'تواصل واتساب',
	instagramLabel: 'إنستجرام',
	footerNote: 'متجر أزياء قابل للتخصيص بالكامل — متوافق 100% مع الموبايل.',
	langToggleLabel: 'EN',
	playMotionTip: 'عرض الحملة',
};

const EN_DICT: UiDictionary = {
	navHome: 'Home',
	navShop: 'Shop All',
	navDesignSystem: 'Design System',
	navAdmin: 'Dashboard',
	cartLabel: 'Bag',
	collectionsTitle: 'Shop by Collection',
	featuredTitle: 'New Arrivals',
	viewAll: 'View All',
	saleBadge: 'Sale',
	soldOutBadge: 'Sold Out',
	quickView: 'Select Size',
	whatsappLabel: 'WhatsApp',
	instagramLabel: 'Instagram',
	footerNote: 'White-label mobile-first fashion storefront.',
	langToggleLabel: 'عربي',
	playMotionTip: 'Campaign Reel',
};

export function getUiDict(lang: UiLang): UiDictionary {
	return lang === 'en' ? EN_DICT : AR_DICT;
}
