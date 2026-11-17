import type { Coupon, ShippingZone } from '../domain/types';

export const SAMPLE_SHIPPING_ZONES: ShippingZone[] = [
	{
		id: 'zone-cairo',
		name: 'القاهرة والجيزة',
		fee: 65,
		freeShippingThreshold: null,
		isActive: true,
	},
	{ id: 'zone-alex', name: 'الإسكندرية', fee: 75, freeShippingThreshold: 1200, isActive: true },
	{
		id: 'zone-delta',
		name: 'الدلتا ومدن القناة',
		fee: 85,
		freeShippingThreshold: null,
		isActive: true,
	},
	{ id: 'zone-upper', name: 'صعيد مصر', fee: 100, freeShippingThreshold: null, isActive: true },
];

export const SAMPLE_COUPONS: Coupon[] = [
	{
		id: 'coupon-welcome',
		code: 'WELCOME10',
		type: 'percentage',
		value: 10,
		minSubtotal: 500,
		maxUses: 100,
		usedCount: 0,
		expiresAt: null,
		isActive: true,
	},
];
