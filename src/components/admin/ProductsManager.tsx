import { useState } from 'react';
import type { Collection, Product } from '../../lib/domain/types';
import ProductEditorModal from './ProductEditorModal';

interface Props {
	initialProducts: Product[];
	initialTrash: Product[];
	collections: Collection[];
	currency: string;
}

export default function ProductsManager({
	initialProducts,
	initialTrash,
	collections,
	currency,
}: Props) {
	const [products, setProducts] = useState<Product[]>(initialProducts);
	const [trash, setTrash] = useState<Product[]>(initialTrash);
	const [viewTrash, setViewTrash] = useState(false);
	const [editing, setEditing] = useState<Product | null | 'new'>(null);

	async function reload() {
		const [pRes, tRes] = await Promise.all([
			fetch('/api/admin/products'),
			fetch('/api/admin/products?trash=1'),
		]);
		const pData = (await pRes.json()) as { products?: Product[] };
		const tData = (await tRes.json()) as { products?: Product[] };
		setProducts(pData.products ?? []);
		setTrash(tData.products ?? []);
	}

	async function patchAction(id: string, action: 'trash' | 'restore' | 'publish' | 'hide') {
		await fetch('/api/admin/products', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, action }),
		});
		await reload();
	}

	async function purgeProduct(id: string) {
		await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		await reload();
	}

	const list = viewTrash ? trash : products;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex gap-2 text-xs font-bold">
					<button
						type="button"
						onClick={() => setViewTrash(false)}
						className={`px-3.5 py-2 rounded-full border ${
							!viewTrash
								? 'bg-sky-500 text-slate-950 border-sky-500'
								: 'bg-slate-900 border-slate-800 text-slate-300'
						}`}
					>
						المنتجات ({products.length})
					</button>
					<button
						type="button"
						onClick={() => setViewTrash(true)}
						className={`px-3.5 py-2 rounded-full border ${
							viewTrash
								? 'bg-amber-500 text-slate-950 border-amber-500'
								: 'bg-slate-900 border-slate-800 text-slate-300'
						}`}
					>
						سلة المحذوفات ({trash.length})
					</button>
				</div>

				<button
					type="button"
					onClick={() => setEditing('new')}
					className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-extrabold"
				>
					+ إضافة منتج
				</button>
			</div>

			{list.length === 0 ? (
				<div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
					{viewTrash ? 'سلة المحذوفات فارغة.' : 'لا توجد منتجات بعد. أضف أول قطعة الآن.'}
				</div>
			) : (
				<div className="grid gap-3">
					{list.map((p) => {
						const stockSum = p.variants.reduce((a, b) => a + b.stock, 0);
						return (
							<article
								key={p.id}
								className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 flex gap-3 items-center"
							>
								<img
									src={p.images[0] || '/samples/hero-poster.svg'}
									alt={p.title}
									className="w-16 h-20 rounded-xl object-cover shrink-0 bg-slate-950"
								/>
								<div className="flex-1 min-w-0 space-y-1">
									<h2 className="font-bold text-sm truncate">{p.title}</h2>
									<p className="text-xs text-slate-400">
										{p.basePrice} {currency} · المخزون: {stockSum} ·{' '}
										{p.status === 'published' ? 'منشور' : 'مخفي'}
									</p>
									<div className="flex flex-wrap gap-2 pt-1">
										{!viewTrash ? (
											<>
												<button
													type="button"
													onClick={() => setEditing(p)}
													className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold"
												>
													تعديل
												</button>
												<button
													type="button"
													onClick={() =>
														patchAction(p.id, p.status === 'published' ? 'hide' : 'publish')
													}
													className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold"
												>
													{p.status === 'published' ? 'إخفاء' : 'نشر'}
												</button>
												<button
													type="button"
													onClick={() => patchAction(p.id, 'trash')}
													className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 text-xs font-bold"
												>
													نقل للسلة
												</button>
											</>
										) : (
											<>
												<button
													type="button"
													onClick={() => patchAction(p.id, 'restore')}
													className="px-2.5 py-1 rounded-lg bg-emerald-700 text-xs font-bold"
												>
													استرجاع
												</button>
												<button
													type="button"
													onClick={() => purgeProduct(p.id)}
													className="px-2.5 py-1 rounded-lg bg-rose-700 text-xs font-bold"
												>
													حذف نهائي
												</button>
											</>
										)}
									</div>
								</div>
							</article>
						);
					})}
				</div>
			)}

			{editing && (
				<ProductEditorModal
					product={editing === 'new' ? null : editing}
					collections={collections}
					onClose={() => setEditing(null)}
					onSaved={async () => {
						setEditing(null);
						await reload();
					}}
				/>
			)}
		</div>
	);
}
