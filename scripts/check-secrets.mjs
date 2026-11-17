import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const FORBIDDEN_FILES = new Set(['.env', '.env.local', '.env.production', '.dev.vars']);
const SECRET_PATTERNS = [
	{ name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
	{ name: 'AWS / R2 Access Key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
	{ name: 'GitHub PAT', regex: /\b(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{30,}\b/ },
	{ name: 'Cloudinary URL Secret', regex: /cloudinary:\/\/[0-9]+:[A-Za-z0-9_-]{12,}@/ },
	{
		name: 'Hardcoded Secret Assignment',
		regex:
			/(?:CLOUDINARY_API_SECRET|SESSION_SECRET|TURNSTILE_SECRET_KEY|CLOUDFLARE_API_TOKEN)\s*[:=]\s*["'][A-Za-z0-9_/+=-]{16,}["']/,
	},
];

function getFilesToScan() {
	const out = execSync('git ls-files --cached --others --exclude-standard', {
		encoding: 'utf8',
	});
	return out
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean);
}

const violations = [];

for (const file of getFilesToScan()) {
	const base = file.split('/').pop() ?? '';
	if (FORBIDDEN_FILES.has(base)) {
		violations.push(`${file}:1 -> Forbidden secret file tracked/unignored`);
		continue;
	}
	if (
		file.startsWith('node_modules/') ||
		file.startsWith('dist/') ||
		file.startsWith('.astro/') ||
		file.startsWith('.wrangler/') ||
		file === 'scripts/check-secrets.mjs'
	) {
		continue;
	}

	let stats;
	try {
		stats = statSync(file);
	} catch {
		continue;
	}
	if (!stats.isFile() || stats.size > 1024 * 1024) continue;

	const lines = readFileSync(file, 'utf8').split('\n');
	lines.forEach((line, idx) => {
		for (const pat of SECRET_PATTERNS) {
			if (pat.regex.test(line)) {
				violations.push(`${file}:${idx + 1} -> Possible ${pat.name}`);
			}
		}
	});
}

if (violations.length > 0) {
	console.error('SECRET SCANNER GUARD FAILED:');
	for (const v of violations) console.error(`  - ${v}`);
	process.exit(1);
}

console.log('Secret scanner guard passed.');
