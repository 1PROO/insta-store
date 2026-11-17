import { useEffect, useState } from 'react';
import {
	CART_EVENT,
	type CartItem,
	readCart,
	removeFromCart,
	updateCartQuantity,
} from '../../lib/commerce/cart-store';

interface CartDrawerProps {
	currency: string;
	lang: 'ar' | 'en';
	emptyText: string;
	continueText: string;
	checkoutText: string;
	cartLabel: string;
}

export default function CartDrawer({
	currency,
	lang,
	emptyText,
	continueText,
	checkoutText,
	cartLabel,
}: CartDrawerProps) {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		const sync = () => setItems(readCart());
		sync();

		const onOpen = () => {
			sync();
			setOpen(true);
		};
		window.addEventListener(CART_EVENT, sync);
		window.addEventListener('insta-store:open-cart', onOpen);
		return () => {
			window.removeEventListener(CART_EVENT, sync);
			window.removeEventListener('insta-store:open-cart', onOpen);
		};
	}, []);

	useEffect(() => {
		const badge = document.getElementById('headerCartCount');
		if (badge) {
			const total = items.reduce((acc, item) => acc + item.quantity, 0);
			badge.textContent = `(${total})`;
		}
	}, [items]);

	if (!open) return null;

	const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
			<button
				type="button"
				aria-label="Close Cart"
				className="flex-1 cursor-default"
				onClick={() => setOpen(false)}
			/>
			<aside
				dir={lang === 'en' ? 'ltr' : 'rtl'}
				className="w-full max-w-sm h-full flex flex-col shadow-2xl"
				style={{
					backgroundColor: 'var(--bg-surface)',
					color: 'var(--text-primary)',
				}}
			>
				<div
					className="px-4 h-14 flex items-center justify-between border-b"
					style={{ borderColor: 'var(--border-subtle)' }}
				>
					<h2 className="font-bold text-base">
						{cartLabel} ({items.reduce((a, b) => a + b.quantity, 0)})
					</h2>
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="w-9 h-9 inline-flex items-center justify-center rounded-md text-lg font-bold"
					>
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{items.length === 0 ? (
						<div className="py-16 text-center space-y-4">
							<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
								{emptyText}
							</p>
							<a
								href="/shop"
								onClick={() => setOpen(false)}
								className="inline-block px-5 py-2.5 text-xs font-bold store-btn-primary"
							>
								{continueText}
							</a>
						</div>
					) : (
						items.map((item) => (
							<div
								key={item.variantId}
								className="flex gap-3 p-2.5 border"
								style={{
									borderColor: 'var(--border-subtle)',
									borderRadius: 'var(--radius-card)',
								}}
							>
								<img
									src={item.imageUrl}
									alt={item.productTitle}
									className="w-16 h-20 object-cover shrink-0"
									style={{ borderRadius: 'var(--radius-btn)' }}
								/>
								<div className="flex-1 min-w-0">
									<a
										href={`/p/${item.productSlug}`}
										className="text-sm font-semibold line-clamp-1 hover:underline"
									>
										{item.productTitle}
									</a>
									<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
										{item.size} / {item.colorName}
									</p>
									<div className="mt-2 flex items-center justify-between gap-2">
										<div
											className="inline-flex items-center border"
											style={{ borderColor: 'var(--border-subtle)' }}
										>
											<button
												type="button"
												className="w-7 h-7 text-sm font-bold"
												onClick={() =>
													setItems(updateCartQuantity(item.variantId, item.quantity - 1))
												}
											>
												−
											</button>
											<span className="px-2.5 text-xs font-bold">{item.quantity}</span>
											<button
												type="button"
												className="w-7 h-7 text-sm font-bold"
												onClick={() =>
													setItems(updateCartQuantity(item.variantId, item.quantity + 1))
												}
											>
												+
											</button>
										</div>
										<span className="text-xs font-bold">
											{(item.unitPrice * item.quantity).toLocaleString('en-US')} {currency}
										</span>
									</div>
								</div>
								<button
									type="button"
									aria-label="Remove"
									onClick={() => setItems(removeFromCart(item.variantId))}
									className="text-xs self-start px-1.5 py-0.5 opacity-60 hover:opacity-100"
								>
									×
								</button>
							</div>
						))
					)}
				</div>

				{items.length > 0 && (
					<div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
						<div className="flex items-center justify-between text-sm font-bold">
							<span>{lang === 'en' ? 'Subtotal' : 'المجموع الفرعي'}</span>
							<span>
								{subtotal.toLocaleString('en-US')} {currency}
							</span>
						</div>
						<a
							href="/checkout"
							className="block w-full text-center py-3 text-sm font-bold store-btn-primary"
						>
							{checkoutText}
						</a>
					</div>
				)}
			</aside>
		</div>
	);
}
