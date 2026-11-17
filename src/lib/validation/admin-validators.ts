const NON_DIRECT_VIDEO_HOSTS = [
	'instagram.com',
	'tiktok.com',
	'youtube.com',
	'youtu.be',
	'facebook.com',
	'fb.watch',
];

export function validateHeroVideoUrl(rawUrl: string): { ok: boolean; error?: string } {
	const trimmed = rawUrl.trim();
	if (!trimmed) return { ok: true };
	try {
		const u = new URL(trimmed);
		if (u.protocol !== 'https:') {
			return { ok: false, error: 'يجب أن يبدأ رابط الفيديو بـ https://' };
		}
		const host = u.hostname.toLowerCase();
		if (
			NON_DIRECT_VIDEO_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))
		) {
			return {
				ok: false,
				error:
					'روابط صفحات إنستجرام/تيك توك/يوتيوب لا تعمل داخل مشغل الخلفية. ارفع ملف MP4 مباشر أو ضع رابط .mp4 مباشر.',
			};
		}
		return { ok: true };
	} catch {
		return { ok: false, error: 'رابط الفيديو غير صالح.' };
	}
}

export function validateWhatsappNumber(raw: string): string | null {
	const digits = raw.replace(/[\s\-()+]/g, '');
	if (!digits) return null;
	if (/^01[0125][0-9]{8}$/.test(digits)) return `2${digits}`;
	if (/^[0-9]{10,15}$/.test(digits)) return digits;
	return null;
}

export function slugify(text: string): string {
	const ascii = text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return ascii || `item-${Date.now().toString(36)}`;
}

export function validatePublishableProduct(input: {
	title: string;
	basePrice: number;
	images: string[];
	variantsCount: number;
}): { ok: boolean; error?: string } {
	if (input.title.trim().length < 2) {
		return { ok: false, error: 'أدخل اسم المنتج قبل النشر.' };
	}
	if (!Number.isFinite(input.basePrice) || input.basePrice <= 0) {
		return { ok: false, error: 'يجب أن يكون السعر أكبر من صفر قبل النشر.' };
	}
	if (!input.images.length) {
		return { ok: false, error: 'ارفع صورة واحدة على الأقل قبل النشر.' };
	}
	if (input.variantsCount < 1) {
		return { ok: false, error: 'أضف مقاساً ولوناً واحداً على الأقل قبل النشر.' };
	}
	return { ok: true };
}
