import { useState } from 'react';
import type { Collection, Product, ProductVariant } from '../../lib/domain/types';
import { uploadDirectToCloudinary } from '../../lib/media/client-resize';
import VariantRowsEditor from './VariantRowsEditor';

interface Props {
	product: Product | null;
	collections: Collection[];
	onClose: () => void;
	onSaved: () => void;
}

export default function ProductEditorModal({ product, collections, onClose, onSaved }: Props) {
	const [title, setTitle] = useState(product?.title ?? '');
	const [slug, setSlug] = useState(product?.slug ?? '');
	const [description, setDescription] = useState(product?.description ?? '');
	const [fabricCare, setFabricCare] = useState(product?.fabricCare ?? '');
	const [sizeGuide, setSizeGuide] = useState(product?.sizeGuide ?? '');
	const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ''));
	const [compareAtPrice, setCompareAtPrice] = useState(
		product?.compareAtPrice ? String(product.compareAtPrice) : '',
	);
	const [collectionId, setCollectionId] = useState(
		product?.collectionId || collections[0]?.id || '',
	);
	const [imagesText, setImagesText] = useState((product?.images ?? []).join('\n'));
	const [status, setStatus] = useState<'published' | 'hidden'>(product?.status ?? 'published');
	const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? true);
	const [variants, setVariants] = useState<Omit<ProductVariant, 'productId'>[]>(
		product?.variants.length
			? product.variants
			: [
					{
						id: 'new-1',
						size: 'M',
						colorName: 'أسود',
						colorHex: '#111111',
						stock: 5,
						priceOverride: null,
					},
				],
	);
	const [err, setErr] = useState('');
	const [saving, setSaving] = useState(false);

	async function handleImageUpload(file: File | undefined) {
		if (!file) return;
		setErr('');
		const res = await uploadDirectToCloudinary(file, 'image');
		if (!res.ok) {
			setErr(res.error);
			return;
		}
		setImagesText((prev) => (prev.trim() ? `${prev.trim()}\n${res.url}` : res.url));
	}

	async function handleSubmit(e: React.SyntheticEvent) {
		e.preventDefault();
		setErr('');
		setSaving(true);
		const payload = {
			id: product?.id,
			title,
			slug,
			description,
			fabricCare: fabricCare || null,
			sizeGuide: sizeGuide || null,
			basePrice: Number(basePrice || 0),
			compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
			collectionId,
			images: imagesText
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean),
			status,
			isFeatured,
			variants,
		};
		const res = await fetch('/api/admin/products', {
			method: product ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		setSaving(false);
		if (!res.ok || !data.ok) {
			setErr(data.error || 'تعذر حفظ المنتج.');
			return;
		}
		onSaved();
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={product ? 'تعديل منتج' : 'إضافة منتج جديد'}
			className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 flex justify-center items-start"
		>
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 my-4"
			>
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-base">{product ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
					<button type="button" onClick={onClose} className="text-lg font-bold px-2">
						×
					</button>
				</div>

				<input
					required
					placeholder="اسم القطعة"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
				/>
				<div className="grid grid-cols-2 gap-2.5">
					<input
						type="number"
						required
						placeholder="السعر"
						value={basePrice}
						onChange={(e) => setBasePrice(e.target.value)}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
					/>
					<input
						type="number"
						placeholder="السعر قبل الخصم (اختياري)"
						value={compareAtPrice}
						onChange={(e) => setCompareAtPrice(e.target.value)}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
					/>
				</div>
				<div className="grid grid-cols-2 gap-2.5">
					<select
						value={collectionId}
						onChange={(e) => setCollectionId(e.target.value)}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					>
						{collections.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as 'published' | 'hidden')}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					>
						<option value="published">منشور بالمتجر</option>
						<option value="hidden">مخفي (مسودة)</option>
					</select>
				</div>
				<input
					placeholder="الرابط الثابت (يُقفل بعد النشر)"
					value={slug}
					onChange={(e) => setSlug(e.target.value)}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<textarea
					rows={2}
					placeholder="وصف القطعة"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<div className="grid grid-cols-2 gap-2">
					<input
						placeholder="الخامة والعناية (اختياري)"
						value={fabricCare}
						onChange={(e) => setFabricCare(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						placeholder="دليل المقاسات الخاص (اختياري)"
						value={sizeGuide}
						onChange={(e) => setSizeGuide(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
				</div>

				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs">
						<span className="font-bold">روابط الصور (سطر لكل صورة)</span>
						<input
							type="file"
							accept="image/*"
							onChange={(e) => handleImageUpload(e.target.files?.[0])}
							className="text-[11px] max-w-[180px]"
						/>
					</div>
					<textarea
						rows={2}
						dir="ltr"
						placeholder="/samples/linen-shirt.svg"
						value={imagesText}
						onChange={(e) => setImagesText(e.target.value)}
						className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold">المقاسات والألوان والمخزون</span>
						<button
							type="button"
							onClick={() =>
								setVariants([
									...variants,
									{
										id: `new-${Date.now()}`,
										size: 'L',
										colorName: 'أبيض',
										colorHex: '#FFFFFF',
										stock: 5,
										priceOverride: null,
									},
								])
							}
							className="text-xs text-sky-400 font-bold"
						>
							+ إضافة مقاس
						</button>
					</div>
					<VariantRowsEditor variants={variants} onChange={setVariants} />
				</div>

				<label className="flex items-center gap-2 text-xs">
					<input
						type="checkbox"
						checked={isFeatured}
						onChange={(e) => setIsFeatured(e.target.checked)}
					/>
					<span>إظهار في قسم الأساسيات بالصفحة الرئيسية</span>
				</label>

				{err && <p className="text-xs text-rose-400 font-bold">{err}</p>}

				<button
					type="submit"
					disabled={saving}
					className="w-full py-3 rounded-xl bg-sky-500 text-slate-950 font-extrabold text-sm"
				>
					{saving ? 'جاري الحفظ...' : 'حفظ المنتج'}
				</button>
			</form>
		</div>
	);
}
