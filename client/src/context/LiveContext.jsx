'use client';
import { createContext, useContext, useEffect, useRef, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { params } from "./RadioContext";
import { RoomEvent, Track, ConnectionQuality } from "livekit-client";
const LiveContext = createContext();

// Adaptive music track names (must match broadcaster's publish names).
const SONG_HD_TRACK = 'song-hd';
const SONG_LO_TRACK = 'song-lo';
const isSongTrackName = (n) => n === SONG_HD_TRACK || n === SONG_LO_TRACK;

// Keep the browser jitter buffer small. Left alone it grows on every song
// cut and the listener ends up seconds behind the studio.
const JITTER_TARGET_MS = 120;
const FLUSH_DELAY_SEC = 1;

function pinTrackLatency(track) {
    try {
        track.setPlayoutDelay?.(0);
    } catch (e) { /* unsupported */ }
    const receiver = track?.receiver;
    if (receiver && 'jitterBufferTarget' in receiver) {
        try {
            receiver.jitterBufferTarget = JITTER_TARGET_MS;
        } catch (e) { /* browser rejected the target */ }
    }
}

async function readJitterStats(track) {
    try {
        const report = await track.getRTCStatsReport?.();
        if (!report) return null;
        let found = null;
        report.forEach((stat) => {
            if (stat.type === 'inbound-rtp' && stat.kind === 'audio' && stat.jitterBufferEmittedCount) {
                found = stat;
            }
        });
        return found;
    } catch (e) {
        return null;
    }
}


export const LiveProvider = ({ children }) => {
    const { isConnected, roomRef, connect } = useConnect();
    const [isLive, setIsLive] = useState(false);
    const [roomActive, setRoomActive] = useState(false);
    const [isPlay, setIsPlay] = useState(false);
    const [IsTonePlayingMessage, setIsTonePlayingMessage] = useState(null);
    // 'hd' | 'lo' — exposed so UI can show current auto-selected quality.
    const [audioQuality, setAudioQuality] = useState('hd');
    // 'excellent' | 'good' | 'poor' | 'lost' | 'unknown' — this listener's network.
    const [connectionQuality, setConnectionQuality] = useState('unknown');

    const isPlayRef = useRef(false);
    const desiredQualityRef = useRef('hd');
    const songPublicationsRef = useRef(new Map());
    const qualityDebounceRef = useRef(null);
    const liveTracksRef = useRef(new Map());
    const lastFlushRef = useRef(new Map());
    const prevJitterRef = useRef(new Map());

    useEffect(() => {
        isPlayRef.current = isPlay;
    }, [isPlay]);

    const desiredSongName = () =>
        desiredQualityRef.current === 'lo' ? SONG_LO_TRACK : SONG_HD_TRACK;

    // Subscribe only to the desired-quality music track; drop the other.
    const applySongSubscription = () => {
        const want = desiredSongName();
        songPublicationsRef.current.forEach((pub) => {
            try {
                pub.setSubscribed(pub.trackName === want);
            } catch (e) {
                /* publication may be gone */
            }
        });
    };


    useEffect(() => {
        roomRef.current.on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
        });

        roomRef.current.on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant disconnected:', participant.identity);
        });


        // Track the adaptive music publications as they appear so we can
        // switch subscription later without waiting for a subscribe event.
        roomRef.current.on(RoomEvent.TrackPublished, (publication, participant) => {
            if (participant.identity === 'admin' && isSongTrackName(publication.trackName)) {
                songPublicationsRef.current.set(publication.trackName, publication);
                applySongSubscription();
            }
        });


        roomRef.current.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, participant.identity, publication?.trackName);


            if (participant.identity === 'tone-player-bot') {
                setIsTonePlayingMessage("Tone Is Playing...");
                handleTrackSubscribed(track, publication, () => {
                    setIsPlay(true);
                });
            }

            if (participant.identity === 'admin' && track.source == Track.Source.Microphone) {
                setIsLive(true);
                setRoomActive(true);
                const audioRef = document.getElementById('auto-dj');
                audioRef.pause();
                audioRef.volume = 0;
                handleTrackSubscribed(track, publication, () => {
                    setIsPlay(true);
                });
            }


            if (participant.identity === 'admin' && track.source !== Track.Source.Microphone) {
                const name = publication?.trackName;

                // Adaptive music: only attach the quality we currently want.
                if (isSongTrackName(name)) {
                    songPublicationsRef.current.set(name, publication);
                    if (name !== desiredSongName()) {
                        try { publication.setSubscribed(false); } catch (e) { /* noop */ }
                        return;
                    }
                }

                handleTrackSubscribed(track, publication, () => {
                    setIsPlay(true);
                });
            }

            if (participant.identity.includes('call')) {
                pinTrackLatency(track);
                liveTracksRef.current.set(track, publication);
                const audioElement = document.createElement('audio');
                audioElement.preload = 'none';
                audioElement.playsInline = true;
                track.attach(audioElement);
                document.body.appendChild(audioElement);
                pinTrackLatency(track);
                if (isPlayRef.current) {
                    audioElement.play();
                }
            }
        });

        roomRef.current.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);

            if (participant.identity === 'tone-player-bot') {
                setIsTonePlayingMessage(null);
            }

            if (participant.identity === 'admin' && track.source == Track.Source.Microphone) {
                setIsLive(false);
                setRoomActive(false);
                const audioRef = document.getElementById('auto-dj');
                audioRef.play();
                audioRef.volume = 1;
            }

            liveTracksRef.current.delete(track);
            track.detach();
        });

        // Re-pin the jitter target so delay cannot drift up over a long show.
        // Delta (not lifetime average) of jitterBufferDelay is the current lag.
        // Past 1s, resubscribe once — that builds a fresh receiver buffer.
        const latencyTimer = setInterval(() => {
            liveTracksRef.current.forEach((publication, track) => {
                pinTrackLatency(track);
                readJitterStats(track).then((stat) => {
                    if (!stat || !liveTracksRef.current.has(track)) return;
                    const sid = track.sid || track.mediaStreamTrack?.id;
                    const prev = prevJitterRef.current.get(sid);
                    prevJitterRef.current.set(sid, {
                        delay: stat.jitterBufferDelay,
                        count: stat.jitterBufferEmittedCount,
                    });
                    if (!prev) return;
                    const dCount = stat.jitterBufferEmittedCount - prev.count;
                    const dDelay = stat.jitterBufferDelay - prev.delay;
                    if (dCount <= 0) return;
                    const instant = dDelay / dCount;
                    if (instant < FLUSH_DELAY_SEC) return;
                    // Resubscribing the mic track looks like the DJ left and
                    // flips the listener back to Auto DJ. Leave that track up.
                    if (track.source === Track.Source.Microphone) return;
                    const last = lastFlushRef.current.get(sid) || 0;
                    if (Date.now() - last < 30000) return;
                    lastFlushRef.current.set(sid, Date.now());
                    try {
                        publication.setSubscribed(false);
                        setTimeout(() => {
                            try { publication.setSubscribed(true); } catch (e) { /* gone */ }
                        }, 200);
                    } catch (e) { /* publication already ended */ }
                });
            });
        }, 3000);


        // Auto-select audio quality based on THIS listener's network quality.
        roomRef.current.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
            if (!participant?.isLocal) return;

            setConnectionQuality(quality);

            const want =
                (quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost)
                    ? 'lo'
                    : 'hd';

            if (want === desiredQualityRef.current) return;

            // Debounce to avoid flapping between qualities on brief fluctuations.
            if (qualityDebounceRef.current) clearTimeout(qualityDebounceRef.current);
            qualityDebounceRef.current = setTimeout(() => {
                desiredQualityRef.current = want;
                setAudioQuality(want);
                applySongSubscription();
                console.log(`🔀 Auto audio quality → ${want.toUpperCase()} (network: ${quality})`);
            }, 2500);
        });

        return () => {
            if (qualityDebounceRef.current) clearTimeout(qualityDebounceRef.current);
            clearInterval(latencyTimer);
        };
    }, [roomRef.current]);


    function handleTrackSubscribed(track, publication, cb) {
        pinTrackLatency(track);
        liveTracksRef.current.set(track, publication);
        const audioElement = document.createElement('audio');
        audioElement.autoplay = isPlayRef.current;
        audioElement.preload = 'none';
        audioElement.playsInline = true;
        audioElement.addEventListener('play', cb);
        track.attach(audioElement);
        document.body.appendChild(audioElement);
        pinTrackLatency(track);
        // If the listener was already playing (e.g. quality switch mid-song),
        // resume immediately on the newly attached track.
        if (isPlayRef.current) {
            audioElement.play().catch(() => { /* autoplay guard */ });
        }
    }

    useEffect(() => {
        if (params?.streamId) {
            connect(params?.streamId);
        }
    }, []);

    return (
        <LiveContext.Provider value={{ isConnected, roomRef, isLive, setIsLive, roomActive, setRoomActive, isPlay, setIsPlay, IsTonePlayingMessage, setIsTonePlayingMessage, audioQuality, connectionQuality }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => {
    return useContext(LiveContext);
}
