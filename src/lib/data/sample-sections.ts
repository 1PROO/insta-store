import type { HomepageSections } from '../domain/types';

export const SAMPLE_HOMEPAGE_SECTIONS: HomepageSections = {
	heroHotspots: [
		{
			productSlug: 'relaxed-linen-shirt',
			label: 'قميص كتان صيفي',
			priceLabel: '890 ج.م',
			xPercent: 32,
			yPercent: 42,
		},
		{
			productSlug: 'straight-pleated-trouser',
			label: 'بنطلون كتان',
			priceLabel: '980 ج.م',
			xPercent: 64,
			yPercent: 58,
		},
	],
	promoCards: [
		{
			id: 'promo-1',
			title: 'إطلالات الكتان اليومية',
			subtitle: 'خامات طبيعية خفيفة مصممة لأجواء الصيف والحركة اليومية.',
			ctaLabel: 'تسوّق القمصان',
			ctaHref: '/c/linen-shirts',
			imageUrl: '/samples/linen-shirt.svg',
		},
		{
			id: 'promo-2',
			title: 'طبقات عملية مدروسة',
			subtitle: 'أوفرشيرت وجواكت خفيفة تناسب التنسيق السريع طوال اليوم.',
			ctaLabel: 'تسوّق الجواكت',
			ctaHref: '/c/outerwear',
			imageUrl: '/samples/overshirt-jacket.svg',
		},
	],
	brandStory: {
		eyebrow: 'قصة الخامة والتصميم',
		title: 'تصميم هادئ يعيش معك',
		body: 'نختار أقمشة قطنية وكتانية بملمس متوازن وثبات عالٍ بعد الغسيل، مع قصّات مدروسة تمنحك مظهراً مرتباً وراحة حقيقية من الصباح للمساء.',
		ctaLabel: 'استعرض كل القطع',
		ctaHref: '/shop',
		primaryImageUrl: '/samples/overshirt-jacket.svg',
		secondaryImageUrl: '/samples/tailored-trouser.svg',
	},
	lookbookSlides: [
		{
			id: 'slide-1',
			title: 'سهولة التنسيق في كل قطعة',
			subtitle: 'ألوان محايدة تتكامل معاً لتجهيز إطلالتك في ثوانٍ.',
			ctaLabel: 'تسوّق الآن',
			ctaHref: '/shop',
			imageUrl: '/samples/hero-poster.svg',
		},
		{
			id: 'slide-2',
			title: 'هوديز ثقيلة 450 جم',
			subtitle: 'ثبات في القصة ودفء مثالي لسهرات الموسم.',
			ctaLabel: 'شاهد الهوديز',
			ctaHref: '/c/heavy-hoodies',
			imageUrl: '/samples/heavy-hoodie.svg',
		},
	],
	lookbookTiles: [
		{
			id: 't1',
			label: 'تشكيلة الكتان',
			href: '/c/linen-shirts',
			imageUrl: '/samples/linen-shirt.svg',
		},
		{ id: 't2', label: 'ألوان محايدة', href: '/shop', imageUrl: '/samples/tailored-trouser.svg' },
		{
			id: 't3',
			label: 'طبقات يومية',
			href: '/c/outerwear',
			imageUrl: '/samples/overshirt-jacket.svg',
		},
		{
			id: 't4',
			label: 'هوديز ثقيلة',
			href: '/c/heavy-hoodies',
			imageUrl: '/samples/heavy-hoodie.svg',
		},
		{ id: 't5', label: 'أساسيات الصيف', href: '/shop', imageUrl: '/samples/linen-shirt.svg' },
		{ id: 't6', label: 'لوك بوك الموسم', href: '/shop', imageUrl: '/samples/hero-poster.svg' },
	],
	valuePillars: [
		{
			id: 'vp-1',
			icon: 'fabric',
			title: 'خامات مختارة بعناية',
			description: 'أقمشة قطن وكتان مختبرة لثبات اللون والشكل مع الاستخدام المتكرر.',
		},
		{
			id: 'vp-2',
			icon: 'exchange',
			title: 'استبدال مقاسات مرن',
			description: 'إمكانية استبدال المقاس بسهولة خلال 14 يوماً عبر رسالة واتساب.',
		},
		{
			id: 'vp-3',
			icon: 'delivery',
			title: 'دفع عند الاستلام',
			description: 'شحن سريع لجميع المحافظات مع معاينة الطلب قبل الدفع.',
		},
	],
};
