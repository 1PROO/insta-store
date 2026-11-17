/** Resizes a phone photo via HTML Canvas to WebP <= 1600px and < 400KB before direct Cloudinary upload. */
export async function resizeImageToWebp(file: File, maxDim = 1600): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) return file;
	ctx.drawImage(bitmap, 0, 0, w, h);

	const qualities = [0.82, 0.7, 0.56];
	let lastBlob: Blob = file;
	for (const q of qualities) {
		const blob = await new Promise<Blob>((resolve) => {
			canvas.toBlob((b) => resolve(b || file), 'image/webp', q);
		});
		lastBlob = blob;
		if (blob.size <= 400 * 1024) return blob;
	}
	return lastBlob;
}

export async function uploadDirectToCloudinary(
	file: File,
	resourceType: 'image' | 'video',
): Promise<{ ok: true; url: string; publicId: string } | { ok: false; error: string }> {
	if (resourceType === 'video') {
		if (file.size > 5 * 1024 * 1024) {
			return {
				ok: false,
				error: 'الحد الأقصى لحجم فيديو الهيرو هو 5 ميجابايت حفاظاً على سرعة الموبايل.',
			};
		}
		if (!['video/mp4', 'video/webm'].includes(file.type)) {
			return { ok: false, error: 'صيغة الفيديو المدعومة هي MP4 أو WebM فقط.' };
		}
	}

	const signRes = await fetch('/api/admin/media-sign', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ resourceType }),
	});
	const signData = (await signRes.json()) as {
		ok: boolean;
		error?: string;
		uploadUrl?: string;
		apiKey?: string;
		timestamp?: number;
		signature?: string;
		folder?: string;
	};
	if (!signRes.ok || !signData.ok || !signData.uploadUrl) {
		return { ok: false, error: signData.error || 'تعذر توقيع الرفع.' };
	}

	const payloadBlob = resourceType === 'image' ? await resizeImageToWebp(file) : file;
	const form = new FormData();
	form.append('file', payloadBlob);
	form.append('api_key', String(signData.apiKey));
	form.append('timestamp', String(signData.timestamp));
	form.append('signature', String(signData.signature));
	form.append('folder', String(signData.folder));

	const upRes = await fetch(signData.uploadUrl, { method: 'POST', body: form });
	const upData = (await upRes.json()) as {
		secure_url?: string;
		public_id?: string;
		bytes?: number;
		error?: { message?: string };
	};
	if (!upRes.ok || !upData.secure_url) {
		return { ok: false, error: upData.error?.message || 'فشل الرفع إلى Cloudinary.' };
	}

	if (upData.public_id) {
		await fetch('/api/admin/media-record', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				publicId: upData.public_id,
				secureUrl: upData.secure_url,
				resourceType,
				bytes: upData.bytes ?? payloadBlob.size,
			}),
		}).catch(() => {});
	}

	return { ok: true, url: upData.secure_url, publicId: upData.public_id || '' };
}
