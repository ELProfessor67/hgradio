'use client';
import { useEffect, useRef, useState } from 'react';
import { useLive } from '@/context/LiveContext';

// Tells a listener that buffering comes from their own connection, not the
// station. Shown only to someone who pressed Play, at most once per 30 minutes.
//
// Triggers: the browser goes offline; an audio element stalls for 3 s, or
// stalls twice within a minute (Auto DJ and live alike); LiveKit rates this
// listener's connection poor/lost for 5 s during a live show; Chrome reports a
// 2G-class network. Safari exposes no network type, so that one is a bonus.

const COOLDOWN_MS = 30 * 60 * 1000;
const STORAGE_KEY = 'hgc-net-warning-shown-at';
const STALL_MS = 3000;
const REPEAT_WINDOW_MS = 60 * 1000;
// Connecting to the stream after Play fires 'waiting' too; that is not a stall.
const STARTUP_GRACE_MS = 8000;
const POOR_QUALITY_MS = 5000;

let lastShownInMemory = 0;

function lastShownAt() {
	try {
		return Number(localStorage.getItem(STORAGE_KEY)) || lastShownInMemory;
	} catch (e) {
		return lastShownInMemory;
	}
}

function rememberShown(at) {
	lastShownInMemory = at;
	try {
		localStorage.setItem(STORAGE_KEY, String(at));
	} catch (e) { /* storage blocked: the in-memory value still limits it */ }
}

function isSlowNetworkType() {
	const type = typeof navigator !== 'undefined' ? navigator.connection?.effectiveType : null;
	return type === 'slow-2g' || type === '2g';
}

export default function NetworkWarning() {
	const { isPlay, isLive, connectionQuality } = useLive();
	const [variant, setVariant] = useState(null); // 'weak' | 'offline' | null

	const isPlayRef = useRef(isPlay);
	const startedAtRef = useRef(new WeakMap());
	const stallTimersRef = useRef(new Map());
	const recentStallsRef = useRef([]);

	useEffect(() => {
		isPlayRef.current = isPlay;
	}, [isPlay]);

	const trigger = (kind) => {
		if (!isPlayRef.current) return;
		const now = Date.now();
		if (now - lastShownAt() < COOLDOWN_MS) return;
		rememberShown(now);
		setVariant(kind);
	};

	// Offline / back online.
	useEffect(() => {
		const onOffline = () => trigger('offline');
		const onOnline = () => setVariant((v) => (v === 'offline' ? null : v));
		window.addEventListener('offline', onOffline);
		window.addEventListener('online', onOnline);
		return () => {
			window.removeEventListener('offline', onOffline);
			window.removeEventListener('online', onOnline);
		};
	}, []);

	// Real stalls on any <audio>: Auto DJ, live tracks, album tracks.
	useEffect(() => {
		const timers = stallTimersRef.current;

		const onPlay = (event) => {
			if (event.target instanceof HTMLMediaElement) {
				startedAtRef.current.set(event.target, Date.now());
			}
		};

		const onWaiting = (event) => {
			const el = event.target;
			if (!(el instanceof HTMLMediaElement) || el.paused) return;
			const startedAt = startedAtRef.current.get(el) || 0;
			if (Date.now() - startedAt < STARTUP_GRACE_MS) return;

			const now = Date.now();
			const recent = recentStallsRef.current.filter((t) => now - t < REPEAT_WINDOW_MS);
			recent.push(now);
			recentStallsRef.current = recent;
			if (recent.length >= 2) {
				trigger('weak');
				return;
			}

			if (timers.has(el)) return;
			timers.set(el, setTimeout(() => {
				timers.delete(el);
				if (!el.paused && el.readyState < 3) trigger('weak');
			}, STALL_MS));
		};

		const onPlaying = (event) => {
			const el = event.target;
			if (timers.has(el)) {
				clearTimeout(timers.get(el));
				timers.delete(el);
			}
		};

		document.addEventListener('play', onPlay, true);
		document.addEventListener('waiting', onWaiting, true);
		document.addEventListener('playing', onPlaying, true);
		return () => {
			document.removeEventListener('play', onPlay, true);
			document.removeEventListener('waiting', onWaiting, true);
			document.removeEventListener('playing', onPlaying, true);
			timers.forEach((t) => clearTimeout(t));
			timers.clear();
		};
	}, []);

	// LiveKit's own rating of this listener's connection, live shows only.
	useEffect(() => {
		if (!isLive || !isPlay) return;
		if (connectionQuality !== 'poor' && connectionQuality !== 'lost') return;
		const t = setTimeout(() => trigger('weak'), POOR_QUALITY_MS);
		return () => clearTimeout(t);
	}, [isLive, isPlay, connectionQuality]);

	// 2G-class network (Chrome / Android only).
	useEffect(() => {
		if (!isPlay) return;
		if (isSlowNetworkType()) trigger('weak');
		const connection = navigator.connection;
		if (!connection?.addEventListener) return;
		const onChange = () => {
			if (isSlowNetworkType()) trigger('weak');
		};
		connection.addEventListener('change', onChange);
		return () => connection.removeEventListener('change', onChange);
	}, [isPlay]);

	if (!variant) return null;

	const offline = variant === 'offline';

	return (
		<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="net-warning-title">
			<div className="w-full max-w-[420px] rounded-lg border border-[#D8B257]/40 bg-[#070D18] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
				<svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 h-10 w-10 text-[#D8B257]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
				</svg>
				<h2 id="net-warning-title" className="mb-2 text-xl font-bold text-white">
					{offline ? "You're offline" : 'Your internet connection looks weak'}
				</h2>
				<p className="mb-5 text-sm leading-relaxed text-white/75">
					{offline
						? 'The radio will start again when your internet comes back. Please check your Wi-Fi or mobile data.'
						: 'The radio needs a steady connection, so you may hear buffering or gaps. This is caused by your internet, not the station. Try switching to Wi-Fi or moving to a stronger signal.'}
				</p>
				<button
					onClick={() => setVariant(null)}
					className="rounded-md bg-[#D8B257] px-6 py-2 font-semibold text-[#070D18] transition hover:bg-[#e6c470]"
				>
					OK
				</button>
			</div>
		</div>
	);
}
