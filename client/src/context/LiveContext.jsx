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
                handleTrackSubscribed(track, () => {
                    setIsPlay(true);
                });
            }

            if (participant.identity === 'admin' && track.source == Track.Source.Microphone) {
                setIsLive(true);
                setRoomActive(true);
                const audioRef = document.getElementById('auto-dj');
                audioRef.pause();
                audioRef.volume = 0;
                handleTrackSubscribed(track, () => {
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

                handleTrackSubscribed(track, () => {
                    setIsPlay(true);
                });
            }

            if (participant.identity.includes('call')) {
                const audioElement = document.createElement('audio');
                track.attach(audioElement);
                document.body.appendChild(audioElement);
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

            track.detach();
        });


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
        };
    }, [roomRef.current]);


    function handleTrackSubscribed(track, cb) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = isPlayRef.current;
        audioElement.addEventListener('play', cb);
        track.attach(audioElement);
        document.body.appendChild(audioElement);
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
