import { useEffect } from 'react';

interface Props {
	open: boolean;
	title: string;
	content: string | null;
	onClose: () => void;
}

export default function SizeGuideModal({ open, title, content, onClose }: Props) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open || !content) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
		>
			<div className="store-surface max-w-md w-full p-5 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-base">{title}</h2>
					<button type="button" aria-label="Close" onClick={onClose} className="text-lg font-bold">
						×
					</button>
				</div>
				<p
					className="text-sm whitespace-pre-line leading-relaxed"
					style={{ color: 'var(--text-muted)' }}
				>
					{content}
				</p>
			</div>
		</div>
	);
}
