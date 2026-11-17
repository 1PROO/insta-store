import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { MODEST_COLLECTIONS, MODEST_PRODUCTS, MODEST_SECTIONS } from './modest-demo-data.mjs';

/**
 * Populates a complete women's modest/niqabi fashion demo catalog + Impulse sections
 * so a new client storefront opens fully styled and ready to customize in /admin.
 * Usage:
 *   node scripts/seed-modest-demo.mjs --local
 *   node scripts/seed-modest-demo.mjs --remote --db=sesame-store-db
 */

const isRemote = process.argv.includes('--remote');
const dbArg = process.argv.find((a) => a.startsWith('--db='));
const dbName = dbArg ? dbArg.slice(5) : 'insta-store-db';
const esc = (s) => String(s).replace(/'/g, "''");
const now = new Date().toISOString();

function defaultOwnerSql() {
	const salt = crypto.randomBytes(16);
	const derived = crypto.pbkdf2Sync('ChangeMe!2026', salt, 4000, 32, 'sha256');
	const b64u = (b) =>
		b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	const hash = `pbkdf2_sha256$4000$${b64u(salt)}$${b64u(derived)}`;
	return `INSERT OR IGNORE INTO admin_users (id, email, password_hash, session_version, must_change_password, failed_attempts, locked_until, created_at) VALUES ('admin-owner', 'owner@store.local', '${esc(hash)}', 1, 1, 0, NULL, '${esc(now)}');`;
}

const sqlParts = [
	`INSERT OR REPLACE INTO store_config (
		id, store_name, tagline, preset_id, radius_preset, language_mode, default_lang,
		currency, announcement_text, hero_title, hero_subtitle, hero_cta_label, hero_cta_href,
		hero_poster_url, whatsapp_number, instagram_url, default_size_guide,
		global_free_shipping_threshold, homepage_sections_json, updated_at
	) VALUES (
		1, 'SESAME', 'أزياء محتشمة وعبايات ونقابات بتفصيل راقٍ', 'warm_dune', 'sharp', 'both', 'ar',
		'ج.م', 'شحن مجاني للطلبات فوق 1,500 ج.م — كود الخصم WELCOME10 خصم 10%',
		'إطلالة محتشمة بفخامة هادئة',
		'عبايات كريب كوري، خمارات فرنسية ونقابات مسامية مصممة للراحة والأناقة اليومية.',
		'تسوّقي التشكيلة', '/shop', '/demo/hero-modest-editorial.webp',
		'201000000000', 'https://instagram.com',
		'مقاس 1 (52-54): طول 135-140 سم | مقاس 2 (56): طول 145 سم | مقاس 3 (58-60): طول 150-155 سم',
		1500, '${esc(JSON.stringify(MODEST_SECTIONS))}', '${esc(now)}'
	);`,
	`INSERT OR IGNORE INTO shipping_zones (id, name, fee, free_shipping_threshold, is_active) VALUES
		('zone-cairo', 'القاهرة والجيزة', 65, NULL, 1),
		('zone-alex', 'الإسكندرية', 75, NULL, 1),
		('zone-delta', 'الدلتا ومدن القناة', 85, NULL, 1),
		('zone-upper', 'صعيد مصر', 100, NULL, 1);`,
	`INSERT OR IGNORE INTO coupons (id, code, type, value, min_subtotal, max_uses, used_count, expires_at, is_active) VALUES
		('coupon-welcome10', 'WELCOME10', 'percentage', 10, 500, NULL, 0, NULL, 1);`,
	defaultOwnerSql(),
	...MODEST_COLLECTIONS.map(
		([id, name, slug, img, order]) =>
			`INSERT OR REPLACE INTO collections (id, name, slug, image_url, sort_order, is_visible) VALUES ('${esc(id)}', '${esc(name)}', '${esc(slug)}', '${esc(img)}', ${order}, 1);`,
	),
	...MODEST_PRODUCTS.flatMap((p) => [
		`INSERT OR REPLACE INTO products (id, title, slug, description, fabric_care, size_guide, base_price, compare_at_price, collection_id, images_json, status, is_featured, was_ever_published, deleted_at, created_at) VALUES ('${esc(p.id)}', '${esc(p.title)}', '${esc(p.slug)}', '${esc(p.description)}', '${esc(p.fabricCare)}', NULL, ${p.basePrice}, ${p.compareAtPrice ?? 'NULL'}, '${esc(p.collectionId)}', '${esc(JSON.stringify(p.images))}', 'published', 1, 1, NULL, '${esc(now)}');`,
		...p.variants.map(
			([vid, sz, cname, chex, stk, po]) =>
				`INSERT OR REPLACE INTO variants (id, product_id, size, color_name, color_hex, stock, price_override) VALUES ('${esc(vid)}', '${esc(p.id)}', '${esc(sz)}', '${esc(cname)}', '${esc(chex)}', ${stk}, ${po ?? 'NULL'});`,
		),
	]),
];

const tmpPath = '/tmp/insta-store-modest-demo.sql';
writeFileSync(tmpPath, sqlParts.join('\n'), 'utf8');
if (!process.argv.includes('--dry-sql')) {
	const flag = isRemote ? '--remote' : '--local';
	execSync(`./node_modules/.bin/wrangler d1 execute ${dbName} ${flag} --file=${tmpPath}`, {
		stdio: 'inherit',
	});
	console.log(`Seeded modestwear demo data onto ${dbName} (${flag}).`);
} else {
	console.log(`Generated ${tmpPath}`);
}
