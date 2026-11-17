import { useState } from 'react';
import { addToCart } from '../../lib/commerce/cart-store';
import type { Product, ProductVariant } from '../../lib/domain/types';
import SizeGuideModal from './SizeGuideModal';

interface Props {
	product: Product;
	currency: string;
	lang: 'ar' | 'en';
	effectiveSizeGuide: string | null;
	whatsappNumber: string | null;
	labels: {
		size: string;
		color: string;
		sizeGuide: string;
		addToCart: string;
		soldOut: string;
		description: string;
		fabricCare: string;
		shippingInfo: string;
		readMore: string;
		readLess: string;
		askWhatsapp: string;
	};
}

export default function ProductConfigurator({
	product,
	currency,
	lang,
	effectiveSizeGuide,
	whatsappNumber,
	labels,
}: Props) {
	const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
	const [selectedId, setSelectedId] = useState<string>(firstAvailable?.id ?? '');
	const [activeImage, setActiveImage] = useState<number>(0);
	const [showFullDesc, setShowFullDesc] = useState(false);
	const [showGuide, setShowGuide] = useState(false);

	const selectedVariant: ProductVariant | undefined =
		product.variants.find((v) => v.id === selectedId) ?? firstAvailable;

	const currentPrice = selectedVariant?.priceOverride ?? product.basePrice;
	const hasSale = product.compareAtPrice !== null && product.compareAtPrice > currentPrice;
	const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
	const needsTruncate = product.description.length > 180;
	const displayDesc =
		needsTruncate && !showFullDesc
			? `${product.description.slice(0, 180).trimEnd()}...`
			: product.description;

	const whatsappLink = whatsappNumber
		? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
				`${lang === 'en' ? 'Hi, I have a question about:' : 'أهلاً، عندي استفسار بخصوص:'} ${product.title} (${selectedVariant?.size ?? ''})`,
			)}`
		: null;

	function handleAdd() {
		if (!selectedVariant || selectedVariant.stock <= 0) return;
		addToCart({
			productId: product.id,
			productSlug: product.slug,
			productTitle: product.title,
			variantId: selectedVariant.id,
			size: selectedVariant.size,
			colorName: selectedVariant.colorName,
			colorHex: selectedVariant.colorHex,
			unitPrice: currentPrice,
			imageUrl: product.images[0] ?? '/samples/hero-poster.svg',
			quantity: 1,
			maxStock: selectedVariant.stock,
		});
		window.dispatchEvent(new CustomEvent('insta-store:open-cart'));
	}

	return (
		<div className="grid md:grid-cols-2 gap-6 sm:gap-10 pb-20 md:pb-8">
			<div className="space-y-3">
				<div className="overflow-hidden store-card aspect-[3/4]">
					<img
						src={product.images[activeImage] ?? product.images[0] ?? '/samples/hero-poster.svg'}
						alt={product.title}
						className="w-full h-full object-cover"
					/>
				</div>
				{product.images.length > 1 && (
					<div className="flex gap-2.5 overflow-x-auto pb-1">
						{product.images.map((img, idx) => (
							<button
								key={img}
								type="button"
								aria-label={`${product.title} ${idx + 1}`}
								onClick={() => setActiveImage(idx)}
								className={`w-16 h-20 overflow-hidden shrink-0 border-2 ${
									activeImage === idx ? 'opacity-100' : 'opacity-60'
								}`}
								style={{
									borderColor:
										activeImage === idx ? 'var(--accent-primary)' : 'var(--border-subtle)',
									borderRadius: 'var(--radius-btn)',
								}}
							>
								<img
									src={img}
									alt={`${product.title} ${idx + 1}`}
									className="w-full h-full object-cover"
								/>
							</button>
						))}
					</div>
				)}
			</div>

			<div className="space-y-6">
				<div>
					<h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
						{product.title}
					</h1>
					<div className="flex items-center gap-3 text-lg">
						<span className="font-extrabold">
							{currentPrice.toLocaleString('en-US')} {currency}
						</span>
						{hasSale && product.compareAtPrice && (
							<span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
								{product.compareAtPrice.toLocaleString('en-US')} {currency}
							</span>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs font-bold">
						<span>
							{labels.size} / {labels.color}:{' '}
							{selectedVariant ? `${selectedVariant.size} — ${selectedVariant.colorName}` : ''}
						</span>
						{effectiveSizeGuide && (
							<button
								type="button"
								onClick={() => setShowGuide(true)}
								className="underline underline-offset-4"
								style={{ color: 'var(--text-muted)' }}
							>
								{labels.sizeGuide}
							</button>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						{product.variants.map((v) => {
							const active = v.id === selectedVariant?.id;
							const soldOut = v.stock <= 0;
							return (
								<button
									key={v.id}
									type="button"
									aria-pressed={active}
									disabled={soldOut}
									onClick={() => setSelectedId(v.id)}
									className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold border transition ${
										soldOut ? 'opacity-40 line-through cursor-not-allowed' : ''
									}`}
									style={{
										borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
										backgroundColor: active ? 'var(--btn-bg)' : 'var(--bg-surface)',
										color: active ? 'var(--btn-text)' : 'var(--text-primary)',
										borderRadius: 'var(--radius-btn)',
									}}
								>
									<span
										className="w-3 h-3 rounded-full border"
										style={{ backgroundColor: v.colorHex, borderColor: 'var(--border-subtle)' }}
									/>
									<span>
										{v.size} · {v.colorName}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className="hidden md:flex flex-col gap-3">
					<button
						type="button"
						disabled={isOutOfStock}
						onClick={handleAdd}
						className="w-full py-3.5 text-sm font-bold store-btn-primary disabled:opacity-45 disabled:cursor-not-allowed"
					>
						{isOutOfStock ? labels.soldOut : labels.addToCart}
					</button>
					{whatsappLink && (
						<a
							href={whatsappLink}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full text-center py-3 text-sm font-semibold store-btn-outline"
						>
							{labels.askWhatsapp}
						</a>
					)}
				</div>

				<div className="border-t divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
					<details open className="py-3.5">
						<summary className="cursor-pointer font-bold text-sm">{labels.description}</summary>
						<p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
							{displayDesc}
						</p>
						{needsTruncate && (
							<button
								type="button"
								onClick={() => setShowFullDesc((v) => !v)}
								className="mt-1.5 text-xs font-bold underline underline-offset-4"
							>
								{showFullDesc ? labels.readLess : labels.readMore}
							</button>
						)}
					</details>

					{product.fabricCare && (
						<details className="py-3.5">
							<summary className="cursor-pointer font-bold text-sm">{labels.fabricCare}</summary>
							<p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
								{product.fabricCare}
							</p>
						</details>
					)}

					<details className="py-3.5">
						<summary className="cursor-pointer font-bold text-sm">{labels.shippingInfo}</summary>
						<p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
							{lang === 'en'
								? 'Cash on delivery across governorates within 2–4 business days.'
								: 'الدفع عند الاستلام لجميع المحافظات خلال 2 إلى 4 أيام عمل.'}
						</p>
					</details>
				</div>
			</div>

			<div
				className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t px-4 py-3 flex items-center gap-2.5"
				style={{
					backgroundColor: 'var(--bg-surface)',
					borderColor: 'var(--border-subtle)',
				}}
			>
				<button
					type="button"
					disabled={isOutOfStock}
					onClick={handleAdd}
					className="flex-1 py-3 text-sm font-bold store-btn-primary disabled:opacity-45"
				>
					{isOutOfStock
						? labels.soldOut
						: `${labels.addToCart} · ${currentPrice.toLocaleString('en-US')} ${currency}`}
				</button>
				{whatsappLink && (
					<a
						href={whatsappLink}
						target="_blank"
						rel="noopener noreferrer"
						className="px-3.5 py-3 text-xs font-bold store-btn-outline shrink-0"
					>
						WhatsApp
					</a>
				)}
			</div>

			<SizeGuideModal
				open={showGuide}
				title={labels.sizeGuide}
				content={effectiveSizeGuide}
				onClose={() => setShowGuide(false)}
			/>
		</div>
	);
}
