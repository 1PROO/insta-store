import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';

/**
 * Generates and applies a clean blank client-handover seed SQL to local or remote D1.
 * Usage:
 *   ADMIN_EMAIL=owner@brand.com ADMIN_PASSWORD=StrongPassword123 node scripts/seed-blank.mjs --local
 *   ADMIN_EMAIL=owner@brand.com ADMIN_PASSWORD=StrongPassword123 node scripts/seed-blank.mjs --remote
 */

const isRemote = process.argv.includes('--remote');
const email = (process.env.ADMIN_EMAIL || 'owner@store.local').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'ChangeMe!2026';

function hashPasswordNode(pwd) {
	const iterations = 4000;
	const salt = crypto.randomBytes(16);
	const derived = crypto.pbkdf2Sync(pwd, salt, iterations, 32, 'sha256');
	const b64u = (buf) =>
		buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return `pbkdf2_sha256$${iterations}$${b64u(salt)}$${b64u(derived)}`;
}

const esc = (s) => String(s).replace(/'/g, "''");
const now = new Date().toISOString();
const pwdHash = hashPasswordNode(password);

const sql = `
INSERT OR IGNORE INTO store_config (
	id, store_name, tagline, preset_id, radius_preset, language_mode, default_lang,
	currency, hero_title, hero_subtitle, hero_cta_label, hero_cta_href, hero_poster_url,
	global_free_shipping_threshold, homepage_sections_json, updated_at
) VALUES (
	1, 'NEW BRAND', 'متجر ملابس مخصص', 'flagship_editorial', 'sharp', 'both', 'ar',
	'ج.م', 'تشكيلة الموسم الجديد', 'خامات طبيعية وقصّات مريحة لكل يوم', 'تسوّق الآن', '/shop',
	'/samples/hero-poster.svg', 1500, '{}', '${esc(now)}'
);

INSERT OR IGNORE INTO shipping_zones (id, name, fee, free_shipping_threshold, is_active) VALUES
	('zone-cairo', 'القاهرة والجيزة', 65, NULL, 1),
	('zone-alex', 'الإسكندرية', 75, NULL, 1),
	('zone-delta', 'الدلتا ومدن القناة', 85, NULL, 1),
	('zone-upper', 'صعيد مصر', 100, NULL, 1);

INSERT OR REPLACE INTO admin_users (
	id, email, password_hash, session_version, must_change_password, failed_attempts, locked_until, created_at
) VALUES (
	'admin-owner', '${esc(email)}', '${esc(pwdHash)}', 1, 1, 0, NULL, '${esc(now)}'
);
`;

const tmpSqlPath = '/tmp/insta-store-seed-blank.sql';
writeFileSync(tmpSqlPath, sql, 'utf8');
const targetFlag = isRemote ? '--remote' : '--local';
execSync(`npx wrangler d1 execute insta-store-db ${targetFlag} --file=${tmpSqlPath}`, {
	stdio: 'inherit',
});
console.log(`Seeded blank store + admin (${email}) on ${targetFlag}.`);
