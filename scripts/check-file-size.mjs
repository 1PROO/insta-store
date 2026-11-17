import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const MAX_CODE_LINES = 300;
const MAX_ASSET_BYTES = 512 * 1024;
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.astro', '.css']);

function getRepoFiles() {
	const out = execSync('git ls-files --cached --others --exclude-standard', {
		encoding: 'utf8',
	});
	return out
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean);
}

const failures = [];

for (const file of getRepoFiles()) {
	if (
		file.startsWith('node_modules/') ||
		file.startsWith('dist/') ||
		file.startsWith('.astro/') ||
		file.startsWith('.wrangler/') ||
		file.startsWith('.motalim/') ||
		file === 'package-lock.json' ||
		file === 'worker-configuration.d.ts'
	) {
		continue;
	}

	let stats;
	try {
		stats = statSync(file);
	} catch {
		continue;
	}
	if (!stats.isFile()) continue;

	const dot = file.lastIndexOf('.');
	const ext = dot >= 0 ? file.slice(dot).toLowerCase() : '';

	if (CODE_EXTS.has(ext)) {
		const lines = readFileSync(file, 'utf8').split('\n').length;
		if (lines > MAX_CODE_LINES) {
			failures.push(`${file}: ${lines} lines (limit ${MAX_CODE_LINES})`);
		}
	} else if (stats.size > MAX_ASSET_BYTES) {
		failures.push(
			`${file}: ${(stats.size / 1024).toFixed(1)} KB (limit ${(MAX_ASSET_BYTES / 1024).toFixed(0)} KB)`,
		);
	}
}

if (failures.length > 0) {
	console.error('FILE-SIZE GUARD FAILED:');
	for (const f of failures) console.error(`  - ${f}`);
	process.exit(1);
}

console.log('File-size guard passed.');
