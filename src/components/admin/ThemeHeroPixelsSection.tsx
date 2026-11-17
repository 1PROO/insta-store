import { useState } from 'react';
import type { StoreConfig } from '../../lib/domain/types';

interface Props {
	cfg: StoreConfig;
	sectionsJson: string;
	onCfgChange: (next: StoreConfig) => void;
	onSectionsJsonChange: (next: string) => void;
	onUpload: (file: File | undefined, target: 'poster' | 'video') => void;
}

export default function ThemeHeroPixelsSection({
	cfg,
	sectionsJson,
	onCfgChange,
	onSectionsJsonChange,
	onUpload,
}: Props) {
	const [showAdvancedSections, setShowAdvancedSections] = useState(false);

	return (
		<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
			<h2 className="font-bold text-base">3. فيديو الهيرو، الإعلان، والبيكسلز</h2>
			<input
				placeholder="نص شريط الإعلان العلوي (اتركه فارغاً لإخفائه)"
				value={cfg.announcementText || ''}
				onChange={(e) => onCfgChange({ ...cfg, announcementText: e.target.value })}
				className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
			/>
			<input
				placeholder="عنوان الهيرو الرئيسي"
				value={cfg.heroTitle}
				onChange={(e) => onCfgChange({ ...cfg, heroTitle: e.target.value })}
				className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
			/>
			<div className="grid sm:grid-cols-2 gap-3">
				<div>
					<label className="block text-xs text-slate-300 mb-1" htmlFor="heroVideoUrl">
						رابط فيديو الهيرو المباشر (.mp4) أو ارفع فيديو (&lt;= 5MB)
					</label>
					<input
						id="heroVideoUrl"
						placeholder="https://.../hero.mp4"
						value={cfg.heroVideoUrl || ''}
						onChange={(e) => onCfgChange({ ...cfg, heroVideoUrl: e.target.value })}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-2"
					/>
					<input
						type="file"
						accept="video/mp4,video/webm"
						onChange={(e) => onUpload(e.target.files?.[0], 'video')}
						className="text-xs text-slate-400"
					/>
				</div>
				<div>
					<label className="block text-xs text-slate-300 mb-1" htmlFor="heroPosterUrl">
						صورة غلاف الهيرو (Poster)
					</label>
					<input
						id="heroPosterUrl"
						value={cfg.heroPosterUrl}
						onChange={(e) => onCfgChange({ ...cfg, heroPosterUrl: e.target.value })}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-2"
					/>
					<input
						type="file"
						accept="image/*"
						onChange={(e) => onUpload(e.target.files?.[0], 'poster')}
						className="text-xs text-slate-400"
					/>
				</div>
			</div>
			<div className="grid sm:grid-cols-2 gap-3">
				<input
					placeholder="Meta Pixel ID (اختياري)"
					value={cfg.metaPixelId || ''}
					onChange={(e) => onCfgChange({ ...cfg, metaPixelId: e.target.value })}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<input
					placeholder="TikTok Pixel ID (اختياري)"
					value={cfg.tiktokPixelId || ''}
					onChange={(e) => onCfgChange({ ...cfg, tiktokPixelId: e.target.value })}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
			</div>
			<div className="grid sm:grid-cols-3 gap-3">
				<input
					placeholder="رابط اللوجو (أو اتركه فارغاً لاسم المتجر)"
					value={cfg.logoUrl || ''}
					onChange={(e) => onCfgChange({ ...cfg, logoUrl: e.target.value })}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<input
					placeholder="رابط حساب الإنستجرام"
					value={cfg.instagramUrl || ''}
					onChange={(e) => onCfgChange({ ...cfg, instagramUrl: e.target.value })}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<input
					type="number"
					placeholder="حد الشحن المجاني (مثال: 1500)"
					value={cfg.globalFreeShippingThreshold ?? ''}
					onChange={(e) =>
						onCfgChange({
							...cfg,
							globalFreeShippingThreshold: e.target.value ? Number(e.target.value) : null,
						})
					}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
			</div>
			<textarea
				rows={2}
				placeholder="دليل المقاسات الافتراضي للمتجر"
				value={cfg.defaultSizeGuide || ''}
				onChange={(e) => onCfgChange({ ...cfg, defaultSizeGuide: e.target.value })}
				className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
			/>

			<button
				type="button"
				onClick={() => setShowAdvancedSections((v) => !v)}
				className="text-xs text-sky-400 underline"
			>
				{showAdvancedSections
					? 'إخفاء تعديل أقسام Impulse المتقدمة'
					: 'تعديل أقسام الصفحة الرئيسية المتقدمة (Promo / Lookbook)'}
			</button>
			{showAdvancedSections && (
				<textarea
					rows={8}
					dir="ltr"
					value={sectionsJson}
					onChange={(e) => onSectionsJsonChange(e.target.value)}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
				/>
			)}
		</section>
	);
}
