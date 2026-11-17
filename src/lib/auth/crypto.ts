const PBKDF2_ITERATIONS = 4000;
const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array | null {
	try {
		const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
		const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
		const out = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	} catch {
		return null;
	}
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
	return diff === 0;
}

async function derivePbkdf2(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
	iterations: number,
): Promise<Uint8Array> {
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
		keyMaterial,
		256,
	);
	return new Uint8Array(bits);
}

/** Hashes a password with WebCrypto PBKDF2-SHA256 tuned for Cloudflare Workers 10ms CPU limit. */
export async function hashPassword(password: string): Promise<string> {
	const salt = new Uint8Array(new ArrayBuffer(16));
	crypto.getRandomValues(salt);
	const derived = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const parts = storedHash.split('$');
	if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;
	const iterations = Number.parseInt(parts[1] ?? '', 10);
	const saltRaw = fromBase64Url(parts[2] ?? '');
	const expected = fromBase64Url(parts[3] ?? '');
	if (!Number.isFinite(iterations) || iterations < 1000 || !saltRaw || !expected) return false;
	const salt = new Uint8Array(new ArrayBuffer(saltRaw.byteLength));
	salt.set(saltRaw);
	const actual = await derivePbkdf2(password, salt, iterations);
	return timingSafeEqualBytes(actual, expected);
}

async function hmacSign(message: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
	return toBase64Url(new Uint8Array(sig));
}

export interface SessionPayload {
	userId: string;
	sessionVersion: number;
	exp: number;
}

export async function createSessionToken(
	input: { userId: string; sessionVersion: number; ttlSeconds: number },
	secret: string,
): Promise<string> {
	const payload: SessionPayload = {
		userId: input.userId,
		sessionVersion: input.sessionVersion,
		exp: Math.floor(Date.now() / 1000) + input.ttlSeconds,
	};
	const encoded = toBase64Url(enc.encode(JSON.stringify(payload)));
	const sig = await hmacSign(encoded, secret);
	return `${encoded}.${sig}`;
}

export async function verifySessionToken(
	token: string,
	secret: string,
	expectedSessionVersion: number,
): Promise<SessionPayload | null> {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [encoded, sig] = parts;
	if (!encoded || !sig) return null;

	const expectedSig = await hmacSign(encoded, secret);
	const sigBytes = fromBase64Url(sig);
	const expBytes = fromBase64Url(expectedSig);
	if (!sigBytes || !expBytes || !timingSafeEqualBytes(sigBytes, expBytes)) return null;

	const raw = fromBase64Url(encoded);
	if (!raw) return null;
	try {
		const payload = JSON.parse(new TextDecoder().decode(raw)) as SessionPayload;
		if (
			!payload.userId ||
			payload.sessionVersion !== expectedSessionVersion ||
			payload.exp < Math.floor(Date.now() / 1000)
		) {
			return null;
		}
		return payload;
	} catch {
		return null;
	}
}

export function verifyOriginCsrf(request: Request): boolean {
	if (request.method === 'GET' || request.method === 'HEAD') return true;
	const origin = request.headers.get('Origin');
	if (!origin) return false;
	try {
		const reqUrl = new URL(request.url);
		const origUrl = new URL(origin);
		return origUrl.origin === reqUrl.origin;
	} catch {
		return false;
	}
}
