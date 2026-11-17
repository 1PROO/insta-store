export const MODEST_SECTIONS = {
	heroHotspots: [
		{
			productSlug: 'french-khimar-niqab-set',
			label: 'طقم خمار فرنسي ونقاب',
			priceLabel: '650 ج.م',
			xPercent: 68,
			yPercent: 31,
		},
		{
			productSlug: 'sand-korean-crepe-set',
			label: 'عباية كريب رملي دافئ',
			priceLabel: '1,690 ج.م',
			xPercent: 71,
			yPercent: 60,
		},
	],
	promoCards: [
		{
			id: 'promo-1',
			title: 'عبايات الكريب الفاخرة',
			subtitle: 'قصّات سعودية وكيمونو واسعة بخامة غير شفافة تنساب برقيّ.',
			ctaLabel: 'تسوّقي العبايات',
			ctaHref: '/c/abayas',
			imageUrl: '/demo/abaya-bisht-black.webp',
		},
		{
			id: 'promo-2',
			title: 'خمارات فرنسية ونقابات مسامية',
			subtitle: 'تغطية محتشمة ثابتة وتهوية مثالية تناسب الاستخدام اليومي.',
			ctaLabel: 'تسوّقي الخمارات',
			ctaHref: '/c/khimars-niqab',
			imageUrl: '/demo/khimar-niqab-mocha.webp',
		},
	],
	brandStory: {
		eyebrow: 'قصة الخامة والستر',
		title: 'خامات طبيعية ومحتشمة تعيش معك',
		body: 'نختار بعناية أقمشة الكريب الكوري وحرير المدينة والكتان البارد غير الشفاف لتمنحك تغطية كاملة وتهوية مريحة طوال اليوم دون الحاجة لطبقات ثقيلة.',
		ctaLabel: 'استعرضي كل القطع',
		ctaHref: '/shop',
		primaryImageUrl: '/demo/fabrics-story.webp',
		secondaryImageUrl: '/demo/abaya-kimono-espresso.webp',
	},
	lookbookSlides: [
		{
			id: 'slide-1',
			title: 'إطلالة الستر والهدوء',
			subtitle: 'تنسيقات متكاملة من العباية والخمار والنقاب بنفس درجة القماش.',
			ctaLabel: 'تسوّقي الآن',
			ctaHref: '/shop',
			imageUrl: '/demo/hero-modest-editorial.webp',
		},
		{
			id: 'slide-2',
			title: 'فساتين وجلباب الصيف البارد',
			subtitle: 'خامات قطن وكتان طبيعي بألوان ترابية هادئة.',
			ctaLabel: 'شاهدي الفساتين',
			ctaHref: '/c/modest-dresses',
			imageUrl: '/demo/dress-sage-olive.webp',
		},
	],
	lookbookTiles: [
		{
			id: 't1',
			label: 'عبايات سوداء',
			href: '/c/abayas',
			imageUrl: '/demo/abaya-bisht-black.webp',
		},
		{
			id: 't2',
			label: 'خمار ونقاب',
			href: '/c/khimars-niqab',
			imageUrl: '/demo/khimar-niqab-mocha.webp',
		},
		{
			id: 't3',
			label: 'كيمونو كتان',
			href: '/c/abayas',
			imageUrl: '/demo/abaya-kimono-espresso.webp',
		},
		{
			id: 't4',
			label: 'فساتين محتشمة',
			href: '/c/modest-dresses',
			imageUrl: '/demo/dress-sage-olive.webp',
		},
		{
			id: 't5',
			label: 'جلباب قطعتين',
			href: '/c/jilbab-isdal',
			imageUrl: '/demo/jilbab-rosewood.webp',
		},
		{ id: 't6', label: 'خامات طبيعية', href: '/shop', imageUrl: '/demo/fabrics-story.webp' },
	],
	valuePillars: [
		{
			id: 'vp-1',
			icon: 'fabric',
			title: 'أقمشة غير شفافة 100%',
			description: 'كريب كوري وحرير مدينة وكتان بارد مختبر لثبات اللون وعدم الشفافية.',
		},
		{
			id: 'vp-2',
			icon: 'exchange',
			title: 'استبدال مقاس مرن',
			description: 'إمكانية استبدال المقاس بسهولة خلال 14 يوماً عبر رسالة واتساب.',
		},
		{
			id: 'vp-3',
			icon: 'delivery',
			title: 'الدفع عند الاستلام',
			description: 'شحن سريع لجميع المحافظات مع معاينة الطلب قبل الدفع.',
		},
	],
};

export const MODEST_COLLECTIONS = [
	['col-abayas', 'عبايات وكيمونو', 'abayas', '/demo/abaya-kimono-espresso.webp', 1],
	['col-khimar', 'خمارات ونقابات', 'khimars-niqab', '/demo/khimar-niqab-mocha.webp', 2],
	['col-dresses', 'فساتين محتشمة', 'modest-dresses', '/demo/dress-sage-olive.webp', 3],
	['col-isdal', 'جلباب وإسدالات', 'jilbab-isdal', '/demo/jilbab-rosewood.webp', 4],
];

