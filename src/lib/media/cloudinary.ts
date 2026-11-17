const enc = new TextEncoder();

async function sha1Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-1', enc.encode(input));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function signCloudinaryParams(
	params: Record<string, string | number>,
	apiSecret: string,
): Promise<string> {
	const serialized = Object.keys(params)
		.sort()
		.filter((k) => params[k] !== undefined && params[k] !== '')
		.map((k) => `${k}=${params[k]}`)
		.join('&');
	return sha1Hex(`${serialized}${apiSecret}`);
}

export async function destroyCloudinaryAsset(input: {
	cloudName: string;
	apiKey: string;
	apiSecret: string;
	publicId: string;
	resourceType: 'image' | 'video';
}): Promise<boolean> {
	const timestamp = Math.floor(Date.now() / 1000);
	const signature = await signCloudinaryParams(
		{ public_id: input.publicId, timestamp },
		input.apiSecret,
	);
	const body = new URLSearchParams({
		public_id: input.publicId,
		timestamp: String(timestamp),
		api_key: input.apiKey,
		signature,
	});
	try {
		const res = await fetch(
			`https://api.cloudinary.com/v1_1/${input.cloudName}/${input.resourceType}/destroy`,
			{ method: 'POST', body },
		);
		return res.ok;
	} catch {
		return false;
	}
}

export async function cleanupD1MediaAssets(
	db: D1Database,
	env: {
		CLOUDINARY_CLOUD_NAME?: string;
		CLOUDINARY_API_KEY?: string;
		CLOUDINARY_API_SECRET?: string;
	},
	urls: string[],
): Promise<void> {
	if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return;
	for (const url of urls) {
		const asset = await db
			.prepare('SELECT id, public_id, resource_type FROM media_assets WHERE secure_url = ?')
			.bind(url)
			.first<{ id: string; public_id: string; resource_type: 'image' | 'video' }>();
		if (asset) {
			await destroyCloudinaryAsset({
				cloudName: env.CLOUDINARY_CLOUD_NAME,
				apiKey: env.CLOUDINARY_API_KEY,
				apiSecret: env.CLOUDINARY_API_SECRET,
				publicId: asset.public_id,
				resourceType: asset.resource_type,
			});
			await db.prepare('DELETE FROM media_assets WHERE id = ?').bind(asset.id).run();
		}
	}
}
