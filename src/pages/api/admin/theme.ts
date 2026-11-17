import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { purgeEdgeStorefrontCache } from '../../../lib/cache/edge-cache';
import { getD1HomepageSections, getD1StoreConfig } from '../../../lib/data/d1-store';
import type { HomepageSections, StoreConfig } from '../../../lib/domain/types';
import { resolveThemeTokens } from '../../../lib/theme/presets';
import {
	validateHeroVideoUrl,
	validateWhatsappNumber,
} from '../../../lib/validation/admin-validators';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	const [config, sections] = await Promise.all([
		getD1StoreConfig(auth.db),
		getD1HomepageSections(auth.db),
	]);
	return json({ ok: true, config, sections });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: { config?: Partial<StoreConfig>; sections?: HomepageSections };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	const cfg = body.config ?? {};
	const videoCheck = validateHeroVideoUrl(cfg.heroVideoUrl ?? '');
	if (!videoCheck.ok) {
		return json({ ok: false, error: videoCheck.error }, 400);
	}

	let whatsapp: string | null = null;
	if (cfg.whatsappNumber?.trim()) {
		whatsapp = validateWhatsappNumber(cfg.whatsappNumber);
		if (!whatsapp) {
			return json({ ok: false, error: 'رقم الواتساب غير صالح.' }, 400);
		}
	}

	const themeCheck = resolveThemeTokens({
		presetId: cfg.presetId,
		radiusPreset: cfg.radiusPreset,
		customAccent: cfg.customAccent,
		customBtnBg: cfg.customBtnBg,
		customBtnText: cfg.customBtnText,
	});

	const existingSections = await getD1HomepageSections(auth.db);
	const sectionsJson = JSON.stringify(body.sections ?? existingSections);

	await auth.db
		.prepare(
			`UPDATE store_config SET
				store_name = ?, tagline = ?, logo_url = ?, preset_id = ?,
				custom_accent = ?, custom_btn_bg = ?, custom_btn_text = ?, radius_preset = ?,
				language_mode = ?, default_lang = ?, currency = ?, announcement_text = ?,
				hero_title = ?, hero_subtitle = ?, hero_cta_label = ?, hero_cta_href = ?,
				hero_poster_url = ?, hero_video_url = ?, whatsapp_number = ?, instagram_url = ?,
				default_size_guide = ?, global_free_shipping_threshold = ?, meta_pixel_id = ?,
				tiktok_pixel_id = ?, homepage_sections_json = ?, updated_at = ?
			WHERE id = 1`,
		)
		.bind(
			String(cfg.storeName || 'NEW BRAND').trim(),
			String(cfg.tagline || '').trim(),
			cfg.logoUrl?.trim() || null,
			cfg.presetId || 'flagship_editorial',
			cfg.customAccent?.trim() || null,
			cfg.customBtnBg?.trim() || null,
			cfg.customBtnText?.trim() || null,
			cfg.radiusPreset || 'sharp',
			cfg.languageMode || 'both',
			cfg.defaultLang || 'ar',
			String(cfg.currency || 'ج.م').trim(),
			cfg.announcementText?.trim() || null,
			String(cfg.heroTitle || '').trim(),
			String(cfg.heroSubtitle || '').trim(),
			String(cfg.heroCtaLabel || 'تسوّق الآن').trim(),
			String(cfg.heroCtaHref || '/shop').trim(),
			String(cfg.heroPosterUrl || '/samples/hero-poster.svg').trim(),
			cfg.heroVideoUrl?.trim() || null,
			whatsapp,
			cfg.instagramUrl?.trim() || null,
			cfg.defaultSizeGuide?.trim() || null,
			cfg.globalFreeShippingThreshold ?? null,
			cfg.metaPixelId?.trim() || null,
			cfg.tiktokPixelId?.trim() || null,
			sectionsJson,
			new Date().toISOString(),
		)
		.run();

	await purgeEdgeStorefrontCache(request.url);
	return json({ ok: true, contrastWarning: themeCheck.contrastWarning });
};
