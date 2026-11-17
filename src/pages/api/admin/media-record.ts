import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;
	const body = (await request.json().catch(() => ({}))) as {
		publicId?: string;
		secureUrl?: string;
		resourceType?: 'image' | 'video';
		bytes?: number;
	};
	if (!body.publicId || !body.secureUrl) {
		return new Response(JSON.stringify({ ok: false, error: 'Missing asset fields' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	await auth.db
		.prepare(
			'INSERT OR IGNORE INTO media_assets (id, public_id, secure_url, resource_type, bytes, owner_ref, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)',
		)
		.bind(
			crypto.randomUUID(),
			body.publicId,
			body.secureUrl,
			body.resourceType === 'video' ? 'video' : 'image',
			Number(body.bytes ?? 0),
			new Date().toISOString(),
		)
		.run();
	return new Response(JSON.stringify({ ok: true }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
};
