import { useState } from 'react';

interface Props {
	onError: (message: string) => void;
	onSuccess: (message: string) => void;
}

export default function SettingsPasswordCard({ onError, onSuccess }: Props) {
	const [curPwd, setCurPwd] = useState('');
	const [newPwd, setNewPwd] = useState('');

	async function changePassword(e: React.SyntheticEvent) {
		e.preventDefault();
		onError('');
		onSuccess('');
		const res = await fetch('/api/admin/account', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
		});
		const data = (await res.json()) as { ok: boolean; error?: string };
		if (!res.ok || !data.ok) return onError(data.error || 'خطأ');
		setCurPwd('');
		setNewPwd('');
		onSuccess('تم تغيير كلمة المرور وإلغاء الجلسات القديمة ✓');
	}

	return (
		<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
			<h2 className="font-bold text-base">تغيير كلمة المرور</h2>
			<form onSubmit={changePassword} className="grid sm:grid-cols-3 gap-2">
				<input
					type="password"
					required
					placeholder="كلمة المرور الحالية"
					value={curPwd}
					onChange={(e) => setCurPwd(e.target.value)}
					className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<input
					type="password"
					required
					placeholder="الجديدة (8+ أحرف)"
					value={newPwd}
					onChange={(e) => setNewPwd(e.target.value)}
					className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
				/>
				<button
					type="submit"
					className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold"
				>
					تحديث كلمة المرور
				</button>
			</form>
		</section>
	);
}
