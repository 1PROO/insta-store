import { useState } from 'react';
import type { LookbookSlide } from '../../lib/domain/types';
import { sanitizeHref } from '../../lib/security/urls';

interface Props {
	slides: LookbookSlide[];
}

export default function LookbookSlideshow({ slides }: Props) {
	const [index, setIndex] = useState(0);

	if (!slides.length) return null;
	const active = slides[index] ?? slides[0];
	if (!active) return null;

	return (
		<section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-16">
			<div className="relative overflow-hidden store-card h-[400px] sm:h-[480px] bg-neutral-900">
				<img
					src={active.imageUrl}
					alt={active.title}
					loading="lazy"
					className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

				<div className="relative z-10 h-full p-6 sm:p-10 flex flex-col justify-end text-white max-w-lg">
					<h2 className="text-2xl sm:text-3xl font-extrabold mb-2">{active.title}</h2>
					<p className="text-xs sm:text-sm text-white/85 mb-5 leading-relaxed">{active.subtitle}</p>
					<div>
						<a
							href={sanitizeHref(active.ctaHref, '/shop')}
							className="inline-block px-5 py-2.5 text-xs font-bold"
							style={{
								backgroundColor: 'var(--btn-bg)',
								color: 'var(--btn-text)',
								borderRadius: 'var(--radius-btn)',
							}}
						>
							{active.ctaLabel}
						</a>
					</div>
				</div>

				{slides.length > 1 && (
					<div className="absolute bottom-4 end-4 z-20 flex items-center gap-1">
						{slides.map((s, idx) => (
							<button
								key={s.id}
								type="button"
								aria-label={`Slide ${idx + 1}`}
								aria-current={idx === index ? 'true' : undefined}
								onClick={() => setIndex(idx)}
								className="p-2 inline-flex items-center justify-center"
							>
								<span
									className={`h-2 rounded-full transition-all block ${
										idx === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
									}`}
								/>
							</button>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
