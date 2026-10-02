import { useEffect, useRef, useState } from 'react';

/**
 * YouTube-style buffer bar for live DJ streams.
 * Live WebRTC has no real buffered-bytes %. The bar shows on first connect
 * and when a LiveKit audio element actually stalls.
 */
export default function LiveBufferBar({ isLive, isPlay, roomActive, currentSong }) {
	const [progress, setProgress] = useState(0);
	const [visible, setVisible] = useState(false);
	const [label, setLabel] = useState('Connecting to live stream...');

	const animRef = useRef(null);
	const hideRef = useRef(null);
	const waitingRef = useRef(null);
	const songKeyRef = useRef('');
	const progressRef = useRef(0);
	const initialLoadDoneRef = useRef(false);

	const clearTimers = () => {
		if (animRef.current) {
			clearInterval(animRef.current);
			animRef.current = null;
		}
		if (hideRef.current) {
			clearTimeout(hideRef.current);
			hideRef.current = null;
		}
		if (waitingRef.current) {
			clearTimeout(waitingRef.current);
			waitingRef.current = null;
		}
	};

	const finishBar = () => {
		clearTimers();
		initialLoadDoneRef.current = true;
		setProgress(100);
		progressRef.current = 100;
		setLabel('Live');
		hideRef.current = setTimeout(() => {
			setVisible(false);
			setProgress(0);
			progressRef.current = 0;
		}, 500);
	};

	const startDummyLoad = (message = 'Loading song...') => {
		clearTimers();
		setVisible(true);
		setLabel(message);
		setProgress(8);
		progressRef.current = 8;

		animRef.current = setInterval(() => {
			setProgress((prev) => {
				let next = prev;
				if (prev < 70) next = prev + 12;
				else if (prev < 90) next = prev + 5;
				else next = Math.min(prev + 1.5, 98);

				progressRef.current = next;
				return next;
			});
		}, 120);
	};

	// Initial connect when DJ goes live
	useEffect(() => {
		if (!isLive || !roomActive) {
			clearTimers();
			setVisible(false);
			setProgress(0);
			progressRef.current = 0;
			songKeyRef.current = '';
			initialLoadDoneRef.current = false;
			return;
		}

		if (!isPlay && !initialLoadDoneRef.current && progressRef.current === 0) {
			startDummyLoad('Connecting to live stream...');
		}
	}, [isLive, roomActive, isPlay]);

	// Song change during live DJ
	useEffect(() => {
		if (!isLive || !currentSong?.title) return;

		const songKey = `${currentSong?._id || ''}-${currentSong?.title}`;
		if (songKeyRef.current === songKey) return;
		songKeyRef.current = songKey;

		// The LiveKit track stays up across song changes, so a metadata update
		// is not a stall. Only show the bar when playback has not started yet.
		if (!isPlay) startDummyLoad('Loading next song...');
	}, [isLive, isPlay, currentSong?._id, currentSong?.title]);

	// Complete when audio actually plays
	useEffect(() => {
		if (isLive && isPlay && visible) {
			finishBar();
		}
	}, [isLive, isPlay, visible]);

	// Real buffering gaps from attached LiveKit <audio> elements
	useEffect(() => {
		if (!isLive) return;

		const onWaiting = (event) => {
			const el = event.target;
			if (!(el instanceof HTMLMediaElement) || !el.srcObject) return;
			if (waitingRef.current) return;
			// Ignore sub-second blips. Only a real gap should show Buffering.
			waitingRef.current = setTimeout(() => {
				waitingRef.current = null;
				if (el.readyState >= 3 && !el.paused) return;
				setVisible(true);
				setLabel('Buffering...');
				setProgress((prev) => Math.max(prev, 35));
			}, 600);
		};

		const onPlaying = (event) => {
			const el = event.target;
			if (!(el instanceof HTMLMediaElement) || !el.srcObject) return;
			if (waitingRef.current) {
				clearTimeout(waitingRef.current);
				waitingRef.current = null;
			}
			if (isPlay) finishBar();
		};

		document.addEventListener('waiting', onWaiting, true);
		document.addEventListener('playing', onPlaying, true);

		return () => {
			document.removeEventListener('waiting', onWaiting, true);
			document.removeEventListener('playing', onPlaying, true);
		};
	}, [isLive, isPlay]);

	useEffect(() => () => clearTimers(), []);

	if (!isLive || !visible) return null;

	return (
		<div className="w-full mt-3 px-1">
			<div className="flex items-center justify-between mb-1">
				<span className="text-white/80 text-[11px] tracking-wide">{label}</span>
				<span className="text-white/90 text-[11px] font-medium tabular-nums">
					{Math.round(progress)}%
				</span>
			</div>
			<div className="w-full h-[3px] rounded-full bg-white/20 overflow-hidden">
				<div
					className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 transition-[width] duration-200 ease-out relative"
					style={{ width: `${progress}%` }}
				>
					<span className="absolute inset-0 bg-white/25 animate-pulse" />
				</div>
			</div>
		</div>
	);
}
