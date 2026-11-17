export interface AppWorkerEnv {
	DB?: D1Database;
	SESSION_SECRET?: string;
	CLOUDINARY_CLOUD_NAME?: string;
	CLOUDINARY_API_KEY?: string;
	CLOUDINARY_API_SECRET?: string;
	TURNSTILE_SITE_KEY?: string;
	TURNSTILE_SECRET_KEY?: string;
	PUBLIC_SITE_URL?: string;
}

const DEV_FALLBACK_SECRET = 'local-dev-only-change-in-production-secret-key';

export async function getWorkerEnv(): Promise<AppWorkerEnv> {
	try {
		const mod = await import('cloudflare:workers');
		return (mod.env ?? {}) as AppWorkerEnv;
	} catch {
		return {};
	}
}

export function resolveSessionSecret(workerEnv: AppWorkerEnv, requestUrl?: string): string {
	if (workerEnv.SESSION_SECRET && workerEnv.SESSION_SECRET.length >= 24) {
		return workerEnv.SESSION_SECRET;
	}
	if (requestUrl) {
		try {
			const u = new URL(requestUrl);
			const isLocal =
				u.protocol === 'http:' &&
				(u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname.startsWith('100.'));
			if (!isLocal) {
				throw new Error('SESSION_SECRET must be configured in production.');
			}
		} catch (err) {
			if (err instanceof Error && err.message.includes('SESSION_SECRET')) throw err;
		}
	}
	return DEV_FALLBACK_SECRET;
}
