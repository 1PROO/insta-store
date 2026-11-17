import type { ProductVariant } from '../../lib/domain/types';

export type VariantDraft = Omit<ProductVariant, 'productId'>;

interface Props {
	variants: VariantDraft[];
	onChange: (next: VariantDraft[]) => void;
}

export default function VariantRowsEditor({ variants, onChange }: Props) {
	function patch(idx: number, update: Partial<VariantDraft>) {
		onChange(variants.map((item, i) => (i === idx ? { ...item, ...update } : item)));
	}

	return (
		<>
			{variants.map((v, idx) => (
				<div key={v.id} className="grid grid-cols-12 gap-1.5 items-center">
					<input
						value={v.size}
						onChange={(e) => patch(idx, { size: e.target.value })}
						placeholder="M"
						className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						value={v.colorName}
						onChange={(e) => patch(idx, { colorName: e.target.value })}
						placeholder="اللون"
						className="col-span-3 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						type="color"
						value={v.colorHex}
						onChange={(e) => patch(idx, { colorHex: e.target.value })}
						className="col-span-2 h-8 rounded-lg bg-slate-950 border border-slate-800"
					/>
					<input
						type="number"
						value={v.stock}
						placeholder="مخزون"
						onChange={(e) => patch(idx, { stock: Number(e.target.value) })}
						className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						type="number"
						value={v.priceOverride ?? ''}
						placeholder="سعر"
						onChange={(e) =>
							patch(idx, { priceOverride: e.target.value ? Number(e.target.value) : null })
						}
						className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
					/>
					<button
						type="button"
						onClick={() => onChange(variants.filter((_, i) => i !== idx))}
						aria-label="حذف المقاس"
						className="col-span-1 text-rose-400 font-bold text-sm"
					>
						×
					</button>
				</div>
			))}
		</>
	);
}
