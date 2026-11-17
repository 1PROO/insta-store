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
	filterAllSizes: string;
	filterInStock: string;
	sortNewest: string;
	sortPriceAsc: string;
	sortPriceDesc: string;
	noProductsFound: string;
	clearFilters: string;
	addToCart: string;
	sizeLabel: string;
	colorLabel: string;
	sizeGuideLabel: string;
	descriptionLabel: string;
	fabricCareLabel: string;
	shippingInfoLabel: string;
	readMore: string;
	readLess: string;
	askWhatsappProduct: string;
	emptyCart: string;
	continueShopping: string;
	goToCheckout: string;
	checkoutTitle: string;
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
	filterAllSizes: 'كل المقاسات',
	filterInStock: 'المتوفر فقط',
	sortNewest: 'الأحدث',
	sortPriceAsc: 'السعر: الأقل',
	sortPriceDesc: 'السعر: الأعلى',
	noProductsFound: 'لا توجد قطع مطابقة لهذه الفلاتر حالياً.',
	clearFilters: 'إزالة الفلاتر',
	addToCart: 'إضافة إلى السلة',
	sizeLabel: 'المقاس',
	colorLabel: 'اللون',
	sizeGuideLabel: 'دليل المقاسات',
	descriptionLabel: 'الوصف',
	fabricCareLabel: 'الخامة والعناية',
	shippingInfoLabel: 'الشحن والاستبدال',
	readMore: 'اقرأ المزيد',
	readLess: 'عرض أقل',
	askWhatsappProduct: 'استفسار عبر واتساب',
	emptyCart: 'سلتك فارغة حالياً.',
	continueShopping: 'تصفح القطع',
	goToCheckout: 'إتمام الطلب الآن',
	checkoutTitle: 'إتمام الطلب السريع',
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
	filterAllSizes: 'All Sizes',
	filterInStock: 'In Stock Only',
	sortNewest: 'Newest',
	sortPriceAsc: 'Price: Low to High',
	sortPriceDesc: 'Price: High to Low',
	noProductsFound: 'No garments match your current filters.',
	clearFilters: 'Clear Filters',
	addToCart: 'Add to Bag',
	sizeLabel: 'Size',
	colorLabel: 'Color',
	sizeGuideLabel: 'Size Guide',
	descriptionLabel: 'Description',
	fabricCareLabel: 'Fabric & Care',
	shippingInfoLabel: 'Shipping & Returns',
	readMore: 'Read more',
	readLess: 'Show less',
	askWhatsappProduct: 'Ask on WhatsApp',
	emptyCart: 'Your bag is currently empty.',
	continueShopping: 'Browse Pieces',
	goToCheckout: 'Proceed to Checkout',
	checkoutTitle: 'Fast Guest Checkout',
};

export function getUiDict(lang: UiLang): UiDictionary {
	return lang === 'en' ? EN_DICT : AR_DICT;
}
