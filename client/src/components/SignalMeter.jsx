"use client";

import { useLive } from '@/context/LiveContext';

/**
 * Network signal meter for the listener.
 * Shows Poor / Fair / Good / Excellent with animated bars, driven by
 * LiveKit's per-listener connection quality.
 */

const QUALITY_MAP = {
	excellent: { label: 'Excellent', bars: 4, color: '#22c55e', text: 'text-green-400' },
	good: { label: 'Good', bars: 3, color: '#22c55e', text: 'text-green-400' },
	fair: { label: 'Fair', bars: 2, color: '#f59e0b', text: 'text-yellow-400' },
	poor: { label: 'Poor', bars: 1, color: '#ef4444', text: 'text-red-500' },
	lost: { label: 'No Signal', bars: 0, color: '#ef4444', text: 'text-red-500' },
	unknown: { label: 'Connecting', bars: 0, color: '#9ca3af', text: 'text-gray-400' },
};

// LiveKit reports excellent/good/poor/lost. We surface "fair" as a nicer
// middle state for "good" so users see a friendlier 4-step scale.
function normalizeQuality(q) {
	switch (q) {
		case 'excellent':
			return 'excellent';
		case 'good':
			return 'good';
		case 'poor':
			return 'poor';
		case 'lost':
			return 'lost';
		default:
			return 'unknown';
	}
}

export default function SignalMeter({ showLabel = true, className = '' }) {
	const { connectionQuality, isLive, audioQuality } = useLive();

	if (!isLive) return null;

	const key = normalizeQuality(connectionQuality);
	const info = QUALITY_MAP[key] || QUALITY_MAP.unknown;
	const barHeights = [6, 9, 12, 15];

	return (
		<div className={`flex items-center gap-2 ${className}`} title={`Network: ${info.label}`}>
			<div className="flex items-end gap-[2px] h-[15px]">
				{barHeights.map((h, i) => {
					const active = i < info.bars;
					return (
						<span
							key={i}
							className="w-[3px] rounded-sm transition-all duration-300"
							style={{
								height: `${h}px`,
								backgroundColor: active ? info.color : 'rgba(255,255,255,0.25)',
								boxShadow: active ? `0 0 4px ${info.color}80` : 'none',
								animation:
									active && key === 'unknown'
										? 'signal-pulse 1s ease-in-out infinite'
										: 'none',
							}}
						/>
					);
				})}
			</div>

			{showLabel && (
				<div className="flex flex-col leading-none">
					<span className={`text-[11px] font-semibold ${info.text}`}>{info.label}</span>
					{audioQuality && (
						<span className="text-[9px] text-white/60 uppercase tracking-wide">
							{audioQuality === 'lo' ? 'Low' : 'HD'} audio
						</span>
					)}
				</div>
			)}

			<style jsx>{`
				@keyframes signal-pulse {
					0%, 100% { opacity: 0.4; }
					50% { opacity: 1; }
				}
			`}</style>
		</div>
	);
}