export const MODEST_PRODUCTS = [
	{
		id: 'prod-bisht-black',
		title: 'عباية بشت سعودي كريب ملكي',
		slug: 'saudi-bisht-black-abaya',
		description:
			'عباية بشت واسعة بتفصيل مريح وانسيابية ناعمة من الكريب الكوري الأسود غير اللامع، مثالية للخروج اليومي والمناسبات مع أكمام مبطنة وتقفيل دقيق.',
		fabricCare: 'كريب كوري درجة أولى — غسيل يدوي بارد وكيّ بالبخار',
		basePrice: 1450,
		compareAtPrice: 1750,
		collectionId: 'col-abayas',
		images: ['/demo/abaya-bisht-black.webp', '/demo/fabrics-story.webp'],
		variants: [
			['var-bb-1', '52-54 (1)', 'أسود ملكي', '#141414', 8, null],
			['var-bb-2', '56 (2)', 'أسود ملكي', '#141414', 6, null],
			['var-bb-3', '58-60 (3)', 'أسود ملكي', '#141414', 4, null],
			['var-bb-4', '56 (2)', 'كحلي داكن', '#1B2432', 5, null],
		],
	},
	{
		id: 'prod-kimono-espresso',
		title: 'عباية كيمونو كتان إسبريسو',
		slug: 'espresso-linen-kimono-abaya',
		description:
			'كيمونو واسع بقصّة محتشمة وأكتاف ساقطة من الكتان المخلوط البارد، يمنحك حرية الحركة ويُنسّق بسهولة فوق الفساتين أو الإسدالات.',
		fabricCare: 'كتان قطني معالج ضد الكرمشة — غسيل لطيف 30 درجة',
		basePrice: 1390,
		compareAtPrice: null,
		collectionId: 'col-abayas',
		images: ['/demo/abaya-kimono-espresso.webp', '/demo/hero-modest-editorial.webp'],
		variants: [
			['var-ke-1', '52-54 (1)', 'بني إسبريسو', '#4A3728', 7, null],
			['var-ke-2', '56 (2)', 'بني إسبريسو', '#4A3728', 5, null],
			['var-ke-3', '56 (2)', 'رملي دافئ', '#CBBBA0', 4, null],
		],
	},
	{
		id: 'prod-khimar-mocha',
		title: 'طقم خمار فرنسي طويل + نقاب',
		slug: 'french-khimar-niqab-set',
		description:
			'طقم متكامل يضم خماراً فرنسياً برباط خلفي وتغطية ممتدة للذراعين والظهر مع نقاب طويل مسامي برباط عريض مريح دون ضغط على الأنف.',
		fabricCare: 'شيفون حرير مدينة غير شفاف — لا يحتاج كيّاً متكرراً',
		basePrice: 650,
		compareAtPrice: 780,
		collectionId: 'col-khimar',
		images: ['/demo/khimar-niqab-mocha.webp', '/demo/hero-modest-editorial.webp'],
		variants: [
			['var-km-1', 'قياس وسط', 'موكا ناعم', '#8C7A6B', 12, null],
			['var-km-2', 'قياس طويل', 'موكا ناعم', '#8C7A6B', 9, 690],
			['var-km-3', 'قياس وسط', 'أسود مطفي', '#141414', 15, null],
			['var-km-4', 'قياس وسط', 'بيج رملي', '#D8C7B2', 8, null],
		],
	},
	{
		id: 'prod-dress-sage',
		title: 'فستان ماكسي واسع قطن وكتان',
		slug: 'sage-olive-modest-dress',
		description:
			'فستان محتشم واسع الكلوش بجيوب جانبية مخفية وأكمام بأستيك ناعم للوضوء، مصمم ليكون أساسياً مريحاً للجامعة والعمل.',
		fabricCare: 'قطن وكتان طبيعي 100% — غسيل بارد',
		basePrice: 1250,
		compareAtPrice: null,
		collectionId: 'col-dresses',
		images: ['/demo/dress-sage-olive.webp', '/demo/fabrics-story.webp'],
		variants: [
			['var-ds-1', 'S / M', 'زيتوني هادئ', '#6F7D65', 6, null],
			['var-ds-2', 'L / XL', 'زيتوني هادئ', '#6F7D65', 7, null],
			['var-ds-3', 'XXL', 'زيتوني هادئ', '#6F7D65', 3, null],
		],
	},
	{
		id: 'prod-jilbab-rosewood',
		title: 'طقم جلباب قطعتين بأكمام واسعة',
		slug: 'rosewood-two-piece-jilbab',
		description:
			'جلباب شرعي من قطعتين: علوية طويلة فضفاضة مع أساور محكمة وجيب واسع بوسط أستيك مريح لتغطية كاملة وأناقة عملية.',
		fabricCare: 'كريب سي واي بارد — سريع الجفاف وسهل العناية',
		basePrice: 1350,
		compareAtPrice: 1550,
		collectionId: 'col-isdal',
		images: ['/demo/jilbab-rosewood.webp', '/demo/khimar-niqab-mocha.webp'],
		variants: [
			['var-jr-1', '52-54 (1)', 'روزوود دافئ', '#A98A82', 6, null],
			['var-jr-2', '56 (2)', 'روزوود دافئ', '#A98A82', 5, null],
			['var-jr-3', '58-60 (3)', 'فحمي', '#2B2B2B', 4, null],
		],
	},
	{
		id: 'prod-sand-set',
		title: 'طقم عباية وخمار ونقاب كريب رملي',
		slug: 'sand-korean-crepe-set',
		description:
			'طقم الستر المتكامل بلون رملي فاخر: عباية كلوش بقصّة متسعة مع خمار متناسق ونقاب متطابق الدرجة، جاهز للارتداء مباشرة دون عناء التنسيق.',
		fabricCare: 'كريب كوري فاخر — غسيل لطيف وتجفيف على شماعة',
		basePrice: 1690,
		compareAtPrice: 1950,
		collectionId: 'col-abayas',
		images: ['/demo/hero-modest-editorial.webp', '/demo/fabrics-story.webp'],
		variants: [
			['var-ss-1', '52-54 (1)', 'رملي دافئ', '#D5C3AA', 5, null],
			['var-ss-2', '56 (2)', 'رملي دافئ', '#D5C3AA', 6, null],
			['var-ss-3', '58-60 (3)', 'رملي دافئ', '#D5C3AA', 4, null],
		],
	},
];
