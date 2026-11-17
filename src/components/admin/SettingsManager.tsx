import { useState } from 'react';
import type { Collection, Coupon, ShippingZone } from '../../lib/domain/types';
import SettingsPasswordCard from './SettingsPasswordCard';

interface Props {
	initialCollections: Collection[];
	initialZones: ShippingZone[];
	initialCoupons: Coupon[];
}

export default function SettingsManager({
	initialCollections,
	initialZones,
	initialCoupons,
}: Props) {
	const [collections, setCollections] = useState(initialCollections);
	const [zones, setZones] = useState(initialZones);
	const [coupons, setCoupons] = useState(initialCoupons);

	const [colName, setColName] = useState('');
	const [colImg, setColImg] = useState('');
	const [zoneName, setZoneName] = useState('');
	const [zoneFee, setZoneFee] = useState('');
	const [zoneFree, setZoneFree] = useState('');
	const [couponCode, setCouponCode] = useState('');
	const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
	const [couponVal, setCouponVal] = useState('');
	const [couponMin, setCouponMin] = useState('');
	const [msg, setMsg] = useState('');
	const [err, setErr] = useState('');

	async function addCollection(e: React.SyntheticEvent) {
		e.preventDefault();
		setErr('');
		const res = await fetch('/api/admin/collections', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: colName, imageUrl: colImg || undefined }),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) return setErr(data.error || 'خطأ');
		setColName('');
		setColImg('');
		const listRes = await fetch('/api/admin/collections');
		setCollections(((await listRes.json()) as { collections: Collection[] }).collections || []);
	}

	async function removeCollection(id: string) {
		setErr('');
		const res = await fetch(`/api/admin/collections?id=${encodeURIComponent(id)}`, {
			method: 'DELETE',
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) return setErr(data.error || 'تعذر الحذف');
		setCollections(collections.filter((c) => c.id !== id));
	}

	async function addZone(e: React.SyntheticEvent) {
		e.preventDefault();
		const res = await fetch('/api/admin/shipping', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: zoneName,
				fee: Number(zoneFee || 0),
				freeShippingThreshold: zoneFree ? Number(zoneFree) : null,
			}),
		});
		if (res.ok) {
			setZoneName('');
			setZoneFee('');
			setZoneFree('');
			const listRes = await fetch('/api/admin/shipping');
			setZones(((await listRes.json()) as { zones: ShippingZone[] }).zones || []);
		}
	}

	async function removeZone(id: string) {
		const res = await fetch(`/api/admin/shipping?id=${encodeURIComponent(id)}`, {
			method: 'DELETE',
		});
		if (res.ok) setZones(zones.filter((z) => z.id !== id));
	}

	async function addCoupon(e: React.SyntheticEvent) {
		e.preventDefault();
		setErr('');
		const res = await fetch('/api/admin/coupons', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code: couponCode,
				type: couponType,
				value: Number(couponVal || 0),
				minSubtotal: couponMin ? Number(couponMin) : null,
			}),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) return setErr(data.error || 'خطأ');
		setCouponCode('');
		setCouponVal('');
		setCouponMin('');
		const listRes = await fetch('/api/admin/coupons');
		setCoupons(((await listRes.json()) as { coupons: Coupon[] }).coupons || []);
	}

	async function toggleCoupon(c: Coupon) {
		const res = await fetch('/api/admin/coupons', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
		});
		if (res.ok) {
			setCoupons(coupons.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
		}
	}

	async function removeCoupon(id: string) {
		const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
			method: 'DELETE',
		});
		if (res.ok) setCoupons(coupons.filter((c) => c.id !== id));
	}

	return (
		<div className="space-y-5">
			{err && <p className="text-xs font-bold text-rose-400">{err}</p>}
			{msg && <p className="text-xs font-bold text-emerald-400">{msg}</p>}

			<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
				<h2 className="font-bold text-base">الأقسام (Collections)</h2>
				<form onSubmit={addCollection} className="grid sm:grid-cols-3 gap-2">
					<input
						required
						placeholder="اسم القسم الجديد"
						value={colName}
						onChange={(e) => setColName(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						placeholder="رابط الصورة (اختياري)"
						value={colImg}
						onChange={(e) => setColImg(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<button
						type="submit"
						className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-extrabold"
					>
						إضافة قسم
					</button>
				</form>
				<div className="space-y-1.5 text-xs">
					{collections.map((c) => (
						<div
							key={c.id}
							className="flex justify-between items-center py-1.5 border-b border-slate-800"
						>
							<span>{c.name}</span>
							<button
								type="button"
								onClick={() => removeCollection(c.id)}
								className="text-rose-400"
							>
								حذف
							</button>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
				<h2 className="font-bold text-base">مناطق الشحن</h2>
				<form onSubmit={addZone} className="grid sm:grid-cols-4 gap-2">
					<input
						required
						placeholder="المحافظة"
						value={zoneName}
						onChange={(e) => setZoneName(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						type="number"
						required
						placeholder="السعر"
						value={zoneFee}
						onChange={(e) => setZoneFee(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						type="number"
						placeholder="شحن مجاني فوق (اختياري)"
						value={zoneFree}
						onChange={(e) => setZoneFree(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<button
						type="submit"
						className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-extrabold"
					>
						إضافة
					</button>
				</form>
				<div className="space-y-1.5 text-xs">
					{zones.map((z) => (
						<div key={z.id} className="flex justify-between py-1.5 border-b border-slate-800">
							<span>
								{z.name} ({z.fee})
							</span>
							<button type="button" onClick={() => removeZone(z.id)} className="text-rose-400">
								حذف
							</button>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
				<h2 className="font-bold text-base">كوبونات الخصم</h2>
				<form onSubmit={addCoupon} className="grid sm:grid-cols-5 gap-2">
					<input
						required
						placeholder="WELCOME10"
						value={couponCode}
						onChange={(e) => setCouponCode(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<select
						value={couponType}
						onChange={(e) => setCouponType(e.target.value as 'percentage' | 'fixed')}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					>
						<option value="percentage">نسبة %</option>
						<option value="fixed">مبلغ ثابت</option>
					</select>
					<input
						type="number"
						required
						placeholder="القيمة"
						value={couponVal}
						onChange={(e) => setCouponVal(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<input
						type="number"
						placeholder="حد أدنى (اختياري)"
						value={couponMin}
						onChange={(e) => setCouponMin(e.target.value)}
						className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
					/>
					<button
						type="submit"
						className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-extrabold"
					>
						إنشاء
					</button>
				</form>
				<div className="space-y-1.5 text-xs">
					{coupons.map((c) => (
						<div
							key={c.id}
							className="flex justify-between items-center py-1.5 border-b border-slate-800"
						>
							<span>
								<strong className="font-mono">{c.code}</strong> ({c.value}
								{c.type === 'percentage' ? '%' : ''})
							</span>
							<div className="flex gap-3">
								<button type="button" onClick={() => toggleCoupon(c)} className="text-sky-400">
									{c.isActive ? 'تعطيل' : 'تفعيل'}
								</button>
								<button type="button" onClick={() => removeCoupon(c.id)} className="text-rose-400">
									حذف
								</button>
							</div>
						</div>
					))}
				</div>
			</section>

			<SettingsPasswordCard onError={setErr} onSuccess={setMsg} />
		</div>
	);
}
