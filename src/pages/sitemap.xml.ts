import type { APIRoute } from 'astro';
import { createStoreRepository } from '../lib/data/store-repository';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ url }) => {
	const repo = createStoreRepository();
	const [collections, products] = await Promise.all([
		repo.getVisibleCollections(),
		repo.getPublishedProducts(),
	]);

	const origin = url.origin;
	const today = new Date().toISOString().slice(0, 10);
	const urls = [
		`${origin}/`,
		`${origin}/shop`,
		...collections.map((c) => `${origin}/c/${encodeURIComponent(c.slug)}`),
		...products.map((p) => `${origin}/p/${encodeURIComponent(p.slug)}`),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		status: 200,
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
