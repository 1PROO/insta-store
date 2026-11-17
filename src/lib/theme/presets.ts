import type { RadiusPreset, ThemePresetId, ThemeTokens } from '../domain/types';

type PaletteSeed = Omit<ThemeTokens, 'radiusCard' | 'radiusBtn' | 'radiusPill'>;

export const THEME_PRESETS: Record<ThemePresetId, PaletteSeed> = {
	flagship_editorial: {
		bgPrimary: '#FAF9F6',
		bgSurface: '#FFFFFF',
		textPrimary: '#111111',
		textMuted: '#5C5A55',
		accentPrimary: '#111111',
		btnBg: '#111111',
		btnText: '#FFFFFF',
		borderSubtle: '#E6E2DA',
	},
	warm_dune: {
		bgPrimary: '#F6F1EB',
		bgSurface: '#FFFDF9',
		textPrimary: '#241E1A',
		textMuted: '#6D625B',
		accentPrimary: '#8C5A3C',
		btnBg: '#8C5A3C',
		btnText: '#FFFFFF',
		borderSubtle: '#E5DDD3',
	},
	minimal_clean: {
		bgPrimary: '#FFFFFF',
		bgSurface: '#F5F5F7',
		textPrimary: '#0F172A',
		textMuted: '#64748B',
		accentPrimary: '#0F172A',
		btnBg: '#0F172A',
		btnText: '#FFFFFF',
		borderSubtle: '#E2E8F0',
	},
	midnight_streetwear: {
		bgPrimary: '#0B0D10',
		bgSurface: '#151921',
		textPrimary: '#F5F7FA',
		textMuted: '#9CA3AF',
		accentPrimary: '#E5E7EB',
		btnBg: '#F5F7FA',
		btnText: '#0B0D10',
		borderSubtle: '#262C38',
	},
};

const RADIUS_MAP: Record<RadiusPreset, { card: string; btn: string; pill: string }> = {
	sharp: { card: '0px', btn: '2px', pill: '999px' },
	soft: { card: '10px', btn: '8px', pill: '999px' },
	pill: { card: '16px', btn: '999px', pill: '999px' },
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function sanitizeHex(value: string | null | undefined, fallback: string): string {
	if (!value) return fallback;
	const trimmed = value.trim();
	return HEX_COLOR_RE.test(trimmed) ? trimmed.toUpperCase() : fallback;
}

function channelLuminance(byte: number): number {
	const s = byte / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
	const clean = hex.slice(1);
	const r = Number.parseInt(clean.slice(0, 2), 16);
	const g = Number.parseInt(clean.slice(2, 4), 16);
	const b = Number.parseInt(clean.slice(4, 6), 16);
	return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Calculates WCAG 2.1 contrast ratio between two 6-digit hex colors. */
export function getContrastRatio(hexA: string, hexB: string): number {
	const a = sanitizeHex(hexA, '#000000');
	const b = sanitizeHex(hexB, '#FFFFFF');
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const bright = Math.max(l1, l2);
	const dark = Math.min(l1, l2);
	return (bright + 0.05) / (dark + 0.05);
}

export interface ResolveThemeInput {
	presetId?: ThemePresetId | string | null;
	radiusPreset?: RadiusPreset | string | null;
	customAccent?: string | null;
	customBtnBg?: string | null;
	customBtnText?: string | null;
}

export function resolveThemeTokens(input: ResolveThemeInput): {
	tokens: ThemeTokens;
	contrastWarning: boolean;
} {
	const presetKey: ThemePresetId =
		input.presetId && input.presetId in THEME_PRESETS
			? (input.presetId as ThemePresetId)
			: 'flagship_editorial';
	const radiusKey: RadiusPreset =
		input.radiusPreset && input.radiusPreset in RADIUS_MAP
			? (input.radiusPreset as RadiusPreset)
			: 'sharp';

	const base = THEME_PRESETS[presetKey];
	const radii = RADIUS_MAP[radiusKey];
	const tokens: ThemeTokens = {
		...base,
		accentPrimary: sanitizeHex(input.customAccent, base.accentPrimary),
		btnBg: sanitizeHex(input.customBtnBg, base.btnBg),
		btnText: sanitizeHex(input.customBtnText, base.btnText),
		radiusCard: radii.card,
		radiusBtn: radii.btn,
		radiusPill: radii.pill,
	};

	const btnRatio = getContrastRatio(tokens.btnBg, tokens.btnText);
	return {
		tokens,
		contrastWarning: btnRatio < 4.5,
	};
}

export function renderThemeCssVariables(tokens: ThemeTokens): string {
	return [
		':root{',
		`--bg-primary:${tokens.bgPrimary};`,
		`--bg-surface:${tokens.bgSurface};`,
		`--text-primary:${tokens.textPrimary};`,
		`--text-muted:${tokens.textMuted};`,
		`--accent-primary:${tokens.accentPrimary};`,
		`--btn-bg:${tokens.btnBg};`,
		`--btn-text:${tokens.btnText};`,
		`--border-subtle:${tokens.borderSubtle};`,
		`--radius-card:${tokens.radiusCard};`,
		`--radius-btn:${tokens.radiusBtn};`,
		`--radius-pill:${tokens.radiusPill};`,
		'}',
	].join('');
}
