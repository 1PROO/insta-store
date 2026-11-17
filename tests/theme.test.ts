import { describe, expect, it } from 'vitest';
import {
	getContrastRatio,
	renderThemeCssVariables,
	resolveThemeTokens,
	THEME_PRESETS,
} from '../src/lib/theme/presets';

describe('theme tokens deep module', () => {
	it('resolves flagship_editorial preset with sharp radius by default', () => {
		const resolved = resolveThemeTokens({
			presetId: 'flagship_editorial',
			radiusPreset: 'sharp',
		});
		expect(resolved.tokens.bgPrimary).toBe(THEME_PRESETS.flagship_editorial.bgPrimary);
		expect(resolved.tokens.radiusCard).toBe('0px');
		expect(resolved.contrastWarning).toBe(false);
	});

	it('applies valid hex overrides and falls back safely on invalid hex', () => {
		const resolved = resolveThemeTokens({
			presetId: 'warm_dune',
			radiusPreset: 'pill',
			customAccent: '#7C2D12',
			customBtnBg: 'not-a-color;background:red',
		});
		expect(resolved.tokens.accentPrimary).toBe('#7C2D12');
		expect(resolved.tokens.btnBg).toBe(THEME_PRESETS.warm_dune.btnBg);
		expect(resolved.tokens.radiusBtn).toBe('999px');
	});

	it('flags low WCAG contrast between button background and button text', () => {
		const ratio = getContrastRatio('#FFFFFF', '#F3F4F6');
		expect(ratio).toBeLessThan(4.5);

		const resolved = resolveThemeTokens({
			presetId: 'minimal_clean',
			customBtnBg: '#FFFFFF',
			customBtnText: '#E5E7EB',
		});
		expect(resolved.contrastWarning).toBe(true);
	});

	it('renders deterministic :root CSS variables string', () => {
		const { tokens } = resolveThemeTokens({ presetId: 'midnight_streetwear' });
		const css = renderThemeCssVariables(tokens);
		expect(css).toContain('--bg-primary:#0B0D10;');
		expect(css).toContain('--text-primary:#F5F7FA;');
	});
});
