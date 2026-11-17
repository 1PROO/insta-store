import { describe, expect, it } from 'vitest';
import {
	createSessionToken,
	hashPassword,
	verifyOriginCsrf,
	verifyPassword,
	verifySessionToken,
} from '../src/lib/auth/crypto';
import { resolveSessionSecret } from '../src/lib/env';
import { sanitizeHref } from '../src/lib/security/urls';
import {
	validateHeroVideoUrl,
	validateWhatsappNumber,
} from '../src/lib/validation/admin-validators';

const SECRET = 'test-session-secret-with-plenty-of-entropy-123456';

describe('WebCrypto PBKDF2 password hashing (<10ms Workers CPU)', () => {
	it('hashes and verifies passwords quickly and rejects wrong passwords', async () => {
		const start = performance.now();
		const hash = await hashPassword('StrongPass!2026');
		const ok = await verifyPassword('StrongPass!2026', hash);
		const bad = await verifyPassword('WrongPass!2026', hash);
		const elapsed = performance.now() - start;

		expect(ok).toBe(true);
		expect(bad).toBe(false);
		expect(hash.startsWith('pbkdf2_sha256$')).toBe(true);
		// Must stay lightweight for Workers Free 10ms CPU limit
		expect(elapsed).toBeLessThan(50);
	});
});

describe('HMAC signed admin_session tokens & CSRF', () => {
	it('verifies valid session token and rejects tampered or version-mismatched tokens', async () => {
		const token = await createSessionToken(
			{ userId: 'admin-1', sessionVersion: 2, ttlSeconds: 3600 },
			SECRET,
		);
		const valid = await verifySessionToken(token, SECRET, 2);
		expect(valid?.userId).toBe('admin-1');

		// Revoked session after password change (sessionVersion bumped to 3)
		const revoked = await verifySessionToken(token, SECRET, 3);
		expect(revoked).toBeNull();

		// Tampered signature
		const tampered = `${token.slice(0, -4)}aaaa`;
		expect(await verifySessionToken(tampered, SECRET, 2)).toBeNull();
	});

	it('enforces strict Origin/Host CSRF check on mutations', () => {
		const goodReq = new Request('https://store.example.com/api/admin/products', {
			method: 'POST',
			headers: { Origin: 'https://store.example.com' },
		});
		expect(verifyOriginCsrf(goodReq)).toBe(true);

		const evilReq = new Request('https://store.example.com/api/admin/products', {
			method: 'POST',
			headers: { Origin: 'https://evil.attacker.com' },
		});
		expect(verifyOriginCsrf(evilReq)).toBe(false);

		const missingOriginMutation = new Request('https://store.example.com/api/admin/products', {
			method: 'POST',
		});
		expect(verifyOriginCsrf(missingOriginMutation)).toBe(false);
	});
});

describe('Dashboard Mistake-Proofing validators', () => {
	it('rejects social webpage URLs for direct Hero video and accepts direct MP4/WebM', () => {
		expect(validateHeroVideoUrl('https://www.instagram.com/reel/abc123/').ok).toBe(false);
		expect(validateHeroVideoUrl('https://www.tiktok.com/@brand/video/123').ok).toBe(false);
		expect(validateHeroVideoUrl('https://www.youtube.com/watch?v=123').ok).toBe(false);
		expect(validateHeroVideoUrl('https://res.cloudinary.com/demo/video/upload/hero.mp4').ok).toBe(
			true,
		);
		expect(validateHeroVideoUrl('').ok).toBe(true);
	});

	it('normalizes valid WhatsApp numbers and rejects junk text', () => {
		expect(validateWhatsappNumber('01012345678')).toBe('201012345678');
		expect(validateWhatsappNumber('+20 101 234 5678')).toBe('201012345678');
		expect(validateWhatsappNumber('abc')).toBeNull();
	});
});

describe('Security URL sanitization & fail-closed session secret', () => {
	it('blocks javascript/data/protocol-relative hrefs while allowing safe paths and https', () => {
		expect(sanitizeHref('javascript:alert(1)')).toBe('#');
		expect(sanitizeHref('DATA:text/html,<script>alert(1)</script>')).toBe('#');
		expect(sanitizeHref('//evil.example/phish')).toBe('#');
		expect(sanitizeHref('/shop?sort=price_asc')).toBe('/shop?sort=price_asc');
		expect(sanitizeHref('https://instagram.com/brand')).toBe('https://instagram.com/brand');
	});

	it('fails closed in non-local production when SESSION_SECRET is missing or short', () => {
		expect(() => resolveSessionSecret({}, 'https://shop.example.com/admin')).toThrow(
			/SESSION_SECRET/,
		);
		expect(() =>
			resolveSessionSecret({ SESSION_SECRET: 'short' }, 'https://shop.example.com/admin'),
		).toThrow(/SESSION_SECRET/);
		expect(resolveSessionSecret({}, 'http://localhost:4321/admin').length).toBeGreaterThanOrEqual(
			24,
		);
		expect(
			resolveSessionSecret({}, 'http://100.70.15.49:4321/admin').length,
		).toBeGreaterThanOrEqual(24);
		expect(resolveSessionSecret({ SESSION_SECRET: SECRET }, 'https://shop.example.com')).toBe(
			SECRET,
		);
	});
});
