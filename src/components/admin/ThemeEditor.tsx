import { useState } from 'react';
import type {
	HomepageSections,
	RadiusPreset,
	StoreConfig,
	ThemePresetId,
} from '../../lib/domain/types';
import { uploadDirectToCloudinary } from '../../lib/media/client-resize';
import { getContrastRatio, THEME_PRESETS } from '../../lib/theme/presets';
import ThemeHeroPixelsSection from './ThemeHeroPixelsSection';

interface Props {
	initialConfig: StoreConfig;
	initialSections: HomepageSections;
}

const PRESETS: Array<{ id: ThemePresetId; label: string }> = [
	{ id: 'flagship_editorial', label: 'Flagship Editorial' },
	{ id: 'warm_dune', label: 'Warm Dune' },
	{ id: 'minimal_clean', label: 'Minimal Clean' },
	{ id: 'midnight_streetwear', label: 'Midnight Streetwear' },
];

export default function ThemeEditor({ initialConfig, initialSections }: Props) {
	const [cfg, setCfg] = useState<StoreConfig>(initialConfig);
	const [sectionsJson, setSectionsJson] = useState(() => JSON.stringify(initialSections, null, 2));
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState('');
	const [err, setErr] = useState('');

	const activePalette = THEME_PRESETS[cfg.presetId] ?? THEME_PRESETS.flagship_editorial;
	const btnBg = cfg.customBtnBg || activePalette.btnBg;
	const btnText = cfg.customBtnText || activePalette.btnText;
	const contrast = getContrastRatio(btnBg, btnText);

	async function handleUpload(file: File | undefined, target: 'logo' | 'poster' | 'video') {
		if (!file) return;
		setErr('');
		setMsg('جاري الرفع...');
		const res = await uploadDirectToCloudinary(file, target === 'video' ? 'video' : 'image');
		if (!res.ok) {
			setMsg('');
			setErr(res.error);
			return;
		}
		if (target === 'logo') setCfg({ ...cfg, logoUrl: res.url });
		if (target === 'poster') setCfg({ ...cfg, heroPosterUrl: res.url });
		if (target === 'video') setCfg({ ...cfg, heroVideoUrl: res.url });
		setMsg('تم رفع الملف بنجاح ✓ — اضغط حفظ لتطبيق التعديل.');
	}

	async function handleSave(e: React.SyntheticEvent) {
		e.preventDefault();
		setErr('');
		setMsg('');
		let parsedSections: HomepageSections | undefined;
		try {
			parsedSections = JSON.parse(sectionsJson) as HomepageSections;
		} catch {
			setErr('صيغة JSON للأقسام المتقدمة غير صالحة.');
			return;
		}

		setSaving(true);
		const res = await fetch('/api/admin/theme', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ config: cfg, sections: parsedSections }),
		});
		const data = (await res.json()) as { ok: boolean; error?: string; contrastWarning?: boolean };
		setSaving(false);
		if (!res.ok || !data.ok) {
			setErr(data.error || 'تعذر الحفظ.');
			return;
		}
		setMsg(
			data.contrastWarning
				? 'تم الحفظ ✓ (تنبيه: تباين لون الزر مع النص ضعيف، يفضل تغييره).'
				: 'تم حفظ إعدادات الهوية وتحديث المتجر ✓',
		);
	}

	return (
		<form onSubmit={handleSave} className="space-y-5">
			<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
				<h2 className="font-bold text-base">1. الهوية الأساسية واللغة</h2>
				<div className="grid sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs text-slate-300 mb-1" htmlFor="storeName">
							اسم المتجر
						</label>
						<input
							id="storeName"
							value={cfg.storeName}
							onChange={(e) => setCfg({ ...cfg, storeName: e.target.value })}
							className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
						/>
					</div>
					<div>
						<label className="block text-xs text-slate-300 mb-1" htmlFor="currency">
							العملة
						</label>
						<input
							id="currency"
							value={cfg.currency}
							onChange={(e) => setCfg({ ...cfg, currency: e.target.value })}
							className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
						/>
					</div>
					<div className="sm:col-span-2">
						<label className="block text-xs text-slate-300 mb-1" htmlFor="tagline">
							وصف المتجر
						</label>
						<input
							id="tagline"
							value={cfg.tagline}
							onChange={(e) => setCfg({ ...cfg, tagline: e.target.value })}
							className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
						/>
					</div>
					<div>
						<label className="block text-xs text-slate-300 mb-1" htmlFor="langMode">
							وضع اللغة
						</label>
						<select
							id="langMode"
							value={cfg.languageMode}
							onChange={(e) =>
								setCfg({ ...cfg, languageMode: e.target.value as StoreConfig['languageMode'] })
							}
							className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
						>
							<option value="both">عربي + إنجليزي (مع زر تبديل)</option>
							<option value="ar">عربي فقط</option>
							<option value="en">إنجليزي فقط</option>
						</select>
					</div>
					<div>
						<label className="block text-xs text-slate-300 mb-1" htmlFor="whatsapp">
							رقم الواتساب
						</label>
						<input
							id="whatsapp"
							placeholder="01012345678"
							value={cfg.whatsappNumber || ''}
							onChange={(e) => setCfg({ ...cfg, whatsappNumber: e.target.value })}
							className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
						/>
					</div>
				</div>
			</section>

			<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
				<h2 className="font-bold text-base">2. الألوان والزوايا (الباليتات الـ 4)</h2>
				<div className="grid grid-cols-2 gap-2.5">
					{PRESETS.map((p) => {
						const pal = THEME_PRESETS[p.id];
						const active = cfg.presetId === p.id;
						return (
							<button
								key={p.id}
								type="button"
								onClick={() =>
									setCfg({
										...cfg,
										presetId: p.id,
										customAccent: null,
										customBtnBg: null,
										customBtnText: null,
									})
								}
								className={`p-3 rounded-xl border text-start ${
									active ? 'border-sky-400 bg-slate-800' : 'border-slate-800 bg-slate-950'
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<span
										className="w-4 h-4 rounded-full border border-white/20"
										style={{ backgroundColor: pal.bgPrimary }}
									/>
									<span
										className="w-4 h-4 rounded-full border border-white/20"
										style={{ backgroundColor: pal.btnBg }}
									/>
								</div>
								<span className="text-xs font-bold">{p.label}</span>
							</button>
						);
					})}
				</div>

				<div className="grid grid-cols-3 gap-3 items-end">
					<div>
						<label className="block text-[11px] text-slate-300 mb-1" htmlFor="btnBg">
							لون الزر
						</label>
						<input
							id="btnBg"
							type="color"
							value={btnBg}
							onChange={(e) => setCfg({ ...cfg, customBtnBg: e.target.value })}
							className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800"
						/>
					</div>
					<div>
						<label className="block text-[11px] text-slate-300 mb-1" htmlFor="btnText">
							لون نص الزر
						</label>
						<input
							id="btnText"
							type="color"
							value={btnText}
							onChange={(e) => setCfg({ ...cfg, customBtnText: e.target.value })}
							className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800"
						/>
					</div>
					<div>
						<label className="block text-[11px] text-slate-300 mb-1" htmlFor="radius">
							الزوايا
						</label>
						<select
							id="radius"
							value={cfg.radiusPreset}
							onChange={(e) => setCfg({ ...cfg, radiusPreset: e.target.value as RadiusPreset })}
							className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
						>
							<option value="sharp">حادة (Editorial)</option>
							<option value="soft">ناعمة (Soft)</option>
							<option value="pill">دائرية (Pill)</option>
						</select>
					</div>
				</div>
				<p
					className={`text-xs ${contrast < 4.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}
				>
					تباين الزر الحالي: {contrast.toFixed(1)}:1{' '}
					{contrast < 4.5 ? '(ضعيف — يفضل تعديله)' : '(ممتاز ✓)'}
				</p>
			</section>

			<ThemeHeroPixelsSection
				cfg={cfg}
				sectionsJson={sectionsJson}
				onCfgChange={setCfg}
				onSectionsJsonChange={setSectionsJson}
				onUpload={(f, t) => handleUpload(f, t)}
			/>

			{err && <p className="text-xs font-bold text-rose-400">{err}</p>}
			{msg && <p className="text-xs font-bold text-emerald-400">{msg}</p>}

			<button
				type="submit"
				disabled={saving}
				className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-extrabold text-sm"
			>
				{saving ? 'جاري الحفظ...' : 'حفظ الهوية وتطبيقها على المتجر'}
			</button>
		</form>
	);
}
