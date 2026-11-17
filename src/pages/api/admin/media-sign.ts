import type { APIRoute } from 'astro';
import { requireAdminApi } from '../../../lib/auth/guard';
import { getWorkerEnv } from '../../../lib/env';
import { signCloudinaryParams } from '../../../lib/media/cloudinary';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi(request, cookies);
	if (!auth.ok) return auth.response;

	let body: { resourceType?: 'image' | 'video'; folder?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, 400);
	}

	const env = await getWorkerEnv();
	const cloudName = env.CLOUDINARY_CLOUD_NAME;
	const apiKey = env.CLOUDINARY_API_KEY;
	const apiSecret = env.CLOUDINARY_API_SECRET;
	if (!cloudName || !apiKey || !apiSecret) {
		return json(
			{
				ok: false,
				error:
					'بيانات Cloudinary غير مضبوطة في أسرار الخادم بعد (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).',
			},
			501,
		);
	}

	const timestamp = Math.floor(Date.now() / 1000);
	const folder = body.folder || 'insta-store';
	const signature = await signCloudinaryParams({ folder, timestamp }, apiSecret);
	const resourceType = body.resourceType === 'video' ? 'video' : 'image';

	return json({
		ok: true,
		cloudName,
		apiKey,
		timestamp,
		folder,
		signature,
		uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
	});
};
