export interface CartItem {
	productId: string;
	productSlug: string;
	productTitle: string;
	variantId: string;
	size: string;
	colorName: string;
	colorHex: string;
	unitPrice: number;
	imageUrl: string;
	quantity: number;
	maxStock: number;
}

const STORAGE_KEY = 'insta_store_cart_v1';
export const CART_EVENT = 'insta-store:cart-changed';

export function readCart(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeCart(items: CartItem[]): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
}

export function addToCart(next: CartItem): CartItem[] {
	const items = readCart();
	const existing = items.find((i) => i.variantId === next.variantId);
	if (existing) {
		existing.quantity = Math.min(next.maxStock, 10, existing.quantity + next.quantity);
	} else {
		items.push({ ...next, quantity: Math.min(next.maxStock, 10, Math.max(1, next.quantity)) });
	}
	writeCart(items);
	return items;
}

export function updateCartQuantity(variantId: string, quantity: number): CartItem[] {
	const items = readCart()
		.map((item) => {
			if (item.variantId !== variantId) return item;
			return { ...item, quantity: Math.min(item.maxStock, 10, quantity) };
		})
		.filter((item) => item.quantity > 0);
	writeCart(items);
	return items;
}

export function removeFromCart(variantId: string): CartItem[] {
	const items = readCart().filter((i) => i.variantId !== variantId);
	writeCart(items);
	return items;
}

export function clearCart(): void {
	writeCart([]);
}
